// ELION : Canonical Pricing Model
// ------------------------------------------------------------------
// Single source of truth for every page that shows pricing:
//   - homepage (/)
//   - funnel (/funnel)
//   - landing pricing (/landing/pricing)
//
// The model is a 3-tier bundle (one-time implementation fee) plus an
// optional ongoing-support tier. Per-system/à-la-carte prices are no
// longer presented as the primary pricing surface anywhere; the
// automation systems remain a product/education section (see
// src/lib/products.ts) but pricing is always shown as the bundles
// below so the numbers reconcile across the site.
//
// IMPORTANT: the account name is intentionally NOT set : it must be
// added only when confirmed by the owner. Never invent it.
// ------------------------------------------------------------------

export interface TierFeature {
  text: string;
  included: boolean;
}

export interface PricingTier {
  id: string;
  name: string;
  price: string;
  period: string;
  bestFor: string;
  description: string;
  built: string;
  features: TierFeature[];
  supportDays: string;
  popular: boolean;
  cta: string;
}

export const ELION_TIERS: PricingTier[] = [
  {
    id: "starter",
    name: "Starter",
    price: "₦100,000",
    period: "one-time",
    bestFor: "businesses fixing their first operational leak",
    description: "One automation workflow for businesses getting started with automation.",
    built: "We build one focused workflow. For example, an automated lead response that captures enquiries from WhatsApp or your website and sends an instant reply.",
    features: [
      { text: "1 automation workflow", included: true },
      { text: "Lead capture & response", included: true },
      { text: "WhatsApp or email", included: true },
      { text: "Basic dashboard", included: true },
      { text: "Deployment & testing", included: true },
      { text: "Documentation", included: true },
      { text: "14 days post-launch support", included: true },
      { text: "Multiple channels", included: false },
      { text: "CRM integration", included: false },
      { text: "Custom workflows", included: false },
    ],
    supportDays: "14 days post-launch support",
    popular: false,
    cta: "Get Started",
  },
  {
    id: "growth",
    name: "Growth",
    price: "₦350,000",
    period: "one-time",
    bestFor: "businesses ready to automate the lead-to-booking journey",
    description: "A complete revenue workflow. Lead capture through to booking and follow-up.",
    built: "We build a complete lead-to-booking system. Capture, qualify, respond instantly, follow up automatically, and book appointments. The full revenue loop.",
    features: [
      { text: "Everything in Starter, plus:", included: true },
      { text: "Lead qualification", included: true },
      { text: "WhatsApp + email", included: true },
      { text: "Automated follow-up", included: true },
      { text: "Booking workflow", included: true },
      { text: "CRM integration", included: true },
      { text: "Calendar integration", included: true },
      { text: "Client dashboard", included: true },
      { text: "Workflow monitoring", included: true },
      { text: "30 days post-launch support", included: true },
      { text: "Custom workflows", included: false },
    ],
    supportDays: "30 days post-launch support",
    popular: true,
    cta: "Get Started",
  },
  {
    id: "scale",
    name: "Scale",
    price: "₦750,000",
    period: "one-time",
    bestFor: "businesses building an operational automation layer",
    description: "Multiple interconnected automation systems for established businesses.",
    built: "We build every system your business needs. Lead response, follow-up, booking, revenue recovery, operations, and custom workflows. All connected, all in one dashboard.",
    features: [
      { text: "Everything in Growth, plus:", included: true },
      { text: "Multiple automation systems", included: true },
      { text: "Custom workflows", included: true },
      { text: "Advanced API integrations", included: true },
      { text: "CRM + WhatsApp + email + calendar", included: true },
      { text: "Revenue recovery", included: true },
      { text: "Operations automation", included: true },
      { text: "Advanced monitoring", included: true },
      { text: "Custom configuration", included: true },
      { text: "Training", included: true },
      { text: "Documentation & handover", included: true },
      { text: "60 days post-launch support", included: true },
      { text: "Priority support", included: true },
    ],
    supportDays: "60 days post-launch support",
    popular: false,
    cta: "Get Started",
  },
];

export interface SupportPlan {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  note?: string;
}

export const ELION_SUPPORT_PLANS: SupportPlan[] = [
  {
    name: "Monthly Support",
    price: "₦50,000",
    period: "/month",
    description: "For businesses that want ongoing monitoring, maintenance, and improvements after their automation is live.",
    features: [
      "System monitoring and uptime",
      "Bug fixes and maintenance",
      "Monthly performance report",
      "Email support",
      "Minor workflow adjustments",
    ],
    note: "Optional. Requires an existing ELION automation implementation.",
  },
  {
    name: "Advanced Support",
    price: "₦150,000",
    period: "/month",
    description: "For businesses that want continuous improvement, new automation iterations, and strategic support.",
    features: [
      "Everything in Monthly Support",
      "New automation iterations",
      "Strategy calls",
      "A/B testing and optimisation",
      "WhatsApp support",
      "Priority handling",
    ],
    note: "Optional. Recommended for Growth and Scale plan clients.",
  },
];

/** The implementation pipeline shown beneath the tiers on every pricing surface. */
export const ELION_IMPLEMENTATION = ["Discover", "Configure", "Build", "Test", "Deploy", "Handover"];

// ------------------------------------------------------------------
// Manual payment (temporary until online payment is verified)
// ------------------------------------------------------------------
export const ELION_PAYMENT = {
  method: "Bank transfer",
  bank: "Opay",
  accountNumber: "9126281855",
  // NOTE: account name intentionally not set : confirm with the owner
  // before ever displaying it. Never invent it.
  accountName: null as string | null,
  notice:
    "Manual payment is currently available. Online card/payment processing is being finalized : you can secure your implementation via bank transfer.",
  afterPayment:
    "After payment, send your payment confirmation/reference via the contact channel and we will begin onboarding.",
  onlinePaymentNote: "Secure online payment will be available once our payment processing setup is fully verified.",
};