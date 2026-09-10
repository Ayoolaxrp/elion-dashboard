// Entitlement unlock — runs ONLY after a payment has been confirmed by
// server-side verification (API verify or signed webhook). Never called from
// a browser redirect or checkout-return handler alone.
//
// Idempotent by construction: invoice paid-flag and lead status are only
// ever flipped into the paid state, never created or duplicated.

import type { SupabaseClient } from "@supabase/supabase-js";

export interface ConfirmedPayment {
  id: string;
  lead_id: string | null;
  client_id: string | null;
  invoice_id: string | null;
}

const PRE_PAID_LEAD_STAGES = ["new", "audited", "contacted", "qualified", "proposal"];

export async function unlockAfterPayment(
  sb: SupabaseClient,
  payment: ConfirmedPayment
): Promise<{ invoiceUpdated: boolean; leadUpdated: boolean }> {
  let invoiceUpdated = false;
  let leadUpdated = false;

  if (payment.invoice_id) {
    // Only flip invoices that are still unpaid; never downgrade an already-paid invoice.
    const { data, error } = await sb
      .from("invoices")
      .update({ status: "paid", paid_at: new Date().toISOString() })
      .eq("id", payment.invoice_id)
      .in("status", ["draft", "sent", "overdue"])
      .select("id");
    if (!error && data && data.length > 0) invoiceUpdated = true;
  }

  if (payment.lead_id) {
    // A lead marked lost must stay lost (manual review), so only promote
    // pre-paid pipeline stages to "paid".
    const { data, error } = await sb
      .from("leads")
      .update({ lead_status: "paid" })
      .eq("id", payment.lead_id)
      .in("lead_status", PRE_PAID_LEAD_STAGES)
      .select("id");
    if (!error && data && data.length > 0) leadUpdated = true;
  }

  return { invoiceUpdated, leadUpdated };
}