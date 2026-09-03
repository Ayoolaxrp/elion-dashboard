// ELION Product Catalog
// ------------------------------------------------------------------
// Every deployable ELION product is defined here as a schema-driven
// template. The admin UI renders ONLY the configuration a selected
// product requires — nothing is hardcoded per-client.
//
// Pricing model (kept explicit):
//   - elion.setup_fee            one-time ELION implementation fee
//   - elion.monthly_fee          recurring ELION management fee
//   - infrastructure.*           third-party charges that are NOT ELION
//                                revenue (billed by the provider, either
//                                directly to the client or via ELION)
//
// IMPORTANT: no product is ever marked "live" unless every required
// criterion passes the validation gate (see validateProductConfig).

export type ProductCategory =
  | "communication"
  | "sales"
  | "booking"
  | "revenue"
  | "operations";

export type FieldType = "text" | "select" | "boolean" | "number" | "textarea" | "multiselect";

export interface ProductField {
  key: string;
  label: string;
  type: FieldType;
  required: boolean;
  description: string;
  placeholder?: string;
  options?: string[];
  defaultValue?: string | number | boolean;
  /** shown only when the field is part of a toggled sub-section */
  group?: string;
}

export interface ProductConfigGroup {
  id: string;
  title: string;
  description: string;
  fields: ProductField[];
}

export type BillingType = "client_pays_directly" | "elion_pays_and_rebills";

export interface InfrastructureRequirement {
  provider: string;
  /** what the provider is used for, e.g. "Voice AI calls" */
  purpose: string;
  required: boolean;
  billing_type: BillingType;
  /** indicative only — never treated as a hard price */
  est_recurring_cost_note?: string;
  usage_based: boolean;
  status: "not_configured" | "connected" | "testing";
}

export interface ProductInfrastructure {
  required: boolean;
  items: InfrastructureRequirement[];
  notes: string[];
}

export interface ProductPricing {
  setup_fee: number;
  monthly_fee: number;
  /** true when keeping the product running requires paid third-party infra */
  third_party_required: boolean;
}

export interface ProductDefinition {
  id: string;
  slug: string;
  /** slug of the matching row in the `workflow_templates` table */
  template_slug: string;
  name: string;
  short_name: string;
  kind: "automation" | "agent";
  category: ProductCategory;
  tagline: string;
  description: string;
  version: string;
  status: "active" | "coming_soon" | "draft";
  icon: string;
  pricing: ProductPricing;
  infrastructure: ProductInfrastructure;
  /** schema-driven configuration — the UI renders exactly this */
  config_groups: ProductConfigGroup[];
  /** human rule summary used by the client-facing "what will happen" view */
  plain_english: string[];
  clients_using: number;
}

// ------------------------------------------------------------------
// CATALOG
// ------------------------------------------------------------------

export const PRODUCT_CATALOG: ProductDefinition[] = [
  // ============ COMMUNICATION ============
  {
    id: "prod_wa_lead_response",
    slug: "whatsapp-lead-response",
    template_slug: "lead_response",
    name: "WhatsApp Lead Response",
    short_name: "Lead Response",
    kind: "automation",
    category: "communication",
    tagline: "Respond to every new enquiry instantly on WhatsApp.",
    description:
      "Captures inbound WhatsApp enquiries, qualifies the lead, sends an immediate response, and hands off to follow-up or a human when the rules say so.",
    version: "v1.0",
    status: "active",
    icon: "MessageCircle",
    pricing: { setup_fee: 50000, monthly_fee: 25000, third_party_required: true },
    infrastructure: {
      required: true,
      items: [
        { provider: "Meta (WhatsApp Business Platform)", purpose: "WhatsApp message delivery", required: true, billing_type: "client_pays_directly", usage_based: true, est_recurring_cost_note: "Meta conversation-based pricing; varies by region and volume", status: "not_configured" },
        { provider: "AI model provider (OpenAI/Anthropic/Google)", purpose: "Response generation", required: false, billing_type: "elion_pays_and_rebills", usage_based: true, est_recurring_cost_note: "Usage-based; typically small per conversation", status: "not_configured" },
      ],
      notes: ["WhatsApp/Meta and provider charges are billed separately from ELION fees.", "Meta conversation pricing applies per conversation (service + marketing categories differ)."],
    },
    config_groups: [
      {
        id: "business",
        title: "Business",
        description: "How the system represents the business when responding.",
        fields: [
          { key: "business_name", label: "Business name", type: "text", required: true, description: "Name shown in responses and used in qualification." },
          { key: "industry", label: "Industry", type: "text", required: true, description: "Sector the business operates in." },
          { key: "website", label: "Website", type: "text", required: false, description: "Business website." },
          { key: "business_description", label: "Business description", type: "textarea", required: false, description: "One or two sentences a lead would read to understand what you do." },
        ],
      },
      {
        id: "whatsapp",
        title: "WhatsApp",
        description: "The WhatsApp sender identity and provider credentials.",
        fields: [
          { key: "whatsapp_number", label: "WhatsApp Business number", type: "text", required: true, placeholder: "+234 800 000 0000", description: "The number leads message." },
          { key: "whatsapp_provider", label: "WhatsApp provider", type: "select", required: true, options: ["Meta Cloud API", "360dialog", "Twilio", "Other"], description: "Which provider delivers WhatsApp messages." },
          { key: "phone_number_id", label: "Phone Number ID", type: "text", required: true, description: "Provider identifier for this WhatsApp number." },
          { key: "waba_id", label: "WhatsApp Business Account ID", type: "text", required: true, description: "Provider account identifier." },
        ],
      },
      {
        id: "lead_sources",
        title: "Lead sources",
        description: "Where inbound enquiries come from.",
        fields: [
          { key: "lead_sources", label: "Channels that send leads here", type: "multiselect", required: true, options: ["Website", "Facebook", "Instagram", "Google Ads", "WhatsApp click-to-chat", "Manual entry"], description: "Every source this system should watch." },
        ],
      },
      {
        id: "response_rules",
        title: "Response rules",
        description: "How and when the system responds.",
        fields: [
          { key: "response_mode", label: "Response mode", type: "select", required: true, options: ["AI-assisted", "Fixed template", "AI-assisted with human approval"], description: "How responses are generated." },
          { key: "max_response_time", label: "Maximum response time", type: "select", required: true, options: ["Immediate", "Within 1 minute", "Within 5 minutes"], description: "Target time to first response." },
          { key: "business_hours", label: "Business hours", type: "text", required: true, placeholder: "Mon-Fri 8:00 AM - 6:00 PM WAT", description: "Hours a human is available." },
          { key: "outside_hours_behavior", label: "Outside business hours", type: "select", required: true, options: ["AI responds and collects details", "Send availability message", "Do not respond"], description: "What happens after hours." },
          { key: "first_response_template", label: "First response message", type: "textarea", required: true, description: "The message sent when a lead first writes. Use {{business_name}} for the business name." },
          { key: "escalation_number", label: "Human escalation WhatsApp number", type: "text", required: true, placeholder: "+234 800 000 0000", description: "Where the conversation goes when AI hands over to a human." },
        ],
      },
      {
        id: "qualification",
        title: "Lead qualification",
        description: "What the system asks a new lead to qualify them.",
        fields: [
          { key: "qualification_questions", label: "Information to collect", type: "multiselect", required: false, options: ["Name", "Phone", "Email", "What they are interested in", "Budget", "Location", "Preferred date"], description: "Details the AI should ask for." },
        ],
      },
      {
        id: "follow_up",
        title: "Follow-up",
        description: "What happens when a lead does not respond.",
        fields: [
          { key: "follow_up_1", label: "First follow-up after", type: "select", required: true, options: ["Immediate", "4 hours", "24 hours", "1 day", "3 days"], description: "Delay before the first nudge." },
          { key: "follow_up_2", label: "Second follow-up after", type: "select", required: false, options: ["1 day", "3 days", "7 days", "14 days"], description: "Delay before the second nudge." },
          { key: "follow_up_3", label: "Third follow-up after", type: "select", required: false, options: ["7 days", "14 days", "30 days"], description: "Delay before the final nudge." },
          { key: "max_follow_ups", label: "Maximum follow-ups", type: "number", required: true, description: "Stop after this many attempts." },
        ],
      },
    ],
    plain_english: [
      "When a new WhatsApp enquiry is received, ELION detects the lead and sends the configured response immediately.",
      "The AI asks qualifying questions and records the answers.",
      "If the lead does not respond, the configured follow-up sequence begins.",
      "If the lead asks for a human, is high value, or raises a complaint, the conversation escalates to the human WhatsApp number.",
    ],
    clients_using: 3,
  },

  {
    id: "prod_ai_receptionist",
    slug: "ai-receptionist",
    template_slug: "ai_receptionist",
    name: "AI Receptionist",
    short_name: "AI Receptionist",
    kind: "agent",
    category: "communication",
    tagline: "A polite, always-on receptionist for inbound enquiries.",
    description:
      "An AI agent that answers common questions, collects information, qualifies callers, books appointments and escalates to a human when it should — across WhatsApp, voice and chat.",
    version: "v1.0",
    status: "active",
    icon: "Headset",
    pricing: { setup_fee: 75000, monthly_fee: 35000, third_party_required: true },
    infrastructure: {
      required: true,
      items: [
        { provider: "Voice AI provider (e.g. Vapi)", purpose: "Voice calls on phone numbers", required: false, billing_type: "client_pays_directly", usage_based: true, est_recurring_cost_note: "Provider subscription + per-minute usage; varies by plan", status: "not_configured" },
        { provider: "WhatsApp / Meta", purpose: "WhatsApp conversations", required: false, billing_type: "client_pays_directly", usage_based: true, est_recurring_cost_note: "Meta conversation-based pricing", status: "not_configured" },
        { provider: "AI model provider", purpose: "Conversation intelligence", required: true, billing_type: "elion_pays_and_rebills", usage_based: true, est_recurring_cost_note: "Usage-based", status: "not_configured" },
        { provider: "Calendar (Google/Outlook)", purpose: "Availability + booking", required: false, billing_type: "client_pays_directly", usage_based: false, est_recurring_cost_note: "Provider subscription if applicable", status: "not_configured" },
      ],
      notes: [
        "Voice AI infrastructure (e.g. Vapi) is billed separately by the provider — it is not an ELION fee.",
        "If voice is enabled, the client needs an active provider account or ELION bills it back at cost.",
      ],
    },
    config_groups: [
      {
        id: "business_knowledge",
        title: "Business knowledge",
        description: "Everything the receptionist may be asked about.",
        fields: [
          { key: "business_name", label: "Business name", type: "text", required: true, description: "Name of the business." },
          { key: "description", label: "What the business does", type: "textarea", required: true, description: "Short description of products/services." },
          { key: "services", label: "Services / products", type: "textarea", required: false, description: "One per line." },
          { key: "pricing_info", label: "Pricing information", type: "textarea", required: false, description: "What the agent may share about price. Leave blank to forbid pricing answers." },
          { key: "faqs", label: "FAQs", type: "textarea", required: false, description: "Common questions and answers, one pair per line: Q? / A." },
          { key: "policies", label: "Policies", type: "textarea", required: false, description: "Refunds, cancellations, terms the agent should know." },
          { key: "location", label: "Location", type: "text", required: false, description: "Physical address." },
          { key: "opening_hours", label: "Opening hours", type: "text", required: false, placeholder: "Mon-Sat 9:00 AM - 7:00 PM", description: "Hours the business operates." },
          { key: "contact_info", label: "Public contact info", type: "text", required: false, description: "Phone/email the agent can share." },
        ],
      },
      {
        id: "personality",
        title: "Personality",
        description: "How the agent speaks.",
        fields: [
          { key: "personality", label: "Personality style", type: "select", required: true, options: ["Professional", "Friendly", "Concise", "Luxury", "Custom"], description: "Tone of every response." },
          { key: "custom_personality", label: "Custom personality notes", type: "textarea", required: false, description: "Only if Custom is selected." },
        ],
      },
      {
        id: "capabilities",
        title: "Capabilities",
        description: "What the agent is allowed to do.",
        fields: [
          { key: "capabilities", label: "Capabilities", type: "multiselect", required: true, options: ["Answer questions", "Collect customer information", "Qualify leads", "Book appointments", "Reschedule appointments", "Send information", "Handle FAQs", "Escalate to human"], description: "Tick everything the agent may do." },
          { key: "tools", label: "Connected tools", type: "multiselect", required: true, options: ["WhatsApp", "Voice (provider)", "Calendar", "CRM", "Email"], description: "Tools this deployment can use." },
        ],
      },
      {
        id: "guardrails",
        title: "Guardrails",
        description: "Hard limits on what the agent may say or promise.",
        fields: [
          { key: "guardrails", label: "Guardrails", type: "multiselect", required: true, options: ["Do not invent pricing", "Do not invent business information", "Do not make unauthorized promises", "Escalate complaints", "Escalate uncertain requests", "Escalate when customer requests a human"], description: "Non-negotiable behavior rules." },
        ],
      },
      {
        id: "escalation",
        title: "Human escalation",
        description: "Who the agent hands off to.",
        fields: [
          { key: "human_name", label: "Human contact name", type: "text", required: true, description: "The person escalations reach." },
          { key: "human_phone", label: "Human phone / WhatsApp", type: "text", required: true, placeholder: "+234 800 000 0000", description: "Where escalated conversations go." },
          { key: "human_email", label: "Human email", type: "text", required: false, description: "Notification address for escalations." },
          { key: "escalation_conditions", label: "Escalation triggers", type: "multiselect", required: false, options: ["Customer requests human", "Complaint", "High-value enquiry", "AI confidence below threshold", "After N unanswered attempts"], description: "When the agent must hand over." },
        ],
      },
    ],
    plain_english: [
      "A new customer message or call is answered immediately by the AI receptionist.",
      "It answers questions from the approved business knowledge and collects the required information.",
      "It can book or reschedule appointments against the connected calendar.",
      "Anything outside its guardrails is escalated to the human contact with full context.",
    ],
    clients_using: 0,
  },

  {
    id: "prod_email_assistant",
    slug: "email-assistant",
    template_slug: "email_assistant",
    name: "Email Assistant",
    short_name: "Email Assistant",
    kind: "automation",
    category: "communication",
    tagline: "Automated email handling for enquiries and sequences.",
    description:
      "Responds to email enquiries, files them by intent, and runs nurture sequences without staff typing every message.",
    version: "v1.0",
    status: "coming_soon",
    icon: "Mail",
    pricing: { setup_fee: 25000, monthly_fee: 15000, third_party_required: true },
    infrastructure: {
      required: true,
      items: [
        { provider: "Email provider (Resend/SendGrid/Postmark)", purpose: "Outbound email delivery", required: true, billing_type: "client_pays_directly", usage_based: true, est_recurring_cost_note: "Provider pricing by volume", status: "not_configured" },
      ],
      notes: ["Email provider and sending-volume charges are separate from ELION fees."],
    },
    config_groups: [
      {
        id: "mailbox",
        title: "Mailbox",
        description: "Which inbox the assistant watches.",
        fields: [
          { key: "inbox_address", label: "Inbox address", type: "text", required: true, description: "The shared inbox enquiries arrive at." },
          { key: "from_name", label: "From name", type: "text", required: true, description: "Display name on replies." },
        ],
      },
      {
        id: "handling",
        title: "Handling rules",
        description: "How enquiries are triaged.",
        fields: [
          { key: "auto_reply", label: "Auto-respond to enquiries", type: "boolean", required: true, description: "Send an acknowledgement immediately." },
          { key: "intent_routing", label: "Route by intent", type: "boolean", required: false, description: "Tag sales vs support vs other." },
          { key: "knowledge_base", label: "Knowledge source", type: "textarea", required: false, description: "Facts the assistant may answer from." },
        ],
      },
    ],
    plain_english: [
      "New emails are acknowledged instantly and tagged by intent.",
      "Common questions are answered from the approved knowledge source.",
      "Sales enquiries start the configured response flow.",
    ],
    clients_using: 0,
  },

  // ============ SALES ============
  {
    id: "prod_ai_sales_agent",
    slug: "ai-sales-agent",
    template_slug: "ai_sales_agent",
    name: "AI Sales Agent",
    short_name: "Sales Agent",
    kind: "agent",
    category: "sales",
    tagline: "Qualifies, nurtures and books from inbound conversations.",
    description:
      "An outbound-capable agent that qualifies leads, answers product questions, handles approved objections, books meetings and hands high-value opportunities to a human salesperson.",
    version: "v1.0",
    status: "active",
    icon: "TrendingUp",
    pricing: { setup_fee: 100000, monthly_fee: 45000, third_party_required: true },
    infrastructure: {
      required: true,
      items: [
        { provider: "WhatsApp / Meta", purpose: "Lead conversations", required: false, billing_type: "client_pays_directly", usage_based: true, est_recurring_cost_note: "Meta conversation-based pricing", status: "not_configured" },
        { provider: "AI model provider", purpose: "Conversation intelligence", required: true, billing_type: "elion_pays_and_rebills", usage_based: true, est_recurring_cost_note: "Usage-based", status: "not_configured" },
        { provider: "CRM", purpose: "Lead records + handoff", required: false, billing_type: "client_pays_directly", usage_based: false, est_recurring_cost_note: "CRM subscription applies", status: "not_configured" },
      ],
      notes: ["Provider, CRM and AI usage charges are separate from ELION fees."],
    },
    config_groups: [
      {
        id: "objective",
        title: "Objective & sales rules",
        description: "What the agent is selling and to whom.",
        fields: [
          { key: "offer_summary", label: "Offer summary", type: "textarea", required: true, description: "What the agent sells, in plain terms." },
          { key: "target_customer", label: "Target customer", type: "textarea", required: true, description: "Who is a good fit." },
          { key: "qualification_criteria", label: "Qualification criteria", type: "textarea", required: true, description: "Signals that make a lead qualified." },
          { key: "approved_claims", label: "Approved claims", type: "textarea", required: true, description: "What the agent may promise." },
          { key: "disallowed_claims", label: "Disallowed claims", type: "textarea", required: true, description: "What the agent must never promise." },
        ],
      },
      {
        id: "handling",
        title: "Handling rules",
        description: "Conversation behavior.",
        fields: [
          { key: "objection_handling", label: "Objection handling", type: "boolean", required: true, description: "Allow approved objection responses." },
          { key: "lead_quality_min", label: "Minimum lead quality", type: "select", required: true, options: ["Any enquiry", "Some intent shown", "Qualified only"], description: "Below this, escalate rather than sell." },
          { key: "booking_enabled", label: "Can book meetings", type: "boolean", required: true, description: "Allow the agent to propose call times." },
        ],
      },
      {
        id: "escalation",
        title: "Escalation",
        description: "Handoff to humans.",
        fields: [
          { key: "human_number", label: "Human sales WhatsApp", type: "text", required: true, description: "High-value leads go here." },
          { key: "escalation_triggers", label: "Escalation triggers", type: "multiselect", required: true, options: ["High-value lead detected", "Customer requests human", "Budget above threshold", "Complex enquiry", "Complaint"], description: "When to hand over." },
        ],
      },
    ],
    plain_english: [
      "New leads are qualified against the stated criteria.",
      "The agent recommends the right service and handles approved objections.",
      "High-value or complex leads are escalated to the human sales WhatsApp number.",
    ],
    clients_using: 0,
  },

  {
    id: "prod_follow_up",
    slug: "follow-up-system",
    template_slug: "follow_up",
    name: "Follow-Up System",
    short_name: "Follow-Up",
    kind: "automation",
    category: "sales",
    tagline: "No prospect disappears because nobody followed up.",
    description:
      "Sends a configured sequence of follow-up messages to unresponsive leads and stops the moment they respond.",
    version: "v1.0",
    status: "active",
    icon: "Repeat",
    pricing: { setup_fee: 35000, monthly_fee: 20000, third_party_required: true },
    infrastructure: {
      required: true,
      items: [
        { provider: "WhatsApp / Meta", purpose: "WhatsApp follow-up delivery", required: false, billing_type: "client_pays_directly", usage_based: true, est_recurring_cost_note: "Meta conversation-based pricing", status: "not_configured" },
        { provider: "Email provider", purpose: "Email follow-up delivery", required: false, billing_type: "client_pays_directly", usage_based: true, est_recurring_cost_note: "Provider pricing by volume", status: "not_configured" },
      ],
      notes: ["Channel provider charges apply per message volume."],
    },
    config_groups: [
      {
        id: "sequence",
        title: "Follow-up sequence",
        description: "Timing and content of each nudge.",
        fields: [
          { key: "channel", label: "Channel", type: "select", required: true, options: ["WhatsApp", "Email", "WhatsApp + Email"], description: "Where follow-ups are sent." },
          { key: "step_1_delay", label: "First follow-up after", type: "select", required: true, options: ["4 hours", "24 hours", "1 day", "3 days"], description: "First nudge delay." },
          { key: "step_2_delay", label: "Second follow-up after", type: "select", required: false, options: ["3 days", "7 days", "14 days"], description: "Second nudge delay." },
          { key: "step_3_delay", label: "Third follow-up after", type: "select", required: false, options: ["7 days", "14 days", "30 days"], description: "Final nudge delay." },
          { key: "max_follow_ups", label: "Maximum attempts", type: "number", required: true, description: "Stop after this many attempts." },
          { key: "stop_on_response", label: "Stop on response", type: "boolean", required: true, description: "Any reply ends the sequence." },
          { key: "message_1", label: "First message", type: "textarea", required: true, description: "First nudge copy." },
        ],
      },
    ],
    plain_english: [
      "When a lead stops responding, the configured follow-up sequence begins.",
      "Each step waits the set delay, then sends the next message.",
      "The sequence stops immediately if the lead replies.",
    ],
    clients_using: 2,
  },

  {
    id: "prod_booking",
    slug: "booking-automation",
    template_slug: "booking",
    name: "Booking Automation",
    short_name: "Booking",
    kind: "automation",
    category: "booking",
    tagline: "Turn conversations into confirmed appointments.",
    description:
      "Offers real availability, confirms bookings, sends reminders and handles reschedules without back-and-forth messages.",
    version: "v1.0",
    status: "active",
    icon: "CalendarDays",
    pricing: { setup_fee: 50000, monthly_fee: 25000, third_party_required: false },
    infrastructure: {
      required: true,
      items: [
        { provider: "Calendar (Google/Outlook)", purpose: "Availability + booking", required: true, billing_type: "client_pays_directly", usage_based: false, est_recurring_cost_note: "Provider subscription if applicable", status: "not_configured" },
      ],
      notes: ["Google Calendar is free; premium calendar/CRM tiers are the client's own cost."],
    },
    config_groups: [
      {
        id: "calendar",
        title: "Calendar & availability",
        description: "Which calendar and when clients can book.",
        fields: [
          { key: "calendar_provider", label: "Calendar provider", type: "select", required: true, options: ["Google Calendar", "Outlook"], description: "Source of truth for availability." },
          { key: "duration", label: "Appointment duration", type: "select", required: true, options: ["15 minutes", "30 minutes", "45 minutes", "60 minutes"], description: "Default length." },
          { key: "buffer", label: "Buffer between appointments", type: "select", required: false, options: ["None", "15 minutes", "30 minutes"], description: "Gap before the next booking." },
          { key: "timezone", label: "Timezone", type: "text", required: true, defaultValue: "Africa/Lagos", description: "Business timezone." },
          { key: "working_hours", label: "Working hours", type: "text", required: true, placeholder: "Mon-Fri 9:00 AM - 5:00 PM", description: "When bookings are allowed." },
          { key: "reminders", label: "Reminder timing", type: "multiselect", required: false, options: ["24 hours before", "2 hours before", "No reminders"], description: "Reminders sent automatically." },
        ],
      },
    ],
    plain_english: [
      "A lead asks to book and receives real available slots from the connected calendar.",
      "The chosen slot is confirmed and written to the calendar.",
      "Reminders go out automatically at the configured times.",
    ],
    clients_using: 2,
  },

  {
    id: "prod_revenue_recovery",
    slug: "revenue-recovery",
    template_slug: "revenue_recovery",
    name: "Revenue Recovery",
    short_name: "Recovery",
    kind: "automation",
    category: "revenue",
    tagline: "Re-engage opportunities that went quiet.",
    description:
      "Finds dormant leads and customers and runs re-engagement campaigns to bring them back.",
    version: "v1.0",
    status: "active",
    icon: "RotateCcw",
    pricing: { setup_fee: 45000, monthly_fee: 25000, third_party_required: false },
    infrastructure: { required: false, items: [], notes: [] },
    config_groups: [
      {
        id: "recovery",
        title: "Recovery rules",
        description: "Who counts as dormant and how they are approached.",
        fields: [
          { key: "dormancy_period", label: "Dormancy period", type: "select", required: true, options: ["7 days", "14 days", "30 days", "60 days"], description: "No contact for this long = dormant." },
          { key: "channel", label: "Channel", type: "select", required: true, options: ["WhatsApp", "Email"], description: "Recovery channel." },
          { key: "max_attempts", label: "Maximum attempts", type: "number", required: true, description: "How many recovery messages." },
          { key: "recovery_message", label: "Recovery message", type: "textarea", required: true, description: "The re-engagement message." },
        ],
      },
    ],
    plain_english: [
      "Leads and customers silent for the dormancy period are flagged.",
      "A configured re-engagement message is sent up to the maximum attempts.",
      "Any response re-opens the opportunity and notifies the team.",
    ],
    clients_using: 0,
  },

  {
    id: "prod_operations",
    slug: "operations-automation",
    template_slug: "operations",
    name: "Operations Automation",
    short_name: "Operations",
    kind: "automation",
    category: "operations",
    tagline: "Repetitive internal work, handled automatically.",
    description:
      "Routes leads, creates tasks, sends internal alerts and synchronises data between the tools the team already uses.",
    version: "v1.0",
    status: "active",
    icon: "Settings2",
    pricing: { setup_fee: 60000, monthly_fee: 30000, third_party_required: false },
    infrastructure: { required: false, items: [], notes: [] },
    config_groups: [
      {
        id: "internal",
        title: "Internal workflows",
        description: "What runs inside the business.",
        fields: [
          { key: "notification_channel", label: "Notification channel", type: "select", required: true, options: ["Slack", "Email", "WhatsApp group"], description: "Where internal alerts go." },
          { key: "lead_routing", label: "Auto route leads", type: "boolean", required: true, description: "Assign leads to the right person automatically." },
          { key: "task_creation", label: "Auto-create tasks", type: "boolean", required: false, description: "Turn triggers into team tasks." },
          { key: "routing_rules", label: "Routing rules (plain text)", type: "textarea", required: false, description: "e.g. VIP leads go to the founder; service leads to support." },
        ],
      },
    ],
    plain_english: [
      "Triggers from other systems fire internal notifications and task creation.",
      "Leads are routed to the configured owner.",
      "Data synchronises between connected internal tools.",
    ],
    clients_using: 1,
  },
];

