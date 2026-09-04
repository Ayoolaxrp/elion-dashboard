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

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = data();
  const { data: rows, error } = await supabase
    .from("payments")
    .select("*, invoices(id, invoice_number, title), clients(id, company_name, contact_name)")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ payments: rows || [] });
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

  const amount = Number(body.amount) || 0;
  if (amount <= 0) return NextResponse.json({ error: "Payment amount must be greater than zero" }, { status: 400 });

  const status = body.status === "failed" ? "failed" : "success";

  const supabase = data();
  const { data: row, error } = await supabase
    .from("payments")
    .insert({
      client_id: body.client_id || null,
      invoice_id: body.invoice_id || null,
      contract_id: body.contract_id || null,
      company_name: body.company_name || null,
      client_name: body.client_name || null,
      amount,
      currency: body.currency || "NGN",
      method: typeof body.method === "string" ? body.method : "bank_transfer",
      reference: body.reference || null,
      status,
      paid_at: status === "success" ? new Date().toISOString() : null,
      notes: body.notes || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ payment: row });
}