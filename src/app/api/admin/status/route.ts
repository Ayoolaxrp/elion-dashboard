import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
}

async function requireAdmin() {
  const sb = await getSupabase();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;
  const admins = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  return admins.includes((user.email || "").toLowerCase()) ? user : null;
}

export const dynamic = "force-dynamic";

// Severity ranking for daily-snapshot "worst status of the day" semantics.
const RANK: Record<string, number> = {
  "major-outage": 5,
  "partial-outage": 4,
  degraded: 3,
  maintenance: 2,
  operational: 1,
  "not-configured": 0,
};

// GET - admins see every component (visible or not); the public API surface
// only ever returns deliberately public, configured components. Internal or
// unconfigured infrastructure (n8n, WhatsApp, CRM, payments…) is never
// exposed to logged-out callers.
export async function GET() {
  const admin = await requireAdmin();
  const sb = await getSupabase();

  let query = sb.from("system_status").select("*").order("sort_order", { ascending: true });
  if (!admin) {
    query = query.eq("is_visible", true).neq("status", "not-configured");
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ components: data || [], admin: !!admin });
}

// Record (or worsen) today's daily snapshot when a status changes, so the
// uptime bars reflect real admin-set state rather than a stale seed.
async function recordTodaySnapshot(sb: ReturnType<typeof createServerClient>, componentId: string, status: string) {
  const today = new Date().toISOString().slice(0, 10);
  const { data: existing } = await sb
    .from("status_daily_snapshots")
    .select("worst_status")
    .eq("component_id", componentId)
    .eq("date", today)
    .maybeSingle();

  const current = existing?.worst_status || "operational";
  const worst = RANK[status] > RANK[current] ? status : current;
  const { error } = await sb
    .from("status_daily_snapshots")
    .upsert({ component_id: componentId, date: today, worst_status: worst }, { onConflict: "component_id,date" });
  if (error) console.error("snapshot upsert failed", error.message);
}

// PUT - admin update component status / note / visibility
export async function PUT(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sb = await getSupabase();
  const body = await request.json();
  const { id, status, note, is_visible } = body;

  if (!id || !status) {
    return NextResponse.json({ error: "id and status required" }, { status: 400 });
  }
  if (!(status in RANK)) {
    return NextResponse.json({ error: "invalid status" }, { status: 400 });
  }

  const { data, error } = await sb
    .from("system_status")
    .update({
      status,
      note: note || "",
      is_visible: is_visible !== false,
      updated_at: new Date().toISOString(),
      updated_by: "admin",
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // The public 30-day bar for today reflects this change.
  await recordTodaySnapshot(sb, id, status);

  return NextResponse.json({ component: data });
}

// POST - admin add a new component (seeds today's snapshot)
export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sb = await getSupabase();
  const body = await request.json();
  const { component_name, status, note, sort_order } = body;

  if (!component_name) {
    return NextResponse.json({ error: "component_name required" }, { status: 400 });
  }

  const { data, error } = await sb
    .from("system_status")
    .insert({
      component_name,
      status: status || "operational",
      note: note || "",
      sort_order: sort_order || 99,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await recordTodaySnapshot(sb, data.id, data.status);

  return NextResponse.json({ component: data });
}

// DELETE - admin remove component
export async function DELETE(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sb = await getSupabase();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const { error } = await sb
    .from("system_status")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ deleted: true });
}
