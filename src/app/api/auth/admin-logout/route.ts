import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const adminCookie = req.cookies.get("akr_admin_session");
    let email = "unknown";

    if (adminCookie?.value) {
      try {
        const parsed = JSON.parse(adminCookie.value);
        if (parsed?.email) email = parsed.email;
      } catch {
        // Ignore
      }
    }

    try {
      const supabase = await createServerSupabaseClient();
      await supabase.from("audit_logs").insert({
        action: "ADMIN_LOGOUT",
        actor_type: "ADMIN",
        actor_identifier: email,
        ip_address: req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1",
        metadata: { logoutTime: new Date().toISOString() },
      });
    } catch {
      // Non-fatal
    }

    const response = NextResponse.json({ success: true });

    // Invalidate cookie
    response.cookies.set("akr_admin_session", "", {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });

    return response;
  } catch (err: unknown) {
    return NextResponse.json({ success: false, error: "Logout error" }, { status: 500 });
  }
}
