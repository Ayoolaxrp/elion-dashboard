import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function GET() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Find user's organization
  const { data: memberships } = await supabase
    .from("organization_memberships")
    .select("organization_id, role")
    .eq("user_id", user.id)
    .eq("status", "active");

  if (!memberships || memberships.length === 0) {
    // Fallback: check email-based admin
    const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map(e => e.trim().toLowerCase());
    if (user.email && adminEmails.includes(user.email.toLowerCase())) {
      return NextResponse.json({ automations: [], client: null });
    }
    return NextResponse.json({ automations: [], client: null });
  }

  // Find the client org
  const { data: org } = await supabase
    .from("organizations")
    .select("id, client_id")
    .in("id", memberships.map(m => m.organization_id))
    .eq("org_type", "client")
    .single();

  if (!org?.client_id) {
    return NextResponse.json({ automations: [], client: null });
  }

  // Get client info
  const { data: client } = await supabase
    .from("clients")
    .select("company_name, onboarding_status")
    .eq("id", org.client_id)
    .single();

  // Get automations
  const { data: automations } = await supabase
    .from("client_automations")
    .select("id, custom_name, status, template_id, deployed_at, workflow_templates(name, category)")
    .eq("client_id", org.client_id)
    .order("created_at", { ascending: true });

  return NextResponse.json({ automations: automations || [], client });
}
