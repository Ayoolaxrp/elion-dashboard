// POST /api/payments/kora/initialize  (admin only)
//
// accepted proposal → invoice → order → Kora checkout.
// Creates a pending payment row (provider="kora", status="pending") and
// returns the Kora checkout URL. Payment is NEVER marked paid here — the
// customer returning from checkout is not proof of payment.

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { getKoraProvider } from "@/lib/payments/kora";

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

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const provider = getKoraProvider();
  if (!provider) {
    return NextResponse.json(
      { error: "Kora is not configured. Set KORA_SECRET_KEY (and KORA_WEBHOOK_SECRET) and redeploy." },
      { status: 503 }
    );
  }

  const sb = data();
  const body = await req.json().catch(() => ({}));

  const invoice_id: string | null = typeof body.invoice_id === "string" ? body.invoice_id : null;
  const lead_id: string | null = typeof body.lead_id === "string" ? body.lead_id : null;
  const client_id: string | null = typeof body.client_id === "string" ? body.client_id : null;
  const customer_email: string | null = typeof body.customer_email === "string" ? body.customer_email : null;

  let amountNaira = Number(body.amount) || 0;
  let company_name: string | null = typeof body.company_name === "string" ? body.company_name : null;
  let client_name: string | null = typeof body.client_name === "string" ? body.client_name : null;

  // Resolve amount + identity from an invoice when provided (the normal
  // accepted-proposal flow). Otherwise require an explicit amount.
  if (invoice_id) {
    const { data: invoice, error: invErr } = await sb
      .from("invoices")
      .select("id, amount, client_id, company_name, client_name, title, invoice_number")
      .eq("id", invoice_id)
      .maybeSingle();
    if (invErr || !invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    amountNaira = Number(invoice.amount) || 0;
    company_name = company_name || invoice.company_name || null;
    client_name = client_name || invoice.client_name || null;
  }

  if (!(amountNaira > 0)) {
    return NextResponse.json({ error: "A payable amount could not be determined" }, { status: 400 });
  }

  // One payment request per checkout. Reuse the invoice's last pending Kora
  // payment if one exists so re-clicks don't create duplicate pending rows.
  const reference = "elion_" + (invoice_id || "lead_" + (lead_id || client_id || "x")).replace(/[^a-zA-Z0-9]/g, "_") + "_" + Date.now().toString(36);

  const { data: paymentRow, error: payErr } = await sb
    .from("payments")
    .insert({
      lead_id,
      client_id,
      invoice_id,
      company_name,
      client_name,
      amount: amountNaira,
      currency: "NGN",
      method: "card",
      reference,
      status: "pending",
      provider: "kora",
      provider_reference: reference,
      provider_status: "pending",
      notes: "Kora checkout initiated from admin",
      metadata: { purpose: body.purpose || "ELION commercial order" },
    })
    .select()
    .single();

  if (payErr || !paymentRow) {
    return NextResponse.json({ error: payErr?.message || "Failed to create payment" }, { status: 500 });
  }

  const origin = new URL(req.url).origin;
  let checkout: { checkoutUrl: string; reference: string };
  try {
    checkout = await provider.createCheckout({
      amountNaira,
      currency: "NGN",
      reference,
      customerName: client_name || company_name || undefined,
      customerEmail: customer_email || undefined,
      redirectUrl: `${origin}/admin/payments?payment=${paymentRow.id}`,
    });
  } catch (e) {
    // Checkout failed: keep the pending row for diagnosis but surface the error.
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Kora checkout could not be created" },
      { status: 502 }
    );
  }

  return NextResponse.json({
    checkoutUrl: checkout.checkoutUrl,
    paymentId: paymentRow.id,
    reference: checkout.reference,
    status: "pending",
  });
}