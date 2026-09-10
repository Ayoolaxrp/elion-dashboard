// Vendor-cost register (P0 of the commercial-delivery sprint).
//
// ELION must never finance client infrastructure by accident. Default rule:
// the CLIENT pays directly for client-specific vendors (n8n, WhatsApp, AI
// APIs, email/SMS, hosting/database). ELION earns from implementation and
// management. When ELION pays on a client's behalf, that must be explicit
// and included in the quote's direct cost.

export type BillingOwner = "client" | "elion";

export interface VendorCost {
  vendor: string;
  service: string;
  purpose?: string;
  billingOwner: BillingOwner;
  currency: string;
  fixedFee?: number;             // monthly fixed, in currency
  includedAllowance?: string;    // e.g. "2,000 runs/mo"
  variableBasis?: string;        // e.g. "per 1,000 runs", "per message"
  expectedMonthlyUsage?: number;
  actualMonthlyUsage?: number;
}

export interface VendorCostRegisterResult {
  rows: VendorCost[];
  elionPaidMonthly: number;
  clientPaidMonthly: number;
  warnings: string[];
}

/**
 * Normalize the register and surface the economics that matter:
 * what ELION pays per month (must appear in the quote's direct cost) and
 * what the client pays directly (must never be quoted as ELION's cost).
 */
export function evaluateVendorCostRegister(rows: VendorCost[]): VendorCostRegisterResult {
  const normalized: VendorCost[] = rows.map((r) => ({
    ...r,
    currency: r.currency || "NGN",
    billingOwner: r.billingOwner === "elion" ? "elion" : "client",
  }));

  const elionPaidMonthly = normalized
    .filter((r) => r.billingOwner === "elion")
    .reduce((sum, r) => sum + (r.fixedFee || 0), 0);
  const clientPaidMonthly = normalized
    .filter((r) => r.billingOwner === "client")
    .reduce((sum, r) => sum + (r.fixedFee || 0), 0);

  const warnings: string[] = [];
  if (elionPaidMonthly > 0) {
    warnings.push(
      `ELION pays ${elionPaidMonthly} ${normalized[0]?.currency || "NGN"}/month on the client's behalf — this must be inside the quote's recurring direct cost.`
    );
  }
  const unknownOwner = normalized.filter((r) => r.billingOwner !== "client" && r.billingOwner !== "elion");
  if (unknownOwner.length) {
    warnings.push(`${unknownOwner.length} vendor row(s) have no billing owner — decide before quoting.`);
  }
  const unlimited = normalized.filter(
    (r) => !r.fixedFee && !r.includedAllowance && !r.variableBasis && r.billingOwner === "elion"
  );
  if (unlimited.length) {
    warnings.push("Unbounded ELION-paid usage detected — never promise unlimited AI/WhatsApp/SMS/executions inside a fixed fee.");
  }

  return { rows: normalized, elionPaidMonthly, clientPaidMonthly, warnings };
}