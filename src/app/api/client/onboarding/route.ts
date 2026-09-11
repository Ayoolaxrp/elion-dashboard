import { NextResponse } from "next/server";
import { getClientSession } from "@/lib/auth/client";

export async function GET() {
  const session = await getClientSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { db: sb, client } = session;

  // Get pipeline
  const { data: pipeline } = await sb
    .from("onboarding_pipeline")
    .select("*")
    .eq("client_id", client.id)
    .single();

  // Get automations
  const { data: automations } = await sb
    .from("client_automations")
    .select("id, custom_name, status, workflow_templates(name, category)")
    .eq("client_id", client.id);

  return NextResponse.json({ client, pipeline, automations: automations || [] });
}
