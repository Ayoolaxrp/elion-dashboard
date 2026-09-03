import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { provisionAutomation, provisionAllClientAutomations, deactivateAutomation, reactivateAutomation } from "@/lib/provisioning";

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

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: clientId } = await params;
  const admin = await requireAdmin();
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
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Data client: service role bypasses RLS (provisioning_logs only allows service_role).
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  const { data: logs, error } = await supabase
    .from("provisioning_logs")
    .select("*, workflow_templates(name, slug, category)")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ logs });
}
