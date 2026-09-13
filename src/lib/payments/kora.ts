// Kora payment provider — ELION's provider-neutral payment boundary.
//
// Checkout Redirect uses major currency units (for example, NGN 1000 is sent
// as amount: 1000). Kora returns the same unit in charge/webhook payloads;
// ELION stores the invoice/payment amount in that same unit.
//
// Security rules:
//  - a browser redirect never marks a payment paid;
//  - webhooks use Kora's documented HMAC-SHA256 signature over only `data`;
//  - successful payments are re-verified against Kora before unlocking access.

import { createHmac, timingSafeEqual } from "crypto";

export const KORA_CURRENCIES = ["NGN", "USD", "GBP", "EUR"] as const;
export type KoraCurrency = (typeof KORA_CURRENCIES)[number];

export interface KoraConfig {
  secretKey: string;
}

export interface CheckoutInput {
  amount: number;
  currency: KoraCurrency;
  reference: string;
  customerName?: string;
  customerEmail: string;
  redirectUrl: string;
  notificationUrl: string;
  metadata?: Record<string, string>;
}

export interface CheckoutResult {
  checkoutUrl: string;
  reference: string;
}

export type VerifiedStatus = "pending" | "processing" | "success" | "failed" | "cancelled" | "refunded";

export interface VerifiedTransaction {
  status: VerifiedStatus;
  reference: string;
  amount: number;
  currency: string;
  paidAt?: string | null;
  fee?: number | null;
}

export type PaymentAmountState = "exact" | "underpaid" | "overpaid" | "currency_mismatch";

export function isKoraCurrency(value: unknown): value is KoraCurrency {
  return typeof value === "string" && KORA_CURRENCIES.includes(value.toUpperCase() as KoraCurrency);
}

export function normalizeKoraCurrency(value: unknown): KoraCurrency | null {
  const normalized = typeof value === "string" ? value.toUpperCase() : "";
  return isKoraCurrency(normalized) ? normalized : null;
}

export function comparePaymentAmount(expected: number, expectedCurrency: string, transaction: VerifiedTransaction): PaymentAmountState {
  if (transaction.currency.toUpperCase() !== expectedCurrency.toUpperCase()) return "currency_mismatch";
  if (transaction.amount < expected) return "underpaid";
  if (transaction.amount > expected) return "overpaid";
  return "exact";
}

const KORA_BASE = "https://api.korapay.com/merchant/api/v1";

function numberOrZero(value: unknown): number {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function mapStatus(value: unknown): VerifiedStatus {
  switch (String(value || "pending").toLowerCase()) {
    case "success":
    case "successful":
      return "success";
    case "failed":
      return "failed";
    case "processing":
      return "processing";
    case "cancelled":
    case "canceled":
      return "cancelled";
    case "refunded":
      return "refunded";
    default:
      return "pending";
  }
}

export class KoraProvider {
  constructor(private readonly cfg: KoraConfig) {}

  private auth() {
    return {
      Authorization: `Bearer ${this.cfg.secretKey}`,
      "Content-Type": "application/json",
    };
  }

  /** POST /charges/initialize — returns the hosted Checkout Redirect URL. */
  async createCheckout(input: CheckoutInput): Promise<CheckoutResult> {
    if (!(input.amount > 0)) throw new Error("Payment amount must be greater than zero");
    if (!isKoraCurrency(input.currency)) throw new Error("Unsupported Kora currency");
    if (!input.customerEmail) throw new Error("Customer email is required for Kora checkout");

    const body = {
      amount: input.amount,
      currency: input.currency,
      reference: input.reference,
      customer: {
        email: input.customerEmail,
        ...(input.customerName ? { name: input.customerName } : {}),
      },
      redirect_url: input.redirectUrl,
      notification_url: input.notificationUrl,
      ...(input.metadata && Object.keys(input.metadata).length > 0 ? { metadata: input.metadata } : {}),
    };

    const response = await fetch(`${KORA_BASE}/charges/initialize`, {
      method: "POST",
      headers: this.auth(),
      body: JSON.stringify(body),
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok || json.status !== true || !json.data?.checkout_url) {
      throw new Error(`Kora initialize failed: ${json.message || response.statusText || "unknown error"}`);
    }

    return {
      checkoutUrl: String(json.data.checkout_url),
      reference: String(json.data.reference || input.reference),
    };
  }

  /** GET /charges/:reference — authoritative server-side transaction status. */
  async verifyTransaction(reference: string): Promise<VerifiedTransaction> {
    const response = await fetch(`${KORA_BASE}/charges/${encodeURIComponent(reference)}`, {
      method: "GET",
      headers: this.auth(),
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok || json.status !== true || !json.data) {
      throw new Error(`Kora verify failed: ${json.message || response.statusText || "unknown error"}`);
    }

    const data = json.data as Record<string, unknown>;
    return {
      status: mapStatus(data.status),
      reference: String(data.reference || data.payment_reference || reference),
      amount: numberOrZero(data.amount),
      currency: String(data.currency || "NGN").toUpperCase(),
      paidAt: data.paid_at ? String(data.paid_at) : data.transaction_date ? String(data.transaction_date) : null,
      fee: data.fee != null ? numberOrZero(data.fee) : data.fees != null ? numberOrZero(data.fees) : null,
    };
  }

  /** Kora signs only JSON.stringify(payload.data) with the merchant secret. */
  verifyWebhookSignature(signature: string | null | undefined, dataPayload: unknown): boolean {
    if (!signature || !dataPayload || typeof dataPayload !== "object") return false;
    const expected = createHmac("sha256", this.cfg.secretKey).update(JSON.stringify(dataPayload)).digest("hex");
    const received = signature.trim().toLowerCase();
    if (!/^[a-f0-9]{64}$/.test(received) || received.length !== expected.length) return false;
    return timingSafeEqual(Buffer.from(expected, "utf8"), Buffer.from(received, "utf8"));
  }
}

/** Configured server-only provider. Never import this from a client component. */
export function getKoraProvider(): KoraProvider | null {
  const secretKey = process.env.KORAPAY_SECRET_KEY;
  return secretKey ? new KoraProvider({ secretKey }) : null;
}
