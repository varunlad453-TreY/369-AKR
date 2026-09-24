import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

let isSupabaseOffline = true;
let lastFailureTime = Date.now();

/**
 * Server-side Supabase Client for Route Handlers and Server Components.
 * Includes a fast-fail circuit breaker so that if the remote Supabase instance
 * is unreachable/offline, API routes instantly fall back to the in-memory store
 * without stalling the user interface on DNS timeouts.
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://mock-akr-project.supabase.co";
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    "mock-anon-key";

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    global: {
      fetch: async (url: any, options: any = {}) => {
        const now = Date.now();
        // Circuit breaker: Fast-fail if offline in the last 2 minutes
        if (isSupabaseOffline && now - lastFailureTime < 120000) {
          throw new Error("Supabase is offline (circuit breaker active)");
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1200);
        try {
          const res = await fetch(url, {
            ...options,
            signal: controller.signal,
          });
          return res;
        } catch (err: any) {
          isSupabaseOffline = true;
          lastFailureTime = Date.now();
          throw err;
        } finally {
          clearTimeout(timeoutId);
        }
      },
    },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options as Parameters<typeof cookieStore.set>[2])
          );
        } catch {
          // The `setAll` method was called from a Server Component.
        }
      },
    },
  });
}
