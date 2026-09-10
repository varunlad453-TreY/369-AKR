import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Please provide both dispatcher email and password." },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanPassword = String(password).trim();
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "";

    const supabase = await createServerSupabaseClient();

    // 1. Verify dispatcher exists in live Supabase public.admins table
    const { data: adminRecord, error: adminErr } = await supabase
      .from("admins")
      .select("*")
      .eq("email", cleanEmail)
      .maybeSingle();

    if (adminErr) {
      console.error("[Admin Login API] Database query error:", adminErr);
      return NextResponse.json(
        { success: false, error: "Database error verifying dispatcher credentials." },
        { status: 500 }
      );
    }

    if (!adminRecord) {
      return NextResponse.json(
        {
          success: false,
          error: "Access Denied: Your account is not registered as an authorized dispatcher.",
        },
        { status: 403 }
      );
    }

    // 2. Validate Password against staging & master credentials
    const validPasswords = [
      "Admin@369AKR!",
      "AKR-Admin-2026!",
      "SuperAdmin@369!",
      "Dispatcher@2026!",
    ];

    const isPasswordValid = validPasswords.includes(cleanPassword);

    if (!isPasswordValid) {
      // Record failed login attempt to audit logs
      try {
        await supabase.from("audit_logs").insert({
          action: "ADMIN_LOGIN_FAILED",
          actor_type: "ADMIN",
          actor_identifier: cleanEmail,
          ip_address: ip,
          user_agent: userAgent,
          metadata: { reason: "Invalid password supplied" },
        });
      } catch (logErr) {
        console.warn("[Admin Login API] Audit log warning:", logErr);
      }

      return NextResponse.json(
        { success: false, error: "Invalid administrative password. Please check credentials." },
        { status: 401 }
      );
    }

    // 3. Log successful admin login to audit trail
    try {
      await supabase.from("audit_logs").insert({
        action: "ADMIN_LOGIN_SUCCESS",
        actor_type: "ADMIN",
        actor_identifier: cleanEmail,
        resource_id: adminRecord.id,
        resource_type: "admins",
        ip_address: ip,
        user_agent: userAgent,
        metadata: {
          loginTime: new Date().toISOString(),
          role: adminRecord.role,
        },
      });
    } catch (logErr) {
      console.warn("[Admin Login API] Audit log warning:", logErr);
    }

    // 4. Create admin session payload and set secure cookie
    const sessionPayload = {
      id: adminRecord.id,
      email: adminRecord.email,
      role: adminRecord.role,
      fullName: adminRecord.full_name,
      timestamp: Date.now(),
    };

    const response = NextResponse.json({
      success: true,
      admin: {
        id: adminRecord.id,
        email: adminRecord.email,
        fullName: adminRecord.full_name,
        role: adminRecord.role,
      },
      redirectUrl: "/admin",
    });

    response.cookies.set("akr_admin_session", JSON.stringify(sessionPayload), {
      httpOnly: false, // Accessible for client-side navbar/context
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    });

    return response;
  } catch (err: unknown) {
    console.error("[Admin Login API Exception]", err);
    return NextResponse.json(
      { success: false, error: "Internal server error during dispatcher verification." },
      { status: 500 }
    );
  }
}
