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

const VALID_STATUS = ["draft", "sent", "paid", "overdue", "cancelled"];

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = data();
  const { data: rows, error } = await supabase
    .from("invoices")
    .select("*, clients(id, company_name, contact_name, email), contracts(id, title)")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ invoices: rows || [] });
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
  if (!title) return NextResponse.json({ error: "Invoice title is required" }, { status: 400 });

  const amount = Number(body.amount) || 0;
  if (amount <= 0) return NextResponse.json({ error: "Invoice amount must be greater than zero" }, { status: 400 });

  const supabase = data();
  // Auto-generate a human-friendly invoice number if none provided.
  const invoiceNumber =
    typeof body.invoice_number === "string" && body.invoice_number.trim()
      ? body.invoice_number.trim()
      : `ELION-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 90000) + 10000)}`;

  const { data: row, error } = await supabase
    .from("invoices")
    .insert({
      title,
      invoice_number: invoiceNumber,
      client_id: body.client_id || null,
      contract_id: body.contract_id || null,
      company_name: body.company_name || null,
      client_name: body.client_name || null,
      items: Array.isArray(body.items) ? body.items : [],
      amount,
      currency: body.currency || "NGN",
      status: "draft",
      due_at: body.due_at || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ invoice: row });
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
  if (!id) return NextResponse.json({ error: "Invoice id is required" }, { status: 400 });

  const supabase = data();

  if (typeof body.status !== "string" || !VALID_STATUS.includes(body.status)) {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
  const status = body.status as string;

  // Load the current invoice so we can reject invalid transitions, return
  // 404 for unknown records, and keep mark-paid idempotent.
  const { data: invoice, error: iErr } = await supabase
    .from("invoices")
    .select("id, client_id, contract_id, company_name, client_name, amount, currency, invoice_number, status, paid_at")
    .eq("id", id)
    .maybeSingle();
  if (iErr) return NextResponse.json({ error: iErr.message }, { status: 500 });
  if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

  const current = invoice.status as string;
  const ALLOWED: Record<string, string[]> = {
    draft: ["sent", "paid", "cancelled"],
    sent: ["draft", "paid", "overdue", "cancelled"],
    overdue: ["paid", "cancelled"],
    paid: [],
    cancelled: [],
  };
  if (!(ALLOWED[current] || []).includes(status)) {
    return NextResponse.json(
      { error: `Invalid transition: cannot move invoice from ${current} to ${status}` },
      { status: 400 }
    );
  }

  const now = new Date().toISOString();
  const patch: Record<string, unknown> = { status };
  if (status === "sent") patch.sent_at = now;
  else if (status === "draft") {
    patch.sent_at = null;
    patch.paid_at = null;
  }

  if (status === "paid") {
    // Idempotent: an invoice that is already paid returns without side effects.
    if (current === "paid") return NextResponse.json({ invoice });
    patch.paid_at = now;

    // Create a confirmed payment record unless one already exists for this
    // invoice (a partial unique index on payments(invoice_id) backs this at
    // the database level as well).
    const { data: existingPay } = await supabase
      .from("payments")
      .select("id")
      .eq("invoice_id", invoice.id)
      .limit(1);
    const hasPayment = Array.isArray(existingPay) && existingPay.length > 0;

    const { data: row, error } = await supabase
      .from("invoices")
      .update(patch)
      .eq("id", id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    if (!hasPayment) {
      const { error: payErr } = await supabase.from("payments").insert({
        invoice_id: invoice.id,
        client_id: invoice.client_id,
        contract_id: invoice.contract_id,
        company_name: invoice.company_name || body.company_name || null,
        client_name: invoice.client_name || body.client_name || null,
        amount: invoice.amount,
        currency: invoice.currency || "NGN",
        method: typeof body.method === "string" ? body.method : "bank_transfer",
        reference: typeof body.reference === "string" && body.reference.trim() ? body.reference.trim() : `PAY-${invoice.invoice_number || invoice.id}`,
        status: "success",
        paid_at: now,
        notes: typeof body.notes === "string" ? body.notes : null,
      });
      if (payErr) {
        // A unique violation means another call already recorded the payment.
        const isDup = /duplicate|unique/i.test(payErr.message || "");
        if (!isDup) {
          return NextResponse.json({ invoice: row, paymentWarning: `Invoice marked paid but payment record failed: ${payErr.message}` }, { status: 200 });
        }
      }
    }
    return NextResponse.json({ invoice: row });
  }

  const { data: row, error } = await supabase
    .from("invoices")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ invoice: row });
}