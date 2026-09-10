// ELION Solution Catalogue : the commercial layer over the audit pipeline.
//
// Rules encoded here:
// - Absence of technology is NOT automatically a leak. Every solution has
//   explicit applicability and disqualifying conditions.
// - Financial ROI is NOT promised. Outcomes are operational.
// - The catalogue is data-driven: the audit pipeline maps verified evidence
//   categories to solutions via matchEvidence; the applicability engine
//   (applicability.ts) applies business context to decide whether a
//   recommendation may be shown at all.

export type SolutionSlug =
  | "lead_response_capture"
  | "lead_recovery_followup"
  | "customer_reactivation"
  | "booking_no_show"
  | "client_onboarding"
  | "operations_automation"
  | "custom_business_system";

export type EvidenceCategory =
  | "whatsapp" | "email" | "phone" | "social" | "booking"
  | "live_chat" | "crm" | "email_marketing" | "ecommerce"
  | "website_quality" | "reachability";

export type ApplicabilityState =
  | "strong_opportunity"
  | "investigate"
  | "not_applicable"
  | "insufficient_evidence"
  | "no_recommendation";

export type Complexity = "low" | "medium" | "high";
export type PricingTier = "recovery_sprint" | "growth_system" | "scale_system" | "custom";

export interface SolutionDefinition {
  slug: SolutionSlug;
  name: string;
  /** The business problem this solution solves (operator language). */
  businessProblem: string;
  /** Evidence categories that make this solution RELEVANT when found weak/missing. */
  relevantWhenWeak: EvidenceCategory[];
  /** Evidence categories that, when STRONG, can disqualify or reduce relevance. */
  disqualifyingWhenStrong: Partial<Record<EvidenceCategory, string>>;
  /** Business contexts where this is irrelevant. */
  notApplicableWhen: Array<{
    condition: string;
    /** Industry keys this condition applies to (lowercase substring match). */
    industries: string[];
  }>;
  /** Questions the salesperson MUST ask before proposing. */
  discoveryQuestions: string[];
  /** What ELION actually builds/does. */
  intervention: string;
  /** Expected OPERATIONAL outcome (never financial ROI). */
  operationalOutcome: string;
  complexity: Complexity;
  pricingTier: PricingTier;
  supportRequirements: string;
  possibleIntegrations: string[];
  /**
   * Minimum evidence quality required before this can be recommended:
   * how many of relevantWhenWeak categories must be verifiably weak/missing
   * (vs merely unverifiable) for a "strong opportunity".
   */
  minVerifiedWeakCount: number;
  /**
   * Categories that must be POSITIVELY detected (status found with medium/high
   * confidence) before this solution may be a "strong opportunity".
   *
   * This is the anti-inflation gate: a strong opportunity requires proof the
   * business motion/channel exists, not merely the absence of technology.
   * A solution with an empty list can never be strong from public evidence
   * alone (its entire business case is internal/invisible), so it is capped
   * at "investigate" until confirmed with the business.
   */
  strongRequiresPositive: EvidenceCategory[];
}

export const SOLUTION_CATALOG: SolutionDefinition[] = [
  {
    slug: "lead_response_capture",
    name: "Lead Response & Capture System",
    businessProblem:
      "New enquiries arrive through public channels but there is no visible automated first-response or capture path, so response speed depends on whoever happens to see the message.",
    relevantWhenWeak: ["whatsapp", "live_chat", "booking"],
    disqualifyingWhenStrong: {
      live_chat: "A chat widget already provides an automated first-response surface.",
    },
    notApplicableWhen: [
      {
        condition: "Pure e-commerce catalogue site where enquiries are checkout-driven, not conversation-led.",
        industries: ["e-commerce", "ecommerce", "retail"],
      },
    ],
    discoveryQuestions: [
      "When a new WhatsApp or website enquiry arrives, who sees it first, and how quickly do they usually reply?",
      "What happens to an enquiry that arrives after work hours?",
      "How do you record a new enquiry today: spreadsheet, notebook, inbox, or a system?",
    ],
    intervention:
      "Instant automated first-response on the business's primary channel, structured lead capture into a trackable store, and routing to a human owner.",
    operationalOutcome:
      "Every enquiry receives an immediate acknowledgement and is recorded; nothing depends on someone noticing a message.",
    complexity: "medium",
    pricingTier: "recovery_sprint",
    supportRequirements: "Channel monitoring, template tuning, monthly response-time review.",
    possibleIntegrations: ["WhatsApp Business API", "Email (SMTP/Resend)", "Google Sheets", "HubSpot", "Zoho", "n8n"],
    minVerifiedWeakCount: 1,
    strongRequiresPositive: ["whatsapp", "live_chat", "email"],
  },
  {
    slug: "lead_recovery_followup",
    name: "Lead Recovery & Follow-Up System",
    businessProblem:
      "Enquiries that do not convert immediately have no structured follow-up, so interested prospects go quiet without a traceable reason.",
    relevantWhenWeak: ["crm", "email_marketing", "whatsapp"],
    disqualifyingWhenStrong: {
      crm: "A CRM is present; follow-up may already be structured (internal process still unverified).",
    },
    notApplicableWhen: [],
    discoveryQuestions: [
      "Roughly how many enquiries in a month do not buy immediately?",
      "What happens to those people today: is anyone following up, and how many times?",
      "After how many attempts do you stop following up?",
    ],
    intervention:
      "Time-based follow-up sequences on the business's channels with stop conditions, escalation to a human, and full activity logging.",
    operationalOutcome:
      "Every non-converting enquiry enters a defined follow-up sequence with a measurable outcome instead of silently going cold.",
    complexity: "medium",
    pricingTier: "recovery_sprint",
    supportRequirements: "Sequence performance review, message tuning, stop-condition adjustments.",
    possibleIntegrations: ["WhatsApp Business API", "Email (SMTP/Resend)", "HubSpot", "Zoho", "Google Sheets", "n8n"],
    minVerifiedWeakCount: 1,
    strongRequiresPositive: ["whatsapp", "email"],
  },
  {
    slug: "customer_reactivation",
    name: "Customer Reactivation System",
    businessProblem:
      "Past customers and old enquiries are not systematically contacted, so repeatable revenue from known contacts depends on memory.",
    relevantWhenWeak: ["crm", "email_marketing"],
    disqualifyingWhenStrong: {},
    notApplicableWhen: [
      {
        condition: "Business model has no meaningful repeat/rehire loop (e.g. one-off event stand).",
        industries: ["events"],
      },
    ],
    discoveryQuestions: [
      "Do customers ever buy from you more than once? How often?",
      "When last did you deliberately contact old customers with an offer?",
      "How many past customers could you reach right now if you wanted to?",
    ],
    intervention:
      "Segmented reactivation campaigns over owned contact lists with consent checks, offer templates, and response tracking.",
    operationalOutcome:
      "A defined, repeatable reactivation motion over past customers instead of ad-hoc outreach.",
    complexity: "medium",
    pricingTier: "recovery_sprint",
    supportRequirements: "Campaign review, list hygiene, consent management.",
    possibleIntegrations: ["WhatsApp Business API", "Email (Resend/Brevo)", "Google Sheets", "n8n"],
    minVerifiedWeakCount: 1,
    strongRequiresPositive: ["email_marketing"],
  },
  {
    slug: "booking_no_show",
    name: "Booking & No-Show System",
    businessProblem:
      "Appointments or viewings are arranged manually with no visible self-serve booking, reminders, or rescheduling flow.",
    relevantWhenWeak: ["booking"],
    disqualifyingWhenStrong: {
      booking: "An online booking path already exists; reminder/no-show handling is internal and must be asked about.",
    },
    notApplicableWhen: [
      {
        condition: "Business sells products online with no appointment component.",
        industries: ["e-commerce", "ecommerce", "retail"],
      },
    ],
    discoveryQuestions: [
      "How does a customer currently book a viewing, consultation, or appointment?",
      "What share of booked appointments do not show up (best guess)?",
      "Do you send reminders today, and how?",
    ],
    intervention:
      "Self-serve booking with calendar sync, automated confirmations and reminders, and rescheduling/cancellation handling.",
    operationalOutcome:
      "Bookings happen without back-and-forth, and no-shows are measurably tracked and reminded.",
    complexity: "medium",
    pricingTier: "growth_system",
    supportRequirements: "Calendar sync monitoring, reminder template tuning.",
    possibleIntegrations: ["Google Calendar", "Calendly", "WhatsApp Business API", "Email", "n8n"],
    minVerifiedWeakCount: 1,
    strongRequiresPositive: [],
  },
  {
    slug: "client_onboarding",
    name: "Client Onboarding System",
    businessProblem:
      "After payment, new clients are onboarded manually: documents, forms, access collection and kickoff are unstructured and slow.",
    relevantWhenWeak: ["crm", "email_marketing"],
    disqualifyingWhenStrong: {},
    notApplicableWhen: [
      {
        condition: "Transaction-led consumer business with no post-sale onboarding relationship.",
        industries: ["e-commerce", "ecommerce", "retail"],
      },
    ],
    discoveryQuestions: [
      "Walk me through what happens between payment and delivery for a new client.",
      "What documents or access do you usually need to collect, and how long does that take?",
      "Have clients ever gone quiet between paying and starting?",
    ],
    intervention:
      "Structured onboarding flow: document collection, forms, access checklist, kickoff scheduling, and progress the client can see.",
    operationalOutcome:
      "Onboarding steps are tracked and repeatable; time-from-payment-to-live is measured.",
    complexity: "high",
    pricingTier: "growth_system",
    supportRequirements: "Per-client onboarding monitoring, document template updates.",
    possibleIntegrations: ["Google Workspace", "DocuSign/signature tools", "Email", "WhatsApp", "n8n"],
    minVerifiedWeakCount: 1,
    strongRequiresPositive: [],
  },
  {
    slug: "operations_automation",
    name: "Operations Automation System",
    businessProblem:
      "Staff repeatedly move the same information between tools (copying data, compiling reports, notifying people) with no automation.",
    relevantWhenWeak: ["crm", "email_marketing", "ecommerce"],
    disqualifyingWhenStrong: {},
    notApplicableWhen: [],
    discoveryQuestions: [
      "What is the most repetitive task your team does every week?",
      "Which two tools do you constantly copy data between?",
      "How many hours a week does your team spend on manual updates and reports?",
    ],
    intervention:
      "Targeted automations between the business's existing tools: notifications, data sync, report generation, task creation.",
    operationalOutcome:
      "Identified repetitive workflows run automatically with logging; manual hours reduced in the scoped workflows.",
    complexity: "high",
    pricingTier: "scale_system",
    supportRequirements: "Workflow monitoring, failure alerts, periodic scope review.",
    possibleIntegrations: ["n8n", "Google Workspace", "Zoho", "HubSpot", "Custom APIs"],
    minVerifiedWeakCount: 1,
    strongRequiresPositive: [],
  },
  {
    slug: "custom_business_system",
    name: "Custom Business System",
    businessProblem:
      "The business has a defined operational problem that does not fit a templated workflow.",
    relevantWhenWeak: [],
    disqualifyingWhenStrong: {},
    notApplicableWhen: [],
    discoveryQuestions: [
      "If we could automate one process end-to-end in 30 days, which would move the business most?",
      "What have you already tried for this problem?",
    ],
    intervention:
      "Scoped discovery, then a custom-built system on ELION's reusable infrastructure with client-specific configuration.",
    operationalOutcome:
      "The scoped process is automated and measurable; handover documentation included.",
    complexity: "high",
    pricingTier: "custom",
    supportRequirements: "Per-project support agreement.",
    possibleIntegrations: ["As required by scope"],
    minVerifiedWeakCount: 0,
    strongRequiresPositive: [],
  },
];

export const SOLUTION_BY_SLUG: Record<SolutionSlug, SolutionDefinition> = Object.fromEntries(
  SOLUTION_CATALOG.map((s) => [s.slug, s])
) as Record<SolutionSlug, SolutionDefinition>;

// Industries where a category is irrelevant BY DEFAULT (applicability, not evidence).
export const INDUSTRY_CATEGORY_APPLICABILITY: Array<{
  industries: string[];
  category: EvidenceCategory;
  reason: string;
}> = [
  { industries: ["e-commerce", "ecommerce", "retail"], category: "booking", reason: "Checkout-led businesses rarely need appointment booking." },
  { industries: ["restaurant", "food"], category: "crm", reason: "Consumer repeat-purchase hospitality rarely needs formal CRM infrastructure." },
];
