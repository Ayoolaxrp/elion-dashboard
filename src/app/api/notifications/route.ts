import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

function getSupabase() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}

export const dynamic = "force-dynamic";

// GET - List notifications (admin only)
export async function GET(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: { getAll: () => request.cookies.getAll(), setAll: () => {} },
  });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = getSupabase();
  const url = new URL(request.url);
  const unreadOnly = url.searchParams.get("unread") === "true";

  let query = admin.from("notifications").select("*").order("created_at", { ascending: false }).limit(100);
  if (unreadOnly) query = query.eq("is_read", false);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const unreadCount = (await admin.from("notifications").select("id", { count: "exact", head: true }).eq("is_read", false)).count || 0;

  return NextResponse.json({ notifications: data || [], unreadCount });
}

// POST - Create notification
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { type, title, message, metadata } = body;

  if (!type || !title) {
    return NextResponse.json({ error: "type and title required" }, { status: 400 });
  }

  const admin = getSupabase();
  const { data, error } = await admin
    .from("notifications")
    .insert({ type, title, message: message || "", metadata: metadata || {} })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ notification: data });
}

// PUT - Mark as read
export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { id, read_all } = body;

  const admin = getSupabase();

  if (read_all) {
    await admin.from("notifications").update({ is_read: true, read_at: new Date().toISOString() }).eq("is_read", false);
    return NextResponse.json({ ok: true });
  }

  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { error } = await admin.from("notifications").update({ is_read: true, read_at: new Date().toISOString() }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
