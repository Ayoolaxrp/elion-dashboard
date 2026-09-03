import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } });
}

async function checkAdmin(supabase: Awaited<ReturnType<typeof getSupabase>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !(process.env.ADMIN_EMAILS || "").split(",").map(e => e.trim().toLowerCase()).includes((user.email || "").toLowerCase())) return null;
  return user;
}

export async function GET() {
  const supabase = await getSupabase();
  const admin = await checkAdmin(supabase);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await supabase.from("leads").select("*").order("created_at", { ascending: false }).limit(200);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ leads: data || [] });
}

export async function POST(request: Request) {
  const supabase = await getSupabase();
  const admin = await checkAdmin(supabase);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const { contact_name, email, phone, company_name, website, industry, primary_problem, lead_status, source } = body;
  if (!contact_name || !email) return NextResponse.json({ error: "contact_name and email required" }, { status: 400 });
  const { data, error } = await supabase.from("leads").insert({ contact_name, email, phone: phone || null, company_name: company_name || null, website: website || null, industry: industry || null, primary_problem: primary_problem || null, lead_status: lead_status || "new", source: source || "admin", email_verified: true }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ lead: data });
}

export async function PATCH(request: Request) {
  const supabase = await getSupabase();
  const admin = await checkAdmin(supabase);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const { id, ...updates } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const { data, error } = await supabase.from("leads").update({ ...updates, updated_at: new Date().toISOString() }).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ lead: data });
}
