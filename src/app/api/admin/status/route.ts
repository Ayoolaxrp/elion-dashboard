import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

async function requireAdmin() {
  const cookieStore = await cookies();
  const sb = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } });
  const { data: { user } } = await sb.auth.getUser();
  if (!user || !(process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).includes((user.email || '').toLowerCase())) return null;
  return user;
}

function getSupabase() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}

export const dynamic = "force-dynamic";

// GET - public read of visible components
export async function GET() {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("system_status")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ components: data || [] });
}

// PUT - admin update component status
export async function PUT(request: Request) {
  const supabase = getSupabase();
  const body = await request.json();
  const { id, status, note, is_visible } = body;

  if (!id || !status) {
    return NextResponse.json({ error: "id and status required" }, { status: 400 });
  }

  const { data, error } = await supabase
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

  return NextResponse.json({ component: data });
}

// POST - add new component
export async function POST(request: Request) {
  const supabase = getSupabase();
  const body = await request.json();
  const { component_name, status, note, sort_order } = body;

  if (!component_name) {
    return NextResponse.json({ error: "component_name required" }, { status: 400 });
  }

  const { data, error } = await supabase
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

  return NextResponse.json({ component: data });
}

// DELETE - remove component
export async function DELETE(request: Request) {
  const supabase = getSupabase();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("system_status")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ deleted: true });
}
