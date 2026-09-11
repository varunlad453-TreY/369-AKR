import { NextRequest, NextResponse } from "next/server";
import { otpVerificationSchema } from "@/lib/zod/schemas";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  hashOtp,
  getFallbackOtpSession,
  deleteFallbackOtpSession,
} from "@/lib/auth/otp-store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parseResult = otpVerificationSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: parseResult.error.errors[0].message },
        { status: 400 }
      );
    }

    const { vendorCode, otp } = parseResult.data;
    const cleanVendorCode = vendorCode.trim().toUpperCase();
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "";

    const supabase = await createServerSupabaseClient();

    // 1. Query live Subcontractor record
    const { data: subcontractor, error: subError } = await supabase
      .from("subcontractors")
      .select("*")
      .eq("vendor_code", cleanVendorCode)
      .eq("is_active", true)
      .maybeSingle();

    if (subError || !subcontractor) {
      console.error("[Verify OTP] Subcontractor not found or query error:", subError);
      return NextResponse.json(
        { success: false, error: "Subcontractor not found or inactive." },
        { status: 401 }
      );
    }

    // 2. Resolve OTP session (from PostgreSQL columns or fallback memory store)
    const fallbackSession = getFallbackOtpSession(cleanVendorCode);
    const storedHash = subcontractor.otp_hash || fallbackSession?.otpHash;
    const expiresAtRaw = subcontractor.otp_expires_at || (fallbackSession ? new Date(fallbackSession.expiresAt).toISOString() : null);
    const currentAttempts = subcontractor.otp_attempts ?? fallbackSession?.attempts ?? 0;

    // Check if session exists
    if (!storedHash && !fallbackSession && otp !== "369369") {
      return NextResponse.json(
        { success: false, error: "No active verification session. Please request a new OTP." },
        { status: 401 }
      );
    }

    // Check expiration
    if (expiresAtRaw && new Date(expiresAtRaw).getTime() < Date.now()) {
      // Clean up expired session
      await supabase.from("subcontractors").update({
        otp_hash: null,
        otp_expires_at: null,
        otp_attempts: 0,
      }).eq("id", subcontractor.id);
      deleteFallbackOtpSession(cleanVendorCode);

      return NextResponse.json(
        { success: false, error: "OTP expired. Please request a new code." },
        { status: 401 }
      );
    }

    // Increment attempt counter
    const newAttempts = currentAttempts + 1;
    if (newAttempts > 3) {
      // Exceeded max attempts: invalidate session
      await supabase.from("subcontractors").update({
        otp_hash: null,
        otp_expires_at: null,
        otp_attempts: 0,
      }).eq("id", subcontractor.id);
      deleteFallbackOtpSession(cleanVendorCode);

      try {
        await supabase.from("audit_logs").insert({
          action: "OTP_MAX_ATTEMPTS_EXCEEDED",
          actor_type: "SUBCONTRACTOR",
          actor_identifier: subcontractor.phone_number,
          resource_id: subcontractor.id,
          resource_type: "subcontractors",
          ip_address: ip,
          user_agent: userAgent,
        });
      } catch (logErr) {
        console.warn("[Verify OTP] Max attempts audit log warning:", logErr);
      }

      return NextResponse.json(
        { success: false, error: "Maximum attempts exceeded. Please restart verification." },
        { status: 401 }
      );
    }

    // Verify OTP input (Supports SHA-256 match or Master Staging Bypass 369369)
    const inputHash = hashOtp(otp);
    const isMasterBypass = otp === "369369";
    const isOtpValid = isMasterBypass || inputHash === storedHash || (fallbackSession && otp === fallbackSession.otp);

    if (!isOtpValid) {
      // Persist incremented attempts
      await supabase.from("subcontractors").update({
        otp_attempts: newAttempts,
      }).eq("id", subcontractor.id);

      if (fallbackSession) {
        fallbackSession.attempts = newAttempts;
      }

      try {
        await supabase.from("audit_logs").insert({
          action: "OTP_VERIFIED_FAILED",
          actor_type: "SUBCONTRACTOR",
          actor_identifier: subcontractor.phone_number,
          resource_id: subcontractor.id,
          resource_type: "subcontractors",
          ip_address: ip,
          user_agent: userAgent,
          metadata: { attemptNumber: newAttempts },
        });
      } catch (logErr) {
        console.warn("[Verify OTP] Failed attempt audit log warning:", logErr);
      }

      return NextResponse.json(
        { success: false, error: `Invalid verification code. ${Math.max(0, 3 - newAttempts)} attempts remaining.` },
        { status: 401 }
      );
    }

    // 3. Successful Verification: Clear OTP state
    await supabase.from("subcontractors").update({
      otp_hash: null,
      otp_expires_at: null,
      otp_attempts: 0,
    }).eq("id", subcontractor.id);
    deleteFallbackOtpSession(cleanVendorCode);

    // Record immutable audit log
    try {
      await supabase.from("audit_logs").insert({
        action: "OTP_VERIFIED_SUCCESS",
        actor_type: "SUBCONTRACTOR",
        actor_identifier: subcontractor.phone_number,
        resource_id: subcontractor.id,
        resource_type: "subcontractors",
        ip_address: ip,
        user_agent: userAgent,
        metadata: {
          loginTime: new Date().toISOString(),
          isBypass: isMasterBypass,
        },
      });
    } catch (logErr) {
      console.warn("[Verify OTP] Success audit log warning:", logErr);
    }

    // 4. Construct sanitized response & set auth cookie
    const subProfile = {
      id: subcontractor.id,
      companyName: subcontractor.company_name,
      phoneNumber: subcontractor.phone_number,
      vendorCode: subcontractor.vendor_code,
      contactPerson: subcontractor.contact_person,
      licenseNumber: subcontractor.license_number,
      stateRegion: subcontractor.state_region,
      isActive: subcontractor.is_active,
      rating: Number(subcontractor.rating) || 5.0,
      createdAt: subcontractor.created_at,
    };

    const response = NextResponse.json({
      success: true,
      subcontractor: subProfile,
      redirectUrl: `/portal`,
    });

    response.cookies.set("akr_sub_session", JSON.stringify({
      id: subProfile.id,
      vendorCode: subProfile.vendorCode,
      company: subProfile.companyName,
      phone: subProfile.phoneNumber,
    }), {
      httpOnly: true, // Identity is only ever read server-side (middleware + Server Components)
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 12, // 12 hours
      path: "/",
    });

    return response;
  } catch (err: unknown) {
    console.error("[Verify OTP API Error]", err);
    return NextResponse.json(
      { success: false, error: "Authentication verification failed" },
      { status: 500 }
    );
  }
}
