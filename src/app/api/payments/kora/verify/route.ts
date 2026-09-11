// GET /api/payments/kora/verify?payment=PAYMENT_ID  (admin only)
//
// Server-side verification of a Kora transaction. Called from the admin
// payments page when the customer returns from checkout — the return is
// merely a trigger; payment state is decided by the Kora API, never by the
// redirect itself. Also the authoritative path for the webhook handler.
//
// Idempotent: a payment already recorded as success is returned as-is.

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { comparePaymentAmount, getKoraProvider } from "@/lib/payments/kora";
import { unlockAfterPayment } from "@/lib/payments/unlock";

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

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const paymentId = new URL(req.url).searchParams.get("payment");
  if (!paymentId) return NextResponse.json({ error: "payment id required" }, { status: 400 });

  const provider = getKoraProvider();
  if (!provider) {
    return NextResponse.json({ error: "Kora is not configured" }, { status: 503 });
  }

  const sb = data();
  const { data: payment, error: payErr } = await sb
    .from("payments")
    .select("id, amount, invoice_id, lead_id, client_id, provider, provider_reference, status, provider_status")
    .eq("id", paymentId)
    .maybeSingle();

  if (payErr || !payment) return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  if (payment.provider !== "kora" || !payment.provider_reference) {
    return NextResponse.json({ error: "Payment is not a Kora transaction" }, { status: 400 });
  }

  // Already confirmed — idempotent no-op.
  if (payment.status === "success" && payment.provider_status === "success") {
    return NextResponse.json({ verified: true, status: "success", alreadyConfirmed: true, paymentId });
  }

  let txn;
  try {
    txn = await provider.verifyTransaction(payment.provider_reference);
  } catch (e) {
    return NextResponse.json(
      { verified: false, status: "unverified", error: e instanceof Error ? e.message : "verification failed" },
      { status: 502 }
    );
  }

  if (txn.status !== "success") {
    await sb
      .from("payments")
      .update({ provider_status: txn.status, status: txn.status === "failed" ? "failed" : "pending" })
      .eq("id", paymentId);
    return NextResponse.json({ verified: false, status: txn.status, paymentId });
  }

  const amountState = comparePaymentAmount(Number(payment.amount), "NGN", txn);
  if (amountState !== "exact") {
    await sb
      .from("payments")
      .update({ provider_status: amountState, status: "pending", verification_source: "kora_api_amount_mismatch" })
      .eq("id", paymentId);
    return NextResponse.json({ verified: false, status: amountState, paymentId });
  }

  // Confirmed success: record verification, then unlock entitlements.
  const confirmed = {
    id: payment.id,
    lead_id: payment.lead_id,
    client_id: payment.client_id,
    invoice_id: payment.invoice_id,
  };
  await sb
    .from("payments")
    .update({
      status: "success",
      provider_status: "success",
      paid_at: new Date().toISOString(),
      verified_at: new Date().toISOString(),
      verification_source: "kora_api_verify",
      provider_fee: txn.feeNaira ?? null,
    })
    .eq("id", paymentId);

  const unlock = await unlockAfterPayment(sb, confirmed);

  return NextResponse.json({
    verified: true,
    status: "success",
    paymentId,
    invoiceUpdated: unlock.invoiceUpdated,
    leadUpdated: unlock.leadUpdated,
  });
}