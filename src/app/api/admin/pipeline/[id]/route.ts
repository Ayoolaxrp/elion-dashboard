import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

const STAGES = ["welcome", "kickoff", "configuration", "build", "testing", "launch", "handover"];

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

// GET - get pipeline details
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const sb = await getAdmin();
  if (!sb) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const { data, error } = await sb
    .from("onboarding_pipeline")
    .select("*, clients(id, contact_name, email, company_name, plan_name, industry)")
    .eq("id", id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json({ pipeline: data });
}

// PATCH - advance stage or update pipeline
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const sb = await getAdmin();
  if (!sb) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const body = await request.json();
  const { action, ...updates } = body;

  // Get current pipeline
  const { data: pipeline } = await sb
    .from("onboarding_pipeline")
    .select("*, clients(contact_name, email, company_name)")
    .eq("id", id)
    .single();

  if (!pipeline) return NextResponse.json({ error: "Pipeline not found" }, { status: 404 });

  if (action === "advance") {
    const currentIndex = STAGES.indexOf(pipeline.current_stage);
    if (currentIndex >= STAGES.length - 1) {
      return NextResponse.json({ error: "Already at final stage" }, { status: 400 });
    }
    const nextStage = STAGES[currentIndex + 1];
    const now = new Date().toISOString();

    // Mark current stage as completed
    const stageUpdate: Record<string, unknown> = {
      current_stage: nextStage,
      stage_status: "in_progress",
      updated_at: now,
    };
    stageUpdate[pipeline.current_stage + "_completed_at"] = now;

    const { data, error } = await sb
      .from("onboarding_pipeline")
      .update(stageUpdate)
      .eq("id", id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // If advancing to "launch", update client onboarding_status
    if (nextStage === "launch") {
      await sb.from("clients").update({ onboarding_status: "live" }).eq("id", pipeline.client_id);
    }
    if (nextStage === "handover") {
      await sb.from("clients").update({
        onboarding_status: "completed",
        onboarding_completed_at: now,
      }).eq("id", pipeline.client_id);
    }

    return NextResponse.json({ success: true, pipeline: data, advancedTo: nextStage });
  }

  // Direct update (notes, kickoff details, etc.)
  const { data, error } = await sb
    .from("onboarding_pipeline")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, pipeline: data });
}
