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

  // Find client record by auth_user_id or email
  const { data: client } = await sb
    .from("clients")
    .select("id, contact_name, email, company_name, onboarding_status")
    .or("auth_user_id.eq." + user.id + ",email.eq." + user.email)
    .single();

  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

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