// ------------------------------------------------------------------
// HELPERS

export function getProduct(id: string): ProductDefinition | undefined {
  return PRODUCT_CATALOG.find((p) => p.id === id);
}

export function getProductsByCategory(category: ProductCategory): ProductDefinition[] {
  return PRODUCT_CATALOG.filter((p) => p.category === category);
}

export const PRODUCT_CATEGORY_LABELS: Record<ProductCategory, string> = {
  communication: "Communication",
  sales: "Sales",
  booking: "Bookings",
  revenue: "Revenue",
  operations: "Operations",
};

export const PRODUCT_CATEGORY_ORDER: ProductCategory[] = ["communication", "sales", "booking", "revenue", "operations"];

export interface ProductConfigValue {
  [key: string]: string | number | boolean | string[] | undefined;
}

/** Flatten a product's config groups into one config object. */
export function collectProductFields(p: ProductDefinition): ProductField[] {
  return p.config_groups.flatMap((g) => g.fields);
}

/** A required field is missing when empty (multiselect = no selections). */
export function isFieldFilled(field: ProductField, value: ProductConfigValue[string]): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "boolean") return true; // booleans have an explicit value
  return true;
}

export interface ConfigCheck {
  field: ProductField;
  group: string;
  ok: boolean;
}

/** Validate a product's stored config against its schema. */
export function validateProductConfig(p: ProductDefinition, config: ProductConfigValue): { valid: boolean; missing: ConfigCheck[] } {
  const missing: ConfigCheck[] = [];
  for (const group of p.config_groups) {
    for (const field of group.fields) {
      if (!field.required) continue;
      if (!isFieldFilled(field, config[field.key])) {
        missing.push({ field, group: group.title, ok: false });
      }
    }
  }
  return { valid: missing.length === 0, missing };
}

