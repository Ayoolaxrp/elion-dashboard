// POST /api/payments/kora/initialize
//
// Admin-created checkout for an existing invoice or an explicitly supplied
// amount. The payment row is created before Kora initialization and remains
// pending until server-side verification or a verified webhook confirms it.

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { getClientSession } from "@/lib/auth/client";
import { getKoraProvider, normalizeKoraCurrency, type KoraCurrency } from "@/lib/payments/kora";

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
  const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map((email) => email.trim().toLowerCase());
  return adminEmails.includes((user.email || "").toLowerCase()) ? user : null;
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  const clientSession = admin ? null : await getClientSession();
  if (!admin && !clientSession) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const provider = getKoraProvider();
  if (!provider) {
    return NextResponse.json({ error: "Kora is not configured. Set KORAPAY_SECRET_KEY and redeploy." }, { status: 503 });
  }

  const body = await req.json().catch(() => ({}));
  if (clientSession && typeof body.invoice_id !== "string") {
    return NextResponse.json({ error: "A client payment must be linked to an invoice" }, { status: 400 });
  }
  const invoiceId = typeof body.invoice_id === "string" && body.invoice_id ? body.invoice_id : null;
  const leadId = clientSession ? null : typeof body.lead_id === "string" && body.lead_id ? body.lead_id : null;
  const requestedClientId = typeof body.client_id === "string" && body.client_id ? body.client_id : null;
  const customerEmail = typeof body.customer_email === "string" ? body.customer_email.trim() : "";
  let amount = Number(body.amount);
  let currency = normalizeKoraCurrency(body.currency) as KoraCurrency | null;
  let clientId = clientSession ? clientSession.clientId : requestedClientId;
  let companyName = typeof body.company_name === "string" ? body.company_name.trim() || null : null;
  let clientName = typeof body.client_name === "string" ? body.client_name.trim() || null : null;
  let invoiceNumber: string | null = null;
  let invoiceStatus: string | null = null;

  const sb = admin ? data() : clientSession!.db;
  if (invoiceId) {
    const { data: invoice, error } = await sb
      .from("invoices")
      .select("id, amount, currency, client_id, company_name, client_name, invoice_number, status, clients(email, contact_name, company_name)")
      .eq("id", invoiceId)
      .maybeSingle();
    if (error || !invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    if (clientSession && invoice.client_id !== clientSession.clientId) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    if (["paid", "cancelled"].includes(String(invoice.status))) {
      return NextResponse.json({ error: `Invoice is already ${invoice.status}` }, { status: 409 });
    }

    const invoiceClient = Array.isArray(invoice.clients) ? invoice.clients[0] : invoice.clients;
    amount = Number(invoice.amount);
    currency = normalizeKoraCurrency(invoice.currency);
    clientId = invoice.client_id || clientId;
    companyName = companyName || invoice.company_name || invoiceClient?.company_name || null;
    clientName = clientName || invoice.client_name || invoiceClient?.contact_name || null;
    invoiceNumber = invoice.invoice_number || null;
    invoiceStatus = invoice.status || null;
    if (!customerEmail && invoiceClient?.email) {
      body.customer_email = String(invoiceClient.email).trim();
    }
  }

  const email = customerEmail || (typeof body.customer_email === "string" ? body.customer_email.trim() : "");
  if (!(amount > 0)) return NextResponse.json({ error: "A payable amount could not be determined" }, { status: 400 });
  if (!currency) return NextResponse.json({ error: "Currency must be NGN, USD, GBP, or EUR" }, { status: 400 });
  if (!email) return NextResponse.json({ error: "Customer email is required" }, { status: 400 });

  const reference = `elion_${invoiceId || `lead_${leadId || clientId || "payment"}`}_${Date.now().toString(36)}`.replace(/[^a-zA-Z0-9_]/g, "_");
  const { data: payment, error: paymentError } = await sb
    .from("payments")
    .insert({
      lead_id: leadId,
      client_id: clientId,
      invoice_id: invoiceId,
      company_name: companyName,
      client_name: clientName,
      amount,
      currency,
      method: "online",
      reference,
      status: "pending",
      provider: "korapay",
      provider_reference: reference,
      provider_status: "pending",
      notes: "Kora Checkout Redirect initialized from admin",
      metadata: {
        purpose: String(body.purpose || "ELION commercial payment").slice(0, 100),
        invoice_number: invoiceNumber || "",
        invoice_status: invoiceStatus || "",
      },
    })
    .select("id")
    .single();

  if (paymentError || !payment) {
    return NextResponse.json({ error: paymentError?.message || "Failed to create payment" }, { status: 500 });
  }

  const origin = new URL(req.url).origin;
  try {
    const checkout = await provider.createCheckout({
      amount,
      currency,
      reference,
      customerName: clientName || companyName || undefined,
      customerEmail: email,
      redirectUrl: `${origin}${clientSession ? "/dashboard/portal" : "/admin/payments"}?payment=${encodeURIComponent(payment.id)}`,
      notificationUrl: `${origin}/api/webhooks/kora`,
      metadata: { payment_id: payment.id, invoice_id: invoiceId || "none" },
    });

    if (checkout.reference !== reference) {
      await sb.from("payments").update({ provider_reference: checkout.reference }).eq("id", payment.id);
    }

    return NextResponse.json({ checkoutUrl: checkout.checkoutUrl, paymentId: payment.id, reference: checkout.reference, currency, status: "pending" });
  } catch (error) {
    await sb.from("payments").update({ provider_status: "initialization_failed", verification_source: "kora_initialize" }).eq("id", payment.id);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Kora checkout could not be created" }, { status: 502 });
  }
}
