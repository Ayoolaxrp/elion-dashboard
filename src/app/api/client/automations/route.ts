import { NextResponse } from "next/server";
import { getClientSession } from "@/lib/auth/client";

export async function GET() {
  const session = await getClientSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { db: supabase, client } = session;

  const { data: automations } = await supabase
    .from("client_automations")
    .select("id, custom_name, status, template_id, deployed_at, workflow_templates(name, category)")
    .eq("client_id", session.clientId)
    .order("created_at", { ascending: true });

  return NextResponse.json({ automations: automations || [], client });
}