export type ProviderStatus = "not_configured" | "connected" | "testing";

export interface InfrastructureCheck {
  provider: string;
  purpose: string;
  required: boolean;
  billing_type: BillingType;
  status: ProviderStatus;
  ok: boolean;
}

/**
 * Deployment-readiness check: a product may only be activated when its
 * configuration is valid AND every REQUIRED infrastructure item is
 * connected. Optional infrastructure that is not configured is reported
 * but does not block activation.
 */
export function checkInfrastructure(
  product: ProductDefinition,
  providerStatus: Record<string, ProviderStatus>
): { ready: boolean; checks: InfrastructureCheck[]; blockers: string[] } {
  const checks: InfrastructureCheck[] = product.infrastructure.items.map((item) => {
    const status = providerStatus[item.provider] || item.status || "not_configured";
    const ok = !item.required || status === "connected";
    return { provider: item.provider, purpose: item.purpose, required: item.required, billing_type: item.billing_type, status, ok };
  });
  const blockers = checks.filter((c) => c.required && !c.ok).map((c) => `${c.provider} is required${c.purpose ? ` for ${c.purpose}` : ""}.`);
  return { ready: blockers.length === 0, checks, blockers };
}

export interface ProductDeploymentCheck {
  product: ProductDefinition;
  configValid: boolean;
  missingFields: ConfigCheck[];
  infra: { ready: boolean; checks: InfrastructureCheck[]; blockers: string[] };
}

