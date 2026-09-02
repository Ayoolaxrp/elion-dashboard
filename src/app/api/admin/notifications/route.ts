import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

async function getAdmin() {
  const cookieStore = await cookies();
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
  );
  const { data: { user } } = await sb.auth.getUser();
  if (!user || !(process.env.ADMIN_EMAILS || "").split(",").map(e => e.trim().toLowerCase()).includes((user.email || "").toLowerCase())) return null;
  return sb;
}

// GET - list notifications
export async function GET() {
  const sb = await getAdmin();
  if (!sb) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await sb
    .from("notifications")
    .select("*, clients(company_name, contact_name)")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const unread = (data || []).filter((n: any) => !n.is_read).length;

  return NextResponse.json({ notifications: data, unread });
}

// PATCH - mark notification as read
export async function PATCH(request: Request) {
  const sb = await getAdmin();
  if (!sb) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { id, mark_all } = body;

  if (mark_all) {
    await sb
      .from("notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("is_read", false);
  } else if (id) {
    await sb
      .from("notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("id", id);
  }

  return NextResponse.json({ success: true });
}
