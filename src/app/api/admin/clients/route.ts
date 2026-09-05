import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { resolvePlan } from "@/lib/plan-entitlements";

// Data client: service role bypasses RLS (clients table only allows service_role).
const data = () =>
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

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = data();
  const { data: clients, error } = await supabase
    .from("clients")
    .select("*, client_automations(id, status, custom_name, workflow_templates(name, slug, category)), client_integrations(integration_type, provider, status)")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ clients });
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { lead_id, company_name, contact_name, email, phone, industry, website, plan_name, features, onboarding_notes } = body as {
    lead_id?: string | null;
    company_name: string;
    contact_name?: string;
    email?: string;
    phone?: string;
    industry?: string;
    website?: string;
    plan_name?: string;
    features?: string[];
    onboarding_notes?: string;
  };

  if (!company_name) return NextResponse.json({ error: "Company name is required" }, { status: 400 });

  const supabase = data();

  // Create client
  const { data: client, error: clientErr } = await supabase
    .from("clients")
    .insert({
      lead_id: lead_id || null,
      company_name,
      contact_name: contact_name || "",
      email: email || "",
      phone: phone || "",
      industry: industry || "",
      website: website || "",
      plan_name: plan_name || "Custom",
      onboarding_status: "pending",
      onboarding_notes: onboarding_notes || "",
      status: "active",
    })
    .select("id")
    .single();

  if (clientErr) return NextResponse.json({ error: clientErr.message }, { status: 500 });

  // Assign entitlements + create pending automation instances from the
  // client's plan (Starter/Growth/Scale). An explicit features list in the
  // request wins over the plan default. Instances are created as
  // "pending", never "live" : the provisioning engine gates activation.
  if (client) {
    const plan = resolvePlan(plan_name as string | undefined);
    const featureKeys =
      features && features.length > 0 ? features : plan ? plan.feature_keys : [];

    if (featureKeys.length > 0) {
      const { data: allFeatures } = await supabase.from("features").select("id, key");
      if (allFeatures) {
        const entitlements = allFeatures
          .filter((f) => featureKeys.includes(f.key))
          .map((f) => ({ client_id: client.id, feature_id: f.id, status: "active" as const, source: "plan" }));
        if (entitlements.length > 0) {
          await supabase.from("client_entitlements").insert(entitlements);
        }
      }
    }

    if (plan) {
      const { data: templates } = await supabase.from("workflow_templates").select("id, slug");
      const slugToId = new Map((templates || []).map((t) => [t.slug, t.id]));
      for (const slug of plan.template_slugs) {
        const templateId = slugToId.get(slug);
        if (!templateId) continue;
        const { data: existing } = await supabase
          .from("client_automations")
          .select("id")
          .eq("client_id", client.id)
          .eq("template_id", templateId)
          .maybeSingle();
        if (existing) continue;
        await supabase.from("client_automations").insert({
          client_id: client.id,
          template_id: templateId,
          custom_name: slug
            .split("_")
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" "),
          custom_config: {},
          status: "pending",
        });
      }
    }

    // Create default integrations
    const integrations = ["whatsapp", "email", "crm", "calendar"].map((type) => ({
      client_id: client.id,
      integration_type: type,
      status: "not_configured" as const,
    }));
    await supabase.from("client_integrations").insert(integrations);
  }

  return NextResponse.json({ client });
}
