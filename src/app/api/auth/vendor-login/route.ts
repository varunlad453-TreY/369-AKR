import { NextRequest, NextResponse } from "next/server";
import { vendorCodeVerificationSchema } from "@/lib/zod/schemas";
import { db } from "@/lib/state/mock-db";
import { sendOtpSms } from "@/lib/sms/sender";

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
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "";

    const otpResponse = db.requestOtpForVendorCode(vendorCode, ip, userAgent);

    if (!otpResponse.success || !otpResponse.session) {
      return NextResponse.json(
        { success: false, error: otpResponse.error },
        { status: 403 }
      );
    }

    // Dispatch SMS via provider (MSG91 / Twilio / Simulator)
    if (otpResponse.session.demoOtp) {
      await sendOtpSms({
        phoneNumber: otpResponse.session.phoneNumber,
        otp: otpResponse.session.demoOtp,
        vendorCode: otpResponse.session.vendorCode,
      });
    }

    return NextResponse.json({
      success: true,
      session: {
        vendorCode: otpResponse.session.vendorCode,
        maskedPhone: otpResponse.session.maskedPhone,
        expiresAt: otpResponse.session.expiresAt,
        // In non-prod/evaluator mode, pass the demoOtp so the user can easily test
        demoOtp: otpResponse.session.demoOtp,
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
