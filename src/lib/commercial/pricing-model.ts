// ELION Commercial Model : configuration, not copy.
//
// Every commercial number lives here. The public site copy (src/lib/pricing.ts)
// remains the customer-facing surface; this module is the machine-readable
// source for proposals, margin guardrails, and the commercial dashboard.
// Changing commercial assumptions = changing this file + DECISION-LOG entry.

export type TierId = "recovery_sprint" | "growth_system" | "scale_system" | "custom";

export interface CommercialTier {
  id: TierId;
  name: string;
  /** Public positioning line. */
  positioning: string;
  implementationFrom: number;         // NGN
  careMonthly: number;                // NGN/month ELION Care
  scope: string;
  workflows: string;
  /** Margin guardrail: direct-cost ceilings at the package floor. */
  maxImplementationDirectCost: number;
  maxRecurringDirectCostMonthly: number;
  paymentTerms: Array<{ label: string; percent: number }>;
}

export const COMMERCIAL_TIERS: CommercialTier[] = [
  {
    id: "recovery_sprint",
    name: "Recovery Sprint",
    positioning: "One clearly defined workflow or problem, fixed scope, fast delivery.",
    implementationFrom: 150_000,
    careMonthly: 50_000,
    scope: "One workflow/problem",
    workflows: "1",
    maxImplementationDirectCost: 60_000,   // 60% contribution margin at floor
    maxRecurringDirectCostMonthly: 15_000, // 70% at floor
    paymentTerms: [
      { label: "Kickoff (pre-implementation)", percent: 70 },
      { label: "Go-live", percent: 30 },
    ],
  },
  {
    id: "growth_system",
    name: "Growth System",
    positioning: "Connected workflows across the lead-to-booking journey.",
    implementationFrom: 350_000,
    careMonthly: 100_000,
    scope: "2-4 connected workflows",
    workflows: "2-4",
    maxImplementationDirectCost: 140_000,
    maxRecurringDirectCostMonthly: 30_000,
    paymentTerms: [
      { label: "Kickoff (pre-implementation)", percent: 70 },
      { label: "Go-live", percent: 30 },
    ],
  },
  {
    id: "scale_system",
    name: "Scale System",
    positioning: "Multi-workflow operations layer with custom integrations for larger teams.",
    implementationFrom: 750_000,
    careMonthly: 200_000,
    scope: "Multi-workflow / custom integrations",
    workflows: "5+",
    maxImplementationDirectCost: 300_000,
    maxRecurringDirectCostMonthly: 60_000,
    paymentTerms: [
      { label: "Kickoff", percent: 50 },
      { label: "Mid-implementation milestone", percent: 30 },
      { label: "Go-live", percent: 20 },
    ],
  },
  {
    id: "custom",
    name: "Custom System",
    positioning: "Scoped individually against discovery.",
    implementationFrom: 0, // always quoted
    careMonthly: 0,        // quoted per scope
    scope: "Per discovery",
    workflows: "Per scope",
    maxImplementationDirectCost: 0, // guardrails computed at quote time
    maxRecurringDirectCostMonthly: 0,
    paymentTerms: [{ label: "Per contract", percent: 100 }],
  },
];

// ── ELION Care (recurring) ──

export interface CarePlan {
  name: string;
  monthly: number;
  scope: string[];
  exclusions: string[];
  responseTarget: string;
}

export const CARE_PLANS: CarePlan[] = [
  {
    name: "ELION Care Sprint",
    monthly: 50_000,
    scope: [
      "Workflow monitoring and failure alerts",
      "Bug fixes on delivered workflows",
      "Routine workflow tuning (included minor changes)",
      "Usage management and monthly usage report",
      "Email support, next-business-day response target",
    ],
    exclusions: ["New workflows", "New channel integrations", "Strategy iterations"],
    responseTarget: "Next business day",
  },
  {
    name: "ELION Care Growth",
    monthly: 100_000,
    scope: [
      "Everything in Care Sprint",
      "Monthly performance review call",
      "Quarterly workflow iteration (config-level)",
      "WhatsApp support, same-day response target",
    ],
    exclusions: ["New workflows beyond agreed scope"],
    responseTarget: "Same day (business hours)",
  },
  {
    name: "ELION Care Scale",
    monthly: 200_000,
    scope: [
      "Everything in Care Growth",
      "Priority handling",
      "Quarterly strategy session",
      "Dedicated change-request queue",
    ],
    exclusions: ["New custom integrations (quoted separately)"],
    responseTarget: "Priority queue",
  },
];

// Scope classification: what a request IS determines who pays.
export type RequestClass = "bug" | "configuration_change" | "new_feature" | "new_workflow";
export const REQUEST_CLASSIFICATION: Record<RequestClass, string> = {
  bug: "Defect against agreed behaviour: fixed under ELION Care at no charge.",
  configuration_change: "Adjustment inside delivered workflow config: included minor changes under Care; otherwise quoted.",
  new_feature: "New capability inside an existing workflow: change request / upsell.",
  new_workflow: "New workflow: new proposal.",
};

// ── Unit economics ──

export interface QuoteCostInput {
  tier: TierId;
  /** Implementation price actually quoted (NGN). */
  quotedImplementation: number;
  /** Care price actually quoted (NGN/month), 0 if declined. */
  quotedCareMonthly: number;
  estimatedDeliveryHours: number;
  /** Internal hourly shadow rate (NGN). Founder default in COMMERCIAL_MODEL. */
  labourRatePerHour: number;
  contractorCost: number;
  clientInfrastructureMonthly: number; // client-specific infra ELION pays for
  apiSetupCost: number;
  onboardingCost: number;
  contingencyPercent: number; // e.g. 10
}

