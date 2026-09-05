/**
 * Portal Onboarding Form API (save + resume)
 *
 * POST /api/client/portal/onboarding-form  { step: 1-4, data: {...} }
 *   Upserts one step's data per request. A step is only marked saved after a
 *   successful DB write ("Saved" indicator is truthful). Re-running a step
 *   overwrites that step only - idempotent, no duplicate rows (UNIQUE client).
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();

  // Authenticate the browser session with the anon key (mirrors /api/auth/me).
  const authClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
  );

  const { data: { user }, error: authError } = await authClient.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Mutable DB writes use the service role key.
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: client, error: clientError } = await sb
    .from("clients")
    .select("id")
    .or("auth_user_id.eq." + user.id + ",email.eq." + user.email)
    .single();
  if (clientError || !client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  const body = await request.json().catch(() => null);
  const step = Number(body?.step);
  const payload = body?.data;
  if (![1, 2, 3, 4].includes(step) || !payload || typeof payload !== "object") {
    return NextResponse.json({ error: "Invalid step or data" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const { error } = await sb.from("portal_onboarding_form").upsert(
    {
      client_id: client.id,
      current_step: step,
      [`step${step}_data`]: payload,
      [`step${step}_saved_at`]: now,
      updated_at: now,
    },
    { onConflict: "client_id" }
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, step, saved_at: now });
}
