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
  if (!user || user.email !== process.env.ADMIN_EMAILS) return null;
  return sb;
}

// GET - list all pipelines
export async function GET() {
  const sb = await getAdmin();
  if (!sb) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await sb
    .from("onboarding_pipeline")
    .select("*, clients(id, contact_name, email, company_name, plan_name)")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ pipelines: data });
}

// POST - create pipeline for a client
export async function POST(request: Request) {
  const sb = await getAdmin();
  if (!sb) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { client_id } = body;
  if (!client_id) return NextResponse.json({ error: "client_id required" }, { status: 400 });

  // Check if pipeline already exists
  const { data: existing } = await sb
    .from("onboarding_pipeline")
    .select("id")
    .eq("client_id", client_id)
    .single();

  if (existing) {
    return NextResponse.json({ error: "Pipeline already exists", id: existing.id }, { status: 409 });
  }

  const { data, error } = await sb
    .from("onboarding_pipeline")
    .insert({
      client_id,
      current_stage: "welcome",
      stage_status: "in_progress",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Update client
  await sb.from("clients").update({
    onboarding_status: "in_progress",
    onboarding_started_at: new Date().toISOString(),
  }).eq("id", client_id);

  return NextResponse.json({ success: true, pipeline: data });
}
