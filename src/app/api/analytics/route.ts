import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json();
  const { event_type, page, session_id, metadata } = body;

  if (!event_type) {
    return NextResponse.json({ error: "event_type required" }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: { getAll: () => [], setAll: () => {} },
  });

  const { error } = await supabase.from("analytics_events").insert({
    event_type,
    page: page || null,
    session_id: session_id || null,
    metadata: metadata || {},
  });

  if (error) {
    console.error("[ANALYTICS]", error.message);
  }

  return NextResponse.json({ ok: true });
}
