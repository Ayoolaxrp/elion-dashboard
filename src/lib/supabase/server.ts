import { createClient } from "@supabase/supabase-js";

// Server-side client with service role key (for API routes, admin)
// NEVER expose the service role key to the browser
export function getSupabaseAdmin() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error("SUPABASE_URL environment variable is required");
  }
  if (!supabaseServiceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for server operations");
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// Health check
export async function checkDatabaseHealth(): Promise<{ ok: boolean; message: string }> {
  try {
    const admin = getSupabaseAdmin();
    const { error } = await admin.from("leads").select("id").limit(1);
    if (error) {
      return { ok: false, message: error.message };
    }
    return { ok: true, message: "Connected" };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "Unknown error" };
  }
}
