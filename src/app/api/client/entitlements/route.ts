import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function GET() {
  const cookieStore = await cookies();
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
  );

  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Find client by auth_user_id or email
  const { data: client } = await sb
    .from("clients")
    .select("id, company_name, onboarding_status, plan_name")
    .or("auth_user_id.eq." + user.id + ",email.eq." + user.email)
    .single();

  if (!client) return NextResponse.json({ features: [], automations: [], client: null });

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

  const features = (entitlements || []).map(e => e.feature_key);
  const activeAutomations = (automations || []).filter(a => a.status === "live");
  const categories: Set<string> = new Set();
  activeAutomations.forEach((a: any) => {
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
