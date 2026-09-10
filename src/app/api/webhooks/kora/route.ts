// POST /api/webhooks/kora
//
// Kora webhook — signature-verified AND re-verified against the Kora API
// before any entitlement unlock. Idempotent at the database level via the
// unique (provider, provider_reference) index: duplicate deliveries can
// never create a second payment row, double-paid invoice flag, or duplicate
// lead promotion.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getKoraProvider } from "@/lib/payments/kora";
import { unlockAfterPayment } from "@/lib/payments/unlock";

const data = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST(req: NextRequest) {
  const provider = getKoraProvider();
  const raw = await req.text().catch(() => "");
  let body: Record<string, unknown> = {};
  try {
    body = JSON.parse(raw || "{}");
  } catch {
    return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });
  }

  if (!provider) {
    // No provider configured: acknowledge silently so Kora stops retrying,
    // but do not treat anything as paid.
    return NextResponse.json({ ok: true, ignored: "kora not configured" });
  }

  const event = String(body.event || "");
  const dataBlob = (body.data && typeof body.data === "object" ? body.data : {}) as Record<string, unknown>;

  // 1. Signature check: Kora sends x-korapay-signature, an HMAC-SHA256
  //    digest of ONLY the data object signed with the merchant secret key.
  if (!provider.verifyWebhookSignature(req.headers.get("x-korapay-signature"), dataBlob)) {
    return NextResponse.json({ ok: false, error: "invalid signature" }, { status: 401 });
  }

  const reference = typeof dataBlob.reference === "string" ? dataBlob.reference : null;

  // Non-payment events (charge.pending, etc.) are acknowledged, never acted on.
  if (!/charge\.(success|failed)/.test(event) || !reference) {
    return NextResponse.json({ ok: true, ignored: event || "unknown event" });
  }

  const sb = data();

  // 2. Idempotent lookup/creation of the payment row.
  const { data: existing } = await sb
    .from("payments")
    .select("id, invoice_id, lead_id, client_id, amount, status, provider_status")
    .eq("provider", "kora")
    .eq("provider_reference", reference)
    .maybeSingle();

  if (existing && existing.status === "success" && existing.provider_status === "success") {
    // Duplicate delivery of an already-confirmed payment: acknowledge, no-op.
    return NextResponse.json({ ok: true, idempotent: true });
  }

  let paymentId: string | null = existing?.id || null;
  if (!paymentId) {
    // Webhook arrived before our pending row persisted (rare race): create a
    // minimal row so the reference is claimed; invoice linkage is unknown.
    const amountNaira = Number(dataBlob.amount) / 100;
    const { data: created } = await sb
      .from("payments")
      .insert({
        amount: amountNaira,
        currency: "NGN",
        method: "card",
        reference,
        status: "pending",
        provider: "kora",
        provider_reference: reference,
        provider_status: "pending",
        notes: "Created from Kora webhook (initialize race)",
      })
      .select("id")
      .maybeSingle();
    paymentId = created?.id || null;
  }

  // 3. Authoritative re-verification against the Kora API.
  let txn;
  try {
    txn = await provider.verifyTransaction(reference);
  } catch {
    return NextResponse.json({ ok: false, error: "verify failed" }, { status: 502 });
  }

  if (txn.status !== "success") {
    if (paymentId) {
      await sb
        .from("payments")
        .update({ provider_status: txn.status, status: txn.status === "failed" ? "failed" : "pending" })
        .eq("id", paymentId);
    }
    return NextResponse.json({ ok: true, status: txn.status });
  }

  // A signed success with an under/overpaid amount remains pending for
  // reconciliation; it must not unlock onboarding.
  if (paymentId && existing) {
    const expectedAmount = Number((existing as { amount?: number }).amount) || 0;
    if (Math.abs(txn.amountNaira - expectedAmount) > 0.01) {
      await sb
        .from("payments")
        .update({ provider_status: txn.amountNaira < expectedAmount ? "underpaid" : "overpaid", status: "pending" })
        .eq("id", paymentId);
      return NextResponse.json({ ok: true, status: "amount_mismatch" });
    }
  }

  // 4. Confirm + unlock (only for success, only once).
  if (paymentId) {
    await sb
      .from("payments")
      .update({
        status: "success",
        provider_status: "success",
        paid_at: new Date().toISOString(),
        verified_at: new Date().toISOString(),
        verification_source: "kora_webhook",
        provider_fee: txn.feeNaira ?? null,
      })
      .eq("id", paymentId)
      .eq("status", "pending"); // never downgrade a payment that is already success

    if (existing) {
      await unlockAfterPayment(sb, {
        id: existing.id,
        lead_id: existing.lead_id,
        client_id: existing.client_id,
        invoice_id: existing.invoice_id,
      });
    }
  }

  return NextResponse.json({ ok: true, status: "success" });
}