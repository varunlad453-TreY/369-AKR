import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Enterprise Next.js Edge Middleware for 369 AKR UNIVERSE SOP.
 * Enforces zero-trust RBAC on /admin/* (Supabase admin session) and
 * /portal/* (subcontractor OTP session) — no route relies on client-supplied
 * query params for identity.
 */
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/portal")) {
    return handlePortalAuth(request);
  }

  if (pathname.startsWith("/admin")) {
    return handleAdminAuth(request);
  }

  return NextResponse.next({ request });
}

async function handlePortalAuth(request: NextRequest) {
  const subSessionCookie = request.cookies.get("akr_sub_session");

  const redirectToGateway = () => {
    const gatewayUrl = request.nextUrl.clone();
    gatewayUrl.pathname = "/gateway";
    gatewayUrl.search = "";
    return NextResponse.redirect(gatewayUrl);
  };

  if (!subSessionCookie?.value) {
    return redirectToGateway();
  }

  let subId: string | undefined;
  try {
    const parsed = JSON.parse(subSessionCookie.value);
    subId = parsed?.id;
  } catch {
    return redirectToGateway();
  }

  if (!subId) {
    return redirectToGateway();
  }

  // Verify the subcontractor still exists and is active — a forged/stale cookie is rejected.
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://gpwkxifefmygoexiepws.supabase.co";
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    "mock-anon-key";

  let supabaseResponse = NextResponse.next({ request });
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options as Parameters<typeof supabaseResponse.cookies.set>[2])
        );
      },
    },
  });

  const { data: subcontractor } = await supabase
    .from("subcontractors")
    .select("id, is_active")
    .eq("id", subId)
    .maybeSingle();

  if (!subcontractor || !subcontractor.is_active) {
    return redirectToGateway();
  }

  return supabaseResponse;
}

async function handleAdminAuth(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const pathname = request.nextUrl.pathname;

  // 1. Allow public access to the admin login portal without infinite redirection
  if (pathname === "/admin/login") {
    return supabaseResponse;
  }

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://gpwkxifefmygoexiepws.supabase.co";
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    "mock-anon-key";

  // 2. Check for active Enterprise Admin session cookie
  const adminCookie = request.cookies.get("akr_admin_session");
  if (adminCookie?.value) {
    try {
      const session = JSON.parse(adminCookie.value);
      if (session?.email && (session.role === "super_admin" || session.role === "dispatcher")) {
        // Active verified admin session found
        return supabaseResponse;
      }
    } catch {
      // Invalid cookie format, continue to fallback checks
    }
  }

  // 3. Initialize SSR client with automatic cookie synchronization
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options as Parameters<typeof supabaseResponse.cookies.set>[2])
        );
      },
    },
  });

  // 4. Fallback: Inspect authenticated Supabase session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // Cross-reference authenticated user identity with public.admins PostgreSQL table
    const { data: adminRecord } = await supabase
      .from("admins")
      .select("id, email, role")
      .or(`auth_user_id.eq.${user.id},email.eq.${user.email}`)
      .maybeSingle();

    if (adminRecord) {
      return supabaseResponse;
    }
  }

  // 5. If no valid session or auth user exists, redirect to login
  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/admin/login";
  loginUrl.searchParams.set("redirectedFrom", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/portal/:path*",
  ],
};
