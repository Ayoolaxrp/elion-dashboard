import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

// Data client: plain service-role client so queries bypass RLS.
const data = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

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

const VALID_STATUS = ["draft", "sent", "viewed", "accepted", "rejected", "expired"];

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = data();
  const { data: rows, error } = await supabase
    .from("proposals")
    .select("*, clients(id, company_name, contact_name, email)")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ proposals: rows || [] });
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) return NextResponse.json({ error: "Proposal title is required" }, { status: 400 });

  const items = Array.isArray(body.items) ? body.items : [];
  const totalSetup = Number(body.total_setup) || 0;
  const totalMonthly = Number(body.total_monthly) || 0;

  const supabase = data();
  const { data: row, error } = await supabase
    .from("proposals")
    .insert({
      title,
      company_name: body.company_name || null,
      client_name: body.client_name || null,
      client_email: body.client_email || null,
      client_id: body.client_id || null,
      lead_id: body.lead_id || null,
      summary: body.summary || null,
      items,
      total_setup: totalSetup,
      total_monthly: totalMonthly,
      implementation_timeline: body.implementation_timeline || null,
      support_plan: body.support_plan || null,
      valid_until: body.valid_until || null,
      status: "draft",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ proposal: row });
}

export async function PATCH(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const id = typeof body.id === "string" ? body.id : "";
  if (!id) return NextResponse.json({ error: "Proposal id is required" }, { status: 400 });

  const supabase = data();

  if (typeof body.status === "string" && VALID_STATUS.includes(body.status)) {
    const status = body.status as string;
    const patch: Record<string, unknown> = { status };
    const now = new Date().toISOString();
    if (status === "sent") patch.sent_at = now;
    else if (status === "accepted") patch.accepted_at = now;
    else if (status === "rejected") patch.declined_at = now;
    else if (status === "draft") {
      patch.sent_at = null;
      patch.accepted_at = null;
      patch.declined_at = null;
    }
    const { data: row, error } = await supabase
      .from("proposals")
      .update(patch)
      .eq("id", id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ proposal: row });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}