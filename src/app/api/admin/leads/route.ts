import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

// Data client: service role bypasses RLS.
const getDataClient = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

// Auth check: read the browser's real session cookies so getUser() sees the login.
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

const EDITABLE = ["contact_name", "email", "phone", "company_name", "website", "industry", "primary_problem", "lead_status", "audit_status", "source"];

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = getDataClient();

  // Migration 017 adds `archived_at`. Until it is applied the API reports
  // archiveSupported:false so the UI never offers a broken archive action.
  const withArchive = await supabase.from("leads").select("*, archived_at").order("created_at", { ascending: false }).limit(500);
  if (withArchive.error && /archived_at/.test(withArchive.error.message || "")) {
    const { data, error } = await supabase.from("leads").select("*").order("created_at", { ascending: false }).limit(500);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ leads: data || [], archiveSupported: false });
  }
  if (withArchive.error) return NextResponse.json({ error: withArchive.error.message }, { status: 500 });
  return NextResponse.json({ leads: withArchive.data || [], archiveSupported: true });
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const { contact_name, email, phone, whatsapp, company_name, website, industry, company_size, primary_problem, current_process, desired_outcome, enquiry_channels, lead_status, source } = body;
  if (!contact_name || !email) return NextResponse.json({ error: "contact_name and email required" }, { status: 400 });
  const supabase = getDataClient();
  const { data, error } = await supabase
    .from("leads")
    .insert({
      contact_name,
      email,
      phone: phone || null,
      whatsapp: whatsapp || null,
      company_name: company_name || null,
      website: website || null,
      industry: industry || null,
      company_size: company_size || null,
      primary_problem: primary_problem || null,
      current_process: current_process || null,
      desired_outcome: desired_outcome || null,
      enquiry_channels: enquiry_channels || null,
      lead_status: lead_status || "new",
      source: source || "admin",
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ lead: data });
}

export async function PATCH(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const { id, archive, ...rest } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof archive === "boolean") {
    updates.archived_at = archive ? new Date().toISOString() : null;
  }
  for (const key of EDITABLE) {
    if (key in rest && typeof rest[key] === "string") updates[key] = rest[key];
  }

  const supabase = getDataClient();
  const { data, error } = await supabase.from("leads").update(updates).eq("id", id).select().single();
  if (error) {
    const msg = error.message || "";
    if (/archived_at/.test(msg)) {
      return NextResponse.json({ error: "Archive is unavailable : apply migration supabase/migrations/017_lead_archive.sql first." }, { status: 400 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
  return NextResponse.json({ lead: data });
}

export async function DELETE(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const { id } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  // Permanent deletion is deliberate and irreversible. The admin UI requires
  // an explicit confirm step before calling this endpoint.
  const supabase = getDataClient();
  const { error } = await supabase.from("leads").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
