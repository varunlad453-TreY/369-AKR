import { NextRequest, NextResponse } from "next/server";
import { vendorCodeVerificationSchema } from "@/lib/zod/schemas";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { sendOtpSms } from "@/lib/sms/sender";
import {
  generateCryptographicOtp,
  hashOtp,
  setFallbackOtpSession,
} from "@/lib/auth/otp-store";
import { db } from "@/lib/state/mock-db";

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

    const cleanVendorCode = vendorCode.trim().toUpperCase();
    let subcontractor: any = null;
    let supabase: any = null;

    try {
      supabase = await createServerSupabaseClient();
      const { data: subData, error: subQueryError } = await supabase
        .from("subcontractors")
        .select("*")
        .eq("vendor_code", cleanVendorCode)
        .eq("is_active", true)
        .maybeSingle();

      if (subQueryError) {
        console.warn("[Vendor Login] Supabase error, falling back to in-memory store:", subQueryError.message);
      } else {
        subcontractor = subData;
      }
    } catch (sbErr: any) {
      console.warn("[Vendor Login] Supabase unreachable, fallback active:", sbErr?.message || sbErr);
    }

    // Fallback to in-memory DatabaseManager if Supabase is offline or subcontractor is stored locally
    if (!subcontractor) {
      const mockSub = db.getSubcontractorByVendorCode(cleanVendorCode);
      if (mockSub) {
        subcontractor = {
          id: mockSub.id,
          company_name: mockSub.companyName,
          phone_number: mockSub.phoneNumber,
          vendor_code: mockSub.vendorCode,
          is_active: mockSub.isActive,
        };
      }
    }

    if (!subcontractor) {
      return NextResponse.json(
        { success: false, error: "Invalid or inactive Vendor Code. Please contact AKR Dispatch." },
        { status: 403 }
      );
    }

    // 2. Enforce brute-force protection
    const phone = subcontractor.phone_number;
    const now = new Date();
    const windowMs = 10 * 60 * 1000; // 10 minutes sliding window
    const maxAttempts = 5;

    if (supabase) {
      try {
        const { data: rateRecord } = await supabase
          .from("otp_rate_limits")
          .select("*")
          .eq("phone_number", phone)
          .maybeSingle();

        if (rateRecord) {
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

              return NextResponse.json(
                {
                  success: false,
                  error: `Rate limit reached. Please wait ${retryAfterSeconds}s before requesting another OTP.`,
                  retryAfterSeconds,
                },
                { status: 429 }
              );
            } else {
              await supabase
                .from("otp_rate_limits")
                .update({ attempts_count: rateRecord.attempts_count + 1 })
                .eq("phone_number", phone);
            }
          } else {
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
          await supabase.from("otp_rate_limits").insert({
            phone_number: phone,
            attempts_count: 1,
            window_start: now.toISOString(),
            blocked_until: null,
          });
        }
      } catch (rateErr) {
        console.warn("[Vendor Login] Supabase rate limit tracking skipped:", rateErr);
      }
    }

    // 3. Cryptographically generate 6-digit OTP and SHA-256 hash
    const otp = generateCryptographicOtp();
    const otpHash = hashOtp(otp);
    const expiresAt = new Date(now.getTime() + windowMs).toISOString();

    // 4. Store the generated OTP in PostgreSQL subcontractors table if available
    if (supabase) {
      try {
        await supabase
          .from("subcontractors")
          .update({
            otp_hash: otpHash,
            otp_expires_at: expiresAt,
            otp_attempts: 0,
          })
          .eq("id", subcontractor.id);
      } catch (updateSubError: any) {
        console.warn("[Vendor Login] Supabase OTP save skipped:", updateSubError.message);
      }
    }

    // Always register in memory fallback store for resilience
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
    if (supabase) {
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
    }

    db.log({
      action: "OTP_REQUESTED",
      actorType: "GATEWAY",
      actorIdentifier: subcontractor.phone_number,
      resourceId: subcontractor.id,
      resourceType: "subcontractors",
      ipAddress: ip,
      userAgent: userAgent,
      metadata: {
        vendorCode: subcontractor.vendor_code,
        channel: "SMS",
        expiresAt,
      },
    });

    // 7. Return sanitized response to client
    const maskedPhone = subcontractor.phone_number.replace(
      /^(\+91)(\d{5})(\d{5})$/,
      "$1 $2 •••••"
    );

    const sessionPayload: {
      vendorCode: string;
      maskedPhone: string;
      expiresAt: string;
      demoOtp?: string;
    } = {
      vendorCode: subcontractor.vendor_code,
      maskedPhone,
      expiresAt,
    };

    // demoOtp is strictly stripped in production to prevent leaking OTPs to the client
    if (process.env.NODE_ENV !== "production") {
      sessionPayload.demoOtp = otp;
    }

    return NextResponse.json({
      success: true,
      session: sessionPayload,
    });
  } catch (err: unknown) {
    console.error("[Vendor Login API Error]", err);
    return NextResponse.json(
      { success: false, error: "Internal security gateway error" },
      { status: 500 }
    );
  }
}
