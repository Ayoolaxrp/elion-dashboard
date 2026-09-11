// Kora payment provider — ELION's live provider, behind a provider-neutral
// interface so Paystack or another provider can be added later without
// touching order/invoice/entitlement logic.
//
// Amounts are handled in NAIRA at this boundary (matching the rest of the
// admin payment flow) and converted to/from kobo only at the Kora API edge.
//
// Security rules enforced by callers:
//  - a browser redirect NEVER marks a payment paid; only server-side
//    verification (API verify or signed webhook) flips status.
//  - Kora webhooks use x-korapay-signature: HMAC-SHA256 of only the data
//    object, signed with the merchant secret key.
//  - the webhook is signature-validated AND re-verified against Kora before
//    any entitlement unlock.

import { createHmac, timingSafeEqual } from "crypto";

export interface KoraConfig {
  secretKey: string;
  webhookSecret?: string;
}

export interface CheckoutInput {
  amountNaira: number;
  currency?: string; // default NGN
  reference: string;
  customerName?: string;
  customerEmail?: string;
  redirectUrl: string;
}

export interface CheckoutResult {
  checkoutUrl: string;
  reference: string;
  accessCode?: string;
}

export type VerifiedStatus = "pending" | "success" | "failed";

export interface VerifiedTransaction {
  status: VerifiedStatus;
  reference: string;
  amountNaira: number;
  currency?: string;
  paidAt?: string | null;
  feeNaira?: number | null;
}

export type PaymentAmountState = "exact" | "underpaid" | "overpaid" | "currency_mismatch";

export function comparePaymentAmount(expectedNaira: number, expectedCurrency: string, transaction: VerifiedTransaction): PaymentAmountState {
  if ((transaction.currency || "NGN").toUpperCase() !== expectedCurrency.toUpperCase()) return "currency_mismatch";
  if (transaction.amountNaira < expectedNaira) return "underpaid";
  if (transaction.amountNaira > expectedNaira) return "overpaid";
  return "exact";
}

const KORA_BASE = "https://api.korapay.com/api/v1";

function koboToNaira(kobo: unknown): number {
  const n = Number(kobo);
  return Number.isFinite(n) ? Math.round(n) / 100 : 0;
}

function nairaToKobo(naira: number): number {
  return Math.round(naira * 100);
}

export class KoraProvider {
  constructor(private cfg: KoraConfig) {}

  private auth() {
    return {
      Authorization: "Bearer " + this.cfg.secretKey,
      "Content-Type": "application/json",
    };
  }

  /** POST /transactions/initialize → checkout_url the customer pays on. */
  async createCheckout(input: CheckoutInput): Promise<CheckoutResult> {
    if (input.amountNaira <= 0) throw new Error("Payment amount must be greater than zero");
    const body = {
      amount: nairaToKobo(input.amountNaira),
      reference: input.reference,
      currency: input.currency || "NGN",
      customer: {
        name: input.customerName || "ELION Client",
        email: input.customerEmail || "client@elion.com.ng",
      },
      redirect_url: input.redirectUrl,
    };
    const res = await fetch(`${KORA_BASE}/transactions/initialize`, {
      method: "POST",
      headers: this.auth(),
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json.status !== true || !json.data?.checkout_url) {
      throw new Error("Kora initialize failed: " + (json.message || res.statusText || "unknown error"));
    }
    return {
      checkoutUrl: json.data.checkout_url as string,
      reference: (json.data.reference as string) || input.reference,
      accessCode: json.data.access_code as string | undefined,
    };
  }

  /** GET /transactions/:reference → authoritative server-side status. */
  async verifyTransaction(reference: string): Promise<VerifiedTransaction> {
    const res = await fetch(`${KORA_BASE}/transactions/${encodeURIComponent(reference)}`, {
      method: "GET",
      headers: this.auth(),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json.status !== true || !json.data) {
      throw new Error("Kora verify failed: " + (json.message || res.statusText || "unknown error"));
    }
    const d = json.data as Record<string, unknown>;
    const rawStatus = String(d.status || "pending").toLowerCase();
    const status: VerifiedStatus =
      rawStatus === "success" ? "success" : rawStatus === "failed" ? "failed" : "pending";
    return {
      status,
      reference: String(d.reference || reference),
      amountNaira: koboToNaira(d.amount),
      currency: d.currency ? String(d.currency) : "NGN",
      paidAt: d.paid_at ? String(d.paid_at) : null,
      feeNaira: d.fee != null || d.fees != null ? koboToNaira(d.fee ?? d.fees) : null,
    };
  }

  /**
   * Verify Kora's x-korapay-signature. Kora signs ONLY the data object,
   * serialized as JSON, with the merchant secret key. Use timing-safe
   * comparison and reject malformed signatures.
   */
  verifyWebhookSignature(signature: string | null | undefined, dataPayload: unknown): boolean {
    if (!signature || !dataPayload || typeof dataPayload !== "object") return false;
    const expected = createHmac("sha256", this.cfg.secretKey)
      .update(JSON.stringify(dataPayload))
      .digest("hex");
    const received = signature.trim().toLowerCase();
    if (!/^[a-f0-9]{64}$/.test(received) || received.length !== expected.length) return false;
    return timingSafeEqual(Buffer.from(expected, "utf8"), Buffer.from(received, "utf8"));
  }
}

/** Configured provider, or null when KORA_SECRET_KEY is not set. */
export function getKoraProvider(): KoraProvider | null {
  const secretKey = process.env.KORA_SECRET_KEY;
  if (!secretKey) return null;
  return new KoraProvider({
    secretKey,
    webhookSecret: process.env.KORA_WEBHOOK_SECRET || secretKey,
  });
}