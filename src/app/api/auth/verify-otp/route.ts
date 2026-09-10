import { NextRequest, NextResponse } from "next/server";
import { otpVerificationSchema } from "@/lib/zod/schemas";
import { db } from "@/lib/state/mock-db";

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
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "";

    const verifyResult = db.verifyOtp(vendorCode, otp, ip, userAgent);

    if (!verifyResult.success || !verifyResult.subcontractor) {
      return NextResponse.json(
        { success: false, error: verifyResult.error },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
      subcontractor: verifyResult.subcontractor,
      redirectUrl: `/portal?subId=${verifyResult.subcontractor.id}`,
    });

    // Set secure HTTP-only session cookie
    response.cookies.set("akr_sub_session", JSON.stringify({
      id: verifyResult.subcontractor.id,
      vendorCode: verifyResult.subcontractor.vendorCode,
      company: verifyResult.subcontractor.companyName,
      phone: verifyResult.subcontractor.phoneNumber,
    }), {
      httpOnly: false, // Accessible to client-side auth context for portal UI
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
