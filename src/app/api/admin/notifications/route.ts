import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

// Auth check: real session cookies so getUser() sees the login.
async function requireAdmin() {
  const cookieStore = await cookies();
  const authClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return null;
  const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase());
  if (!adminEmails.includes((user.email || "").toLowerCase())) return null;
  return user;
}

// Data client: service role bypasses RLS (notifications only allows service_role).
function getDataClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

// GET - list notifications
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sb = getDataClient();
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
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sb = getDataClient();
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
