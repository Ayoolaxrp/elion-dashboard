import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { provisionAutomation, provisionAllClientAutomations, deactivateAutomation, reactivateAutomation } from "@/lib/provisioning";

function getSupabase() {
  const cookieStore = { get: (name: string) => ({ value: "" as string }), getAll: () => [] as { name: string; value: string }[] };
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
  );
}

async function checkAdmin(supabase: ReturnType<typeof getSupabase>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== process.env.ADMIN_EMAILS) return null;
  return user;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: clientId } = await params;
  const supabase = getSupabase();
  const admin = await checkAdmin(supabase);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { template_id, action } = body;

  if (action === "deactivate" && body.automation_id) {
    const result = await deactivateAutomation(body.automation_id, body.reason);
    return NextResponse.json(result);
  }

  if (action === "reactivate" && body.automation_id) {
    const result = await reactivateAutomation(body.automation_id);
    return NextResponse.json(result);
  }

  if (action === "provision_all") {
    const results = await provisionAllClientAutomations(clientId);
    return NextResponse.json({ results });
  }

  if (!template_id) {
    return NextResponse.json({ error: "template_id required" }, { status: 400 });
  }

  const result = await provisionAutomation(clientId, template_id);
  return NextResponse.json(result);
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: clientId } = await params;
  const supabase = getSupabase();
  const admin = await checkAdmin(supabase);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: logs, error } = await supabase
    .from("provisioning_logs")
    .select("*, workflow_templates(name, slug, category)")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ logs });
}
