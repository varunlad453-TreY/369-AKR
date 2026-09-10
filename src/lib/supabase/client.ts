import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-side Supabase Client for Client Components ("use client").
 * Uses @supabase/ssr to interact with PostgreSQL and Realtime CDC WebSockets.
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://mock-akr-project.supabase.co";
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    "mock-anon-key";

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
