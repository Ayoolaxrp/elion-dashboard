/**
 * Portal Onboarding Form API (save + resume)
 *
 * POST /api/client/portal/onboarding-form  { step: 1-4, data: {...} }
 *   Upserts one step's data per request. A step is only marked saved after a
 *   successful DB write ("Saved" indicator is truthful). Re-running a step
 *   overwrites that step only - idempotent, no duplicate rows (UNIQUE client).
 */

import { NextRequest, NextResponse } from "next/server";
import { getClientSession } from "@/lib/auth/client";

export async function POST(request: NextRequest) {
  const session = await getClientSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { db: sb, client } = session;

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