/**
 * Full readiness for one product. Never returns "live" unless everything
 * passes: config valid + required infrastructure connected.
 */
export function checkDeploymentReadiness(
  product: ProductDefinition,
  config: ProductConfigValue,
  providerStatus: Record<string, ProviderStatus>
): ProductDeploymentCheck {
  const configResult = validateProductConfig(product, config);
  const infra = checkInfrastructure(product, providerStatus);
  return {
    product,
    configValid: configResult.valid,
    missingFields: configResult.missing,
    infra,
  };
}

export function isDeploymentReady(check: ProductDeploymentCheck): boolean {
  return check.configValid && check.infra.ready;
}

// ------------------------------------------------------------------
// CLIENT-SIDE DEPLOYMENT RECORDS (mock persistence)
// Stored per-client under localStorage so the guided flow round-trips
// without pretending to be a real backend. Nothing here is "live" until
// a real provisioning engine confirms it.

export interface ClientDeployment {
  clientId: string;
  clientName: string;
  companyName: string;
  products: Record<string, { selected: boolean; config: ProductConfigValue; providerStatus: Record<string, ProviderStatus>; status: "pending_config" | "ready" | "provisioning" | "testing" | "live" | "failed"; last_action?: string; automation_id?: string | null }>;
  created_at: string;
}

const STORAGE_KEY = "elion_client_deployments";

export function loadDeployments(): Record<string, ClientDeployment> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}") as Record<string, ClientDeployment>;
  } catch {
    return {};
  }
}

export function saveDeployment(dep: ClientDeployment): void {
  if (typeof window === "undefined") return;
  const all = loadDeployments();
  all[dep.clientId] = dep;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function removeDeployment(clientId: string): void {
  if (typeof window === "undefined") return;
  const all = loadDeployments();
  delete all[clientId];
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function fmtNgn(n: number): string {
  return "₦" + n.toLocaleString("en-NG");
}