export interface MarginCheck {
  implementationDirectCost: number;
  implementationMargin: number; // 0-1
  recurringDirectCostMonthly: number;
  recurringMargin: number;
  passes: boolean;
  warnings: string[];
  recommendation: string;
}

export const TARGET_IMPLEMENTATION_MARGIN = 0.6;
export const TARGET_RECURRING_MARGIN = 0.7;

export function checkQuoteMargin(input: QuoteCostInput): MarginCheck {
  const warnings: string[] = [];
  const labour = input.estimatedDeliveryHours * input.labourRatePerHour;
  const contingency = Math.round(((labour + input.contractorCost + input.apiSetupCost + input.onboardingCost) * input.contingencyPercent) / 100);
  const implementationDirectCost = labour + input.contractorCost + input.apiSetupCost + input.onboardingCost + contingency;
  const recurringDirectCostMonthly = input.clientInfrastructureMonthly;

  const implementationMargin = input.quotedImplementation > 0 ? 1 - implementationDirectCost / input.quotedImplementation : 0;
  const recurringMargin = input.quotedCareMonthly > 0 ? 1 - recurringDirectCostMonthly / input.quotedCareMonthly : 1;

  const tier = COMMERCIAL_TIERS.find((t) => t.id === input.tier);
  const implCeiling = tier && tier.maxImplementationDirectCost > 0 ? tier.maxImplementationDirectCost : Infinity;
  const recCeiling = tier && tier.maxRecurringDirectCostMonthly > 0 ? tier.maxRecurringDirectCostMonthly : Infinity;

  let passes = true;
  if (implementationDirectCost > implCeiling) {
    passes = false;
    warnings.push(`Implementation direct cost NGN ${implementationDirectCost.toLocaleString()} exceeds the ${tier?.name} ceiling NGN ${implCeiling.toLocaleString()} (margin ${(implementationMargin * 100).toFixed(0)}% < ${(TARGET_IMPLEMENTATION_MARGIN * 100).toFixed(0)}%).`);
  }
  if (input.quotedCareMonthly > 0 && recurringDirectCostMonthly > recCeiling) {
    passes = false;
    warnings.push(`Recurring direct cost NGN ${recurringDirectCostMonthly.toLocaleString()}/mo exceeds the ${tier?.name} ceiling NGN ${recCeiling.toLocaleString()}/mo (margin ${(recurringMargin * 100).toFixed(0)}% < ${(TARGET_RECURRING_MARGIN * 100).toFixed(0)}%).`);
  }
  if (input.quotedImplementation < (tier?.implementationFrom || 0)) {
    warnings.push(`Quoted implementation NGN ${input.quotedImplementation.toLocaleString()} is below the ${tier?.name} floor NGN ${(tier?.implementationFrom || 0).toLocaleString()}.`);
  }

  const recommendation = passes
    ? "Within guardrails."
    : "Do NOT silently accept. Options: reduce scope, move to a higher tier, quote custom price, or improve template reusability before delivery.";

  return { implementationDirectCost, implementationMargin, recurringDirectCostMonthly, recurringMargin, passes, warnings, recommendation };
}

// ── Usage / overage (variable infrastructure is NEVER unlimited) ──

export interface UsageModel {
  includedAllowanceNGN: number;
  overagePolicy: "prepaid_wallet" | "measured_overage";
  note: string;
  variableCostCategories: string[];
}

export const USAGE_MODEL: UsageModel = {
  includedAllowanceNGN: 15_000, // third-party variable usage included per month at Care floor
  overagePolicy: "measured_overage",
  note:
    "Third-party variable usage (WhatsApp/SMS/email/AI/voice/APIs) is metered monthly. Usage above the included allowance is passed through at provider cost + 20% handling, billed with the next Care invoice, or prepaid via wallet. FX movements on USD-denominated services are reviewed quarterly.",
  variableCostCategories: [
    "WhatsApp Business API conversations",
    "SMS",
    "Email send volume",
    "AI model tokens",
    "Voice minutes",
    "External CRM seats",
    "n8n hosting (client-specific)",
    "Storage",
    "Enrichment/API providers",
  ],
};

// ── Payment / cash-flow rules ──

export const CASHFLOW_RULES = {
  firstCareMonthPrepaid: true,
  commissionBasis: "collected_cleared_cash" as const,
  productionActivationRequires: "implementation balance below material-overdue threshold",
  materialOverdueThresholdNGN: 1,
  largeInvoicePreference: "bank_transfer_virtual_account",
  cardPaymentsRetained: true,
};

// ── Build + Handover ──

export const BUILD_HANDOVER = {
  multiplier: [1.4, 1.6] as [number, number],
  includes: ["Implementation", "Documentation", "Handover session", "30-day defect warranty"],
  excludes: ["Monitoring", "Ongoing optimisation", "Managed hosting", "Usage management", "SLA", "Future changes"],
  note: "Never priced below the managed-service equivalent.",
};

// ── Annual pricing ──

export const ANNUAL_PRICING = {
  maxDiscountOnBaseRecurring: 0.10,
  discountOnVariableUsage: false,
  note: "Configurable; protect margin against FX and infrastructure inflation. Do not copy competitor discount depth.",
};

// ── Founding Partner Pilot (INTERNAL ONLY : never public) ──

export const FOUNDING_PARTNER_PILOT = {
  internalOnly: true,
  implementationMinimum: 100_000,
  maxCustomers: 5,
  scope: "One templated problem, strict scope, measured pilot",
  expansionPricing: "normal",
  note: "Shown publicly ONLY if explicitly approved by the owner. Default: hidden.",
};

// ── Shadow labour rate (founder input, review quarterly) ──

export const LABOUR_RATE_DEFAULT_NGN_PER_HOUR = 5_000;
