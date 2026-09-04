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

const VALID_STATUS = ["draft", "sent", "viewed", "signed", "declined", "expired"];

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = data();
  const { data: rows, error } = await supabase
    .from("contracts")
    .select("*, proposals(id, title, status), clients(id, company_name, contact_name, email)")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ contracts: rows || [] });
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

  const supabase = data();

  // Create from an accepted proposal: copy title/amount/client context.
  if (typeof body.proposal_id === "string" && body.proposal_id) {
    const { data: proposal, error: pErr } = await supabase
      .from("proposals")
      .select("id, title, company_name, client_name, client_id, lead_id, total_setup, total_monthly, summary, support_plan, implementation_timeline")
      .eq("id", body.proposal_id)
      .single();
    if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 });
    if (!proposal) return NextResponse.json({ error: "Proposal not found" }, { status: 404 });

    const scopeSummary =
      typeof body.scope_summary === "string" && body.scope_summary.trim()
        ? body.scope_summary.trim()
        : `${proposal.title}. Setup ₦${(proposal.total_setup || 0).toLocaleString()}${proposal.total_monthly ? ` + ₦${proposal.total_monthly.toLocaleString()}/month management` : ""}.`;

    const { data: row, error } = await supabase
      .from("contracts")
      .insert({
        proposal_id: proposal.id,
        client_id: proposal.client_id || body.client_id || null,
        title: body.title || `${proposal.title} — Contract`,
        company_name: proposal.company_name || body.company_name || null,
        client_name: proposal.client_name || body.client_name || null,
        scope_summary: scopeSummary,
        total_amount: Number(body.total_amount) || proposal.total_setup || 0,
        status: "draft",
        expires_at: body.expires_at || null,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ contract: row });
  }

  // Manual create.
  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) return NextResponse.json({ error: "Contract title is required" }, { status: 400 });

  const { data: row, error } = await supabase
    .from("contracts")
    .insert({
      title,
      client_id: body.client_id || null,
      proposal_id: body.proposal_id || null,
      company_name: body.company_name || null,
      client_name: body.client_name || null,
      scope_summary: body.scope_summary || null,
      total_amount: Number(body.total_amount) || 0,
      status: "draft",
      expires_at: body.expires_at || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ contract: row });
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
  if (!id) return NextResponse.json({ error: "Contract id is required" }, { status: 400 });

  const supabase = data();

  if (typeof body.status === "string" && VALID_STATUS.includes(body.status)) {
    const status = body.status as string;
    const patch: Record<string, unknown> = { status };
    const now = new Date().toISOString();
    if (status === "sent") patch.sent_at = now;
    else if (status === "signed") {
      patch.signed_at = now;
      if (typeof body.signatory === "string" && body.signatory.trim()) patch.signatory = body.signatory.trim();
    } else if (status === "draft") {
      patch.sent_at = null;
      patch.signed_at = null;
      patch.signatory = null;
    }
    const { data: row, error } = await supabase
      .from("contracts")
      .update(patch)
      .eq("id", id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ contract: row });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}