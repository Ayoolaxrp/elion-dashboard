// POST /api/webhooks/kora
//
// Kora's webhook endpoint is intentionally unauthenticated at the HTTP
// layer. Authenticity is established by x-korapay-signature, followed by an
// authoritative server-side charge query before any value is granted.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { comparePaymentAmount, getKoraProvider } from "@/lib/payments/kora";
import { unlockAfterPayment } from "@/lib/payments/unlock";

const data = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST(req: NextRequest) {
  const provider = getKoraProvider();
  const raw = await req.text().catch(() => "");
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(raw || "{}");
  } catch {
    return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });
  }

  if (!provider) return NextResponse.json({ ok: true, ignored: "korapay not configured" });

  const event = String(body.event || "");
  const dataBlob = body.data && typeof body.data === "object" ? body.data as Record<string, unknown> : null;
  if (!dataBlob || !provider.verifyWebhookSignature(req.headers.get("x-korapay-signature"), dataBlob)) {
    return NextResponse.json({ ok: false, error: "invalid signature" }, { status: 401 });
  }

  const reference = typeof dataBlob.reference === "string"
    ? dataBlob.reference
    : typeof dataBlob.payment_reference === "string" ? dataBlob.payment_reference : null;
  if (!reference || !["charge.success", "charge.failed"].includes(event)) {
    return NextResponse.json({ ok: true, ignored: event || "unknown event" });
  }

  const sb = data();
  const { data: payment, error: lookupError } = await sb
    .from("payments")
    .select("id, invoice_id, lead_id, client_id, amount, currency, status, provider_status")
    .in("provider", ["korapay", "kora"])
    .eq("provider_reference", reference)
    .maybeSingle();
  if (lookupError) return NextResponse.json({ ok: false, error: "payment lookup failed" }, { status: 500 });

  // A webhook can arrive before the initialize request finishes. Do not
  // create an unlinked payment: without an invoice/client link it cannot
  // safely unlock value. A later retry or admin reconciliation can resolve it.
  if (!payment) return NextResponse.json({ ok: true, status: "unmatched_reference" });
  if (payment.status === "success" && payment.provider_status === "success") {
    return NextResponse.json({ ok: true, idempotent: true });
  }

  let transaction;
  try {
    transaction = await provider.verifyTransaction(reference);
  } catch {
    return NextResponse.json({ ok: false, error: "verify failed" }, { status: 502 });
  }

  if (transaction.status !== "success") {
    const nextStatus = transaction.status === "failed" || transaction.status === "cancelled" || transaction.status === "refunded"
      ? transaction.status
      : "pending";
    await sb.from("payments").update({ provider_status: transaction.status, status: nextStatus }).eq("id", payment.id);
    return NextResponse.json({ ok: true, status: transaction.status });
  }

  const amountState = comparePaymentAmount(Number(payment.amount), String(payment.currency || "NGN"), transaction);
  if (amountState !== "exact") {
    await sb.from("payments").update({ provider_status: amountState, status: "pending", verification_source: "kora_webhook_amount_mismatch" }).eq("id", payment.id);
    return NextResponse.json({ ok: true, status: amountState });
  }

  const now = new Date().toISOString();
  const { data: confirmed, error: confirmError } = await sb
    .from("payments")
    .update({ status: "success", provider_status: "success", paid_at: transaction.paidAt || now, verified_at: now, verification_source: "kora_webhook", provider_fee: transaction.fee ?? null })
    .eq("id", payment.id)
    .eq("status", "pending")
    .select("id");
  if (confirmError) return NextResponse.json({ ok: false, error: "confirmation failed" }, { status: 500 });
  if (!confirmed?.length) return NextResponse.json({ ok: true, idempotent: true });

  await unlockAfterPayment(sb, {
    id: payment.id,
    lead_id: payment.lead_id,
    client_id: payment.client_id,
    invoice_id: payment.invoice_id,
    amount: Number(payment.amount),
    currency: String(payment.currency || "NGN"),
    provider_reference: reference,
  });

  return NextResponse.json({ ok: true, status: "success" });
}
