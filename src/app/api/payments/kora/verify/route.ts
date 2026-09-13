// GET /api/payments/kora/verify?payment=PAYMENT_ID
//
// The return URL is only a trigger. Payment state is decided by Kora's
// server-side charge query and exact invoice amount/currency reconciliation.
// Admins may verify any payment; a client may verify only its own payment.

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { getClientSession } from "@/lib/auth/client";
import { comparePaymentAmount, getKoraProvider } from "@/lib/payments/kora";
import { unlockAfterPayment } from "@/lib/payments/unlock";

const data = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

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

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  const clientSession = admin ? null : await getClientSession();
  if (!admin && !clientSession) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const paymentId = new URL(req.url).searchParams.get("payment");
  if (!paymentId) return NextResponse.json({ error: "payment id required" }, { status: 400 });

  const provider = getKoraProvider();
  if (!provider) return NextResponse.json({ error: "Kora is not configured" }, { status: 503 });

  const sb = admin ? data() : clientSession!.db;
  const { data: payment, error: paymentError } = await sb
    .from("payments")
    .select("id, amount, currency, invoice_id, lead_id, client_id, provider, provider_reference, status, provider_status")
    .eq("id", paymentId)
    .maybeSingle();

  if (paymentError || !payment) return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  if (clientSession && payment.client_id !== clientSession.clientId) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }
  if (!["korapay", "kora"].includes(String(payment.provider)) || !payment.provider_reference) {
    return NextResponse.json({ error: "Payment is not a Kora transaction" }, { status: 400 });
  }
  if (payment.status === "success" && payment.provider_status === "success") {
    return NextResponse.json({ verified: true, status: "success", alreadyConfirmed: true, paymentId });
  }

  let transaction;
  try {
    transaction = await provider.verifyTransaction(payment.provider_reference);
  } catch (error) {
    return NextResponse.json(
      { verified: false, status: "unverified", error: error instanceof Error ? error.message : "verification failed" },
      { status: 502 }
    );
  }

  if (transaction.status !== "success") {
    const nextStatus = ["failed", "cancelled", "refunded"].includes(transaction.status) ? transaction.status : "pending";
    await sb.from("payments").update({ provider_status: transaction.status, status: nextStatus }).eq("id", paymentId);
    return NextResponse.json({ verified: false, status: transaction.status, paymentId });
  }

  const amountState = comparePaymentAmount(Number(payment.amount), String(payment.currency || "NGN"), transaction);
  if (amountState !== "exact") {
    await sb.from("payments").update({ provider_status: amountState, status: "pending", verification_source: "kora_api_amount_mismatch" }).eq("id", paymentId);
    return NextResponse.json({ verified: false, status: amountState, paymentId });
  }

  // The status predicate makes confirmation atomic for concurrent returns or
  // webhook deliveries. Only the request that changed pending -> success may
  // unlock onboarding and create the admin payment notification.
  const now = new Date().toISOString();
  const { data: confirmedRows, error: confirmError } = await sb
    .from("payments")
    .update({ status: "success", provider_status: "success", paid_at: transaction.paidAt || now, verified_at: now, verification_source: "kora_api_verify", provider_fee: transaction.fee ?? null })
    .eq("id", paymentId)
    .eq("status", "pending")
    .select("id");

  if (confirmError) return NextResponse.json({ verified: false, status: "confirmation_failed", paymentId }, { status: 500 });
  if (!confirmedRows?.length) return NextResponse.json({ verified: true, status: "success", alreadyConfirmed: true, paymentId });

  const unlock = await unlockAfterPayment(sb, {
    id: payment.id,
    lead_id: payment.lead_id,
    client_id: payment.client_id,
    invoice_id: payment.invoice_id,
    amount: Number(payment.amount),
    currency: String(payment.currency || "NGN"),
    provider_reference: payment.provider_reference,
  });

  return NextResponse.json({ verified: true, status: "success", paymentId, invoiceUpdated: unlock.invoiceUpdated, leadUpdated: unlock.leadUpdated });
}
