import { createClient } from "@supabase/supabase-js";

/**
 * Privileged Supabase Client for Administrative Operations.
 * Utilizes the SUPABASE_SERVICE_ROLE_KEY to bypass Row Level Security (RLS)
 * for querying identity vault tables such as public.system_admins.
 */
export function createAdminClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://gpwkxifefmygoexiepws.supabase.co";
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    "mock-anon-key";

  return createClient(supabaseUrl, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
