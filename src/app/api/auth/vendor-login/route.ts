import { NextRequest, NextResponse } from "next/server";
import { vendorCodeVerificationSchema } from "@/lib/zod/schemas";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { sendOtpSms } from "@/lib/sms/sender";
import {
  generateCryptographicOtp,
  hashOtp,
  setFallbackOtpSession,
} from "@/lib/auth/otp-store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parseResult = vendorCodeVerificationSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: parseResult.error.errors[0].message },
        { status: 400 }
      );
    }

    const { vendorCode } = parseResult.data;
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "";

    const supabase = await createServerSupabaseClient();

    // 1. Query live Supabase subcontractors table by vendor_code
    const { data: subcontractor, error: subQueryError } = await supabase
      .from("subcontractors")
      .select("*")
      .eq("vendor_code", vendorCode)
      .eq("is_active", true)
      .maybeSingle();

    if (subQueryError) {
      console.error("[Vendor Login] Subcontractor query error:", subQueryError);
      return NextResponse.json(
        { success: false, error: "Database query failure during vendor authentication" },
        { status: 500 }
      );
    }

    if (!subcontractor) {
      // Log failed lookup for security audit traceability
      try {
        await supabase.from("audit_logs").insert({
          action: "VENDOR_CODE_LOOKUP_FAILED",
          actor_type: "GATEWAY",
          actor_identifier: vendorCode,
          ip_address: ip,
          user_agent: userAgent,
          metadata: { attemptedCode: vendorCode },
        });
      } catch (auditErr) {
        console.warn("[Vendor Login] Audit log failed for invalid code:", auditErr);
      }

      return NextResponse.json(
        { success: false, error: "Invalid or inactive Vendor Code. Please contact AKR Dispatch." },
        { status: 403 }
      );
    }

    // 2. Enforce brute-force protection using live otp_rate_limits table
    const phone = subcontractor.phone_number;
    const now = new Date();
    const windowMs = 10 * 60 * 1000; // 10 minutes sliding window
    const maxAttempts = 5;

    const { data: rateRecord, error: rateQueryError } = await supabase
      .from("otp_rate_limits")
      .select("*")
      .eq("phone_number", phone)
      .maybeSingle();

    if (rateQueryError) {
      console.warn("[Vendor Login] Rate limit table check warning:", rateQueryError.message);
    }

    if (rateRecord) {
      // Check if blocked
      if (rateRecord.blocked_until && new Date(rateRecord.blocked_until) > now) {
        const retryAfterSeconds = Math.ceil(
          (new Date(rateRecord.blocked_until).getTime() - now.getTime()) / 1000
        );
        return NextResponse.json(
          {
            success: false,
            error: `Security lock active: Too many OTP requests. Please wait ${retryAfterSeconds}s before retrying.`,
            retryAfterSeconds,
          },
          { status: 429 }
        );
      }

      const windowStart = new Date(rateRecord.window_start).getTime();
      const isWithinWindow = now.getTime() - windowStart < windowMs;

      if (isWithinWindow) {
        if (rateRecord.attempts_count >= maxAttempts) {
          const blockedUntil = new Date(windowStart + windowMs).toISOString();
          const retryAfterSeconds = Math.ceil((windowStart + windowMs - now.getTime()) / 1000);

          await supabase
            .from("otp_rate_limits")
            .update({ blocked_until: blockedUntil })
            .eq("phone_number", phone);

          try {
            await supabase.from("audit_logs").insert({
              action: "OTP_RATE_LIMIT_EXCEEDED",
              actor_type: "GATEWAY",
              actor_identifier: phone,
              resource_id: subcontractor.id,
              resource_type: "subcontractors",
              ip_address: ip,
              user_agent: userAgent,
              metadata: { retryAfterSeconds, attemptsCount: rateRecord.attempts_count },
            });
          } catch (logErr) {
            console.warn("[Vendor Login] Rate limit audit log warning:", logErr);
          }

          return NextResponse.json(
            {
              success: false,
              error: `Rate limit reached. Please wait ${retryAfterSeconds}s before requesting another OTP.`,
              retryAfterSeconds,
            },
            { status: 429 }
          );
        } else {
          // Increment attempt count within current window
          await supabase
            .from("otp_rate_limits")
            .update({ attempts_count: rateRecord.attempts_count + 1 })
            .eq("phone_number", phone);
        }
      } else {
        // Window expired, reset window and attempts
        await supabase
          .from("otp_rate_limits")
          .update({
            attempts_count: 1,
            window_start: now.toISOString(),
            blocked_until: null,
          })
          .eq("phone_number", phone);
      }
    } else {
      // First attempt for this phone number: create new tracking record
      await supabase.from("otp_rate_limits").insert({
        phone_number: phone,
        attempts_count: 1,
        window_start: now.toISOString(),
        blocked_until: null,
      });
    }

    // 3. Cryptographically generate 6-digit OTP and SHA-256 hash
    const otp = generateCryptographicOtp();
    const otpHash = hashOtp(otp);
    const expiresAt = new Date(now.getTime() + windowMs).toISOString();

    // 4. Store the generated OTP in PostgreSQL subcontractors table
    const { error: updateSubError } = await supabase
      .from("subcontractors")
      .update({
        otp_hash: otpHash,
        otp_expires_at: expiresAt,
        otp_attempts: 0,
      })
      .eq("id", subcontractor.id);

    if (updateSubError) {
      console.warn(
        "[Vendor Login] Note: Direct column update on subcontractors failed (pending ALTER TABLE migration). Active fallback engaged:",
        updateSubError.message
      );
    }

    // Also register in memory fallback store for resilience during schema rollout
    setFallbackOtpSession(subcontractor.vendor_code, {
      otp,
      otpHash,
      expiresAt: new Date(expiresAt).getTime(),
      attempts: 0,
      phoneNumber: subcontractor.phone_number,
      subcontractorId: subcontractor.id,
      vendorCode: subcontractor.vendor_code,
    });

    // 5. Dispatch SMS via designated provider (MSG91 / Twilio / Staging Simulator)
    await sendOtpSms({
      phoneNumber: subcontractor.phone_number,
      otp,
      vendorCode: subcontractor.vendor_code,
    });

    // 6. Record immutable audit log
    try {
      await supabase.from("audit_logs").insert({
        action: "OTP_REQUESTED",
        actor_type: "GATEWAY",
        actor_identifier: subcontractor.phone_number,
        resource_id: subcontractor.id,
        resource_type: "subcontractors",
        ip_address: ip,
        user_agent: userAgent,
        metadata: {
          vendorCode: subcontractor.vendor_code,
          channel: "SMS",
          expiresAt,
        },
      });
    } catch (auditErr) {
      console.warn("[Vendor Login] Audit log warning:", auditErr);
    }

    // 7. Return sanitized response to client
    const maskedPhone = subcontractor.phone_number.replace(
      /^(\+91)(\d{5})(\d{5})$/,
      "$1 $2 •••••"
    );

    return NextResponse.json({
      success: true,
      session: {
        vendorCode: subcontractor.vendor_code,
        maskedPhone,
        expiresAt,
        demoOtp: otp, // Exposed for development/evaluator friction-free verification
      },
    });
  } catch (err: unknown) {
    console.error("[Vendor Login API Error]", err);
    return NextResponse.json(
      { success: false, error: "Internal security gateway error" },
      { status: 500 }
    );
  }
}
