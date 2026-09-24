import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createAdminClient } from "@/lib/supabase/admin";

// Precomputed bcryptjs hash (12 rounds) for constant-time comparison when a username does not exist
// This completely neutralizes timing side-channel attacks and prevents username enumeration.
const DUMMY_BCRYPT_HASH = "$2b$12$ftooAlgDWp8Sjg7mgflAMeqecymU9OGUA1LjI6M0w3ry6SfPUp50K";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const identifier = String(body.username || body.email || "").trim();
    const cleanPassword = body.password ? String(body.password) : "";

    // 1. Uniform validation: return generic 400 for missing credentials
    if (!identifier || !cleanPassword) {
      return NextResponse.json(
        { success: false, error: "Invalid credentials" },
        { status: 400 }
      );
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "";

    let adminRecord: {
      id: string;
      username: string;
      password_hash: string;
      role: string;
      last_login?: string | null;
      full_name?: string | null;
    } | null = null;

    let supabase: ReturnType<typeof createAdminClient> | null = null;

    // 2. Query the system_admins table in the Supabase Identity Vault via privileged service role client
    try {
      supabase = createAdminClient();
      const { data, error: adminErr } = await supabase
        .from("system_admins")
        .select("id, username, password_hash, role, last_login")
        .ilike("username", identifier)
        .maybeSingle();

      if (!adminErr && data) {
        adminRecord = data;
      }
    } catch (sbErr) {
      console.warn("[Admin Login API] Identity vault query failed or timed out:", sbErr);
    }

    // Non-production fallback for offline local development and testing
    if (!adminRecord && process.env.NODE_ENV !== "production") {
      const cleanLower = identifier.toLowerCase();
      if (
        cleanLower === "superadmin" ||
        cleanLower === "superadmin@369akruniverse.in" ||
        cleanLower === "dispatcher@369akruniverse.in" ||
        cleanLower === "admin@369akruniverse.in"
      ) {
        adminRecord = {
          id: "a0000000-0000-0000-0000-000000000001",
          username: cleanLower.includes("@") ? cleanLower.split("@")[0] : cleanLower,
          password_hash: DUMMY_BCRYPT_HASH,
          role: "super_admin",
          last_login: null,
          full_name: "SuperAdmin Lead",
        };
      }
    }

    // 3. Constant-time cryptographic verification
    // Even if adminRecord is null (user not found), compare against DUMMY_BCRYPT_HASH so that
    // the operation consumes the exact same execution time (~100ms for 12 rounds), preventing timing side-channels.
    const targetHash = adminRecord ? adminRecord.password_hash : DUMMY_BCRYPT_HASH;
    const isPasswordValid = await bcrypt.compare(cleanPassword, targetHash);
    const isAuthenticated = Boolean(adminRecord && isPasswordValid);

    if (!isAuthenticated) {
      // Record failed authentication attempt in immutable audit trail
      if (supabase) {
        try {
          await supabase.from("audit_logs").insert({
            action: "ADMIN_LOGIN_FAILED",
            actor_type: "ADMIN",
            actor_identifier: identifier,
            ip_address: ip,
            user_agent: userAgent,
            metadata: { reason: "Invalid credentials supplied" },
          });
        } catch (logErr) {
          console.warn("[Admin Login API] Audit log warning:", logErr);
        }
      }

      // Generic constant-time error response prevents username enumeration
      return NextResponse.json(
        { success: false, error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // 4. Update last_login timestamp in system_admins table upon successful authentication
    if (supabase && adminRecord && adminRecord.id) {
      try {
        await supabase
          .from("system_admins")
          .update({ last_login: new Date().toISOString() })
          .eq("id", adminRecord.id);
      } catch (updateErr) {
        console.warn("[Admin Login API] Unable to update last_login timestamp:", updateErr);
      }
    }

    // 5. Log successful admin authentication in immutable audit trail
    if (supabase && adminRecord) {
      try {
        await supabase.from("audit_logs").insert({
          action: "ADMIN_LOGIN_SUCCESS",
          actor_type: "ADMIN",
          actor_identifier: adminRecord.username,
          resource_id: adminRecord.id,
          resource_type: "system_admins",
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
    }

    // 6. Construct administrative session payload
    const effectiveEmail = adminRecord!.username.includes("@")
      ? adminRecord!.username
      : `${adminRecord!.username}@369akruniverse.in`;

    const sessionPayload = {
      id: adminRecord!.id,
      username: adminRecord!.username,
      email: effectiveEmail,
      role: adminRecord!.role,
      fullName: adminRecord!.full_name || (adminRecord!.role === "super_admin" ? "SuperAdmin Lead" : "Central Dispatcher"),
      timestamp: Date.now(),
    };

    // 7. Secure hardened HTTP-only cookie configuration
    const response = NextResponse.json({
      success: true,
      admin: {
        id: adminRecord!.id,
        username: adminRecord!.username,
        email: effectiveEmail,
        role: adminRecord!.role,
      },
      redirectUrl: "/admin",
    });

    response.cookies.set("akr_admin_session", JSON.stringify(sessionPayload), {
      httpOnly: true, // Isolated from client-side JavaScript execution (XSS protection)
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict", // Immune to CSRF
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    });

    return response;
  } catch (err: unknown) {
    console.error("[Admin Login API Exception]", err);
    return NextResponse.json(
      { success: false, error: "Internal server error during administrative verification." },
      { status: 500 }
    );
  }
}
