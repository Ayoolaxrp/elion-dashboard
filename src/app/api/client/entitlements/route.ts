import { NextResponse } from "next/server";
import { getClientSession } from "@/lib/auth/client";

export async function GET() {
  const session = await getClientSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { db: sb, client } = session;

  // Get entitlements
  const { data: entitlements } = await sb
    .from("client_entitlements")
    .select("feature_key, status")
    .eq("client_id", client.id)
    .eq("status", "active");

  // Get automations
  const { data: automations } = await sb
    .from("client_automations")
    .select("id, custom_name, status, workflow_templates(name, category)")
    .eq("client_id", client.id);

  const features = (entitlements || []).map((e: { feature_key: string }) => e.feature_key);
  const activeAutomations = (automations || []).filter((a: { status: string }) => a.status === "live");
  const categories: Set<string> = new Set();
  activeAutomations.forEach((a: { workflow_templates?: { category?: string } | { category?: string }[] | null }) => {
    const wt = a.workflow_templates;
    if (wt && !Array.isArray(wt) && wt.category) categories.add(wt.category);
    else if (Array.isArray(wt) && wt[0]?.category) categories.add(wt[0].category);
  });

  return NextResponse.json({
    client,
    features,
    automations: automations || [],
    activeCategories: Array.from(categories),
    hasLeadResponse: features.includes("lead_response") || categories.has("lead_response"),
    hasFollowUp: features.includes("follow_up") || categories.has("follow_up"),
    hasBooking: features.includes("booking") || categories.has("booking"),
    hasRecovery: features.includes("revenue_recovery") || categories.has("revenue_recovery"),
    hasOperations: features.includes("operations") || categories.has("operations"),
  });
}
