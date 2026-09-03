import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

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
  const { lead_id, company_name, contact_name, email, phone, industry, website, plan_name, features, onboarding_notes } = body;

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

  // Assign entitlements if features provided
  if (features && features.length > 0 && client) {
    const { data: allFeatures } = await supabase.from("features").select("id, key");
    if (allFeatures) {
      const entitlements = allFeatures
        .filter((f) => features.includes(f.key))
        .map((f) => ({ client_id: client.id, feature_id: f.id, status: "active" as const, source: "plan" }));
      if (entitlements.length > 0) {
        await supabase.from("client_entitlements").insert(entitlements);
      }
    }
  }

  // Create default integrations
  if (client) {
    const integrations = ["whatsapp", "email", "crm", "calendar"].map((type) => ({
      client_id: client.id,
      integration_type: type,
      status: "not_configured" as const,
    }));
    await supabase.from("client_integrations").insert(integrations);
  }

  return NextResponse.json({ client });
}
