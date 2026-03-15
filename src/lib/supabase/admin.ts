import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Creates a Supabase admin client using the SERVICE_ROLE_KEY.
 * This client bypasses Row Level Security (RLS) entirely.
 * 
 * ⚠️ Only use this in server-side API routes (never in client components).
 * ⚠️ Always verify the user is an admin before using this client.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    console.warn("SUPABASE_SERVICE_ROLE_KEY not set — falling back to anon key");
    return createSupabaseClient(
      supabaseUrl,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
