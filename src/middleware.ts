import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Enterprise Next.js Edge Middleware for 369 AKR UNIVERSE SOP.
 * Intercepts and guarantees RBAC authorization on all /admin/* endpoints.
 */
export async function middleware(request: NextRequest) {
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

  // 2. Initialize SSR client with automatic cookie synchronization
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

  // 3. Inspect authenticated Supabase session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/admin/login";
    loginUrl.searchParams.set("redirectedFrom", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 4. Cross-reference authenticated user identity with public.admins PostgreSQL table
  const { data: adminRecord, error: adminErr } = await supabase
    .from("admins")
    .select("id, email, role")
    .or(`auth_user_id.eq.${user.id},email.eq.${user.email}`)
    .maybeSingle();

  if (adminErr || !adminRecord) {
    console.warn(`[Admin Middleware] Unauthorized access attempt by ${user.email}`);
    const deniedUrl = request.nextUrl.clone();
    deniedUrl.pathname = "/admin/login";
    deniedUrl.searchParams.set("error", "unauthorized_admin");
    return NextResponse.redirect(deniedUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/admin/:path*",
  ],
};
