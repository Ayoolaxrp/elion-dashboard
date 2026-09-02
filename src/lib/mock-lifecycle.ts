import type {
  Lead, Audit, AuditFinding, Opportunity, Proposal, ProposalItem,
  Contract, Payment, Order, OrderItem, Entitlement, Client, Organization,
  OnboardingTask, ClientAutomation, ClientIntegration, Activity,
} from "./types";

// ============================================================
// CLIENT A: ABC Properties - FULL JOURNEY (prospect -> live)
// ============================================================

export const leadA: Lead = {
  id: "lead_001",
  contact_name: "Adebayo Okonkwo",
  email: "adebayo@abcproperties.ng",
  phone: "+2348031234567",
  company_name: "ABC Properties",
  website: "https://abcproperties.ng",
  industry: "Real Estate",
  primary_problem: "Leads not getting fast enough follow-up",
  lead_status: "qualified",
  source: "funnel",
  created_at: "2026-08-15T10:30:00Z",
};

export const auditA: Audit = {
  id: "audit_001",
  lead_id: "lead_001",
  automation_score: 38,
  status: "completed",
  critical_findings: 2,
  high_findings: 1,
  findings: [
    {
      id: "find_001",
      lead_id: "lead_001",
      finding_type: "critical",
      title: "Lead Response Gap",
      description: "Website visitors are directed to WhatsApp, but there is no automated qualification step before the conversation begins.",
      evidence: "Contact form submits to generic inbox. WhatsApp link has no pre-filled message. No auto-reply configured.",
      business_impact: "Prospects wait hours for a response. By the time someone replies, the lead has often moved to a competitor.",
      recommended_automation: "Lead Response System",
      priority: 1,
    },
    {
      id: "find_002",
      lead_id: "lead_001",
      finding_type: "critical",
      title: "No Follow-Up System",
      description: "There is no evidence of automated follow-up sequences for leads who do not convert on first contact.",
      evidence: "No CRM integration detected. No email sequences. No retargeting pixels found.",
      business_impact: "Interested prospects who do not convert immediately are lost permanently. No re-engagement mechanism exists.",
      recommended_automation: "Follow-Up Sequence",
      priority: 2,
    },
    {
      id: "find_003",
      lead_id: "lead_001",
      finding_type: "high",
      title: "Manual Booking Process",
      description: "Property viewings require back-and-forth scheduling instead of automated booking.",
      evidence: "No calendar integration. No self-booking link. Scheduling happens via phone calls.",
      business_impact: "Scheduling friction reduces viewing bookings. Some prospects never book because the process is too slow.",
      recommended_automation: "Booking Automation",
      priority: 3,
    },
  ],
  created_at: "2026-08-16T09:00:00Z",
  completed_at: "2026-08-16T14:30:00Z",
};

export const opportunityA: Opportunity = {
  id: "opp_001",
  lead_id: "lead_001",
  audit_id: "audit_001",
  title: "ABC Properties - Lead Response + Follow-Up + Booking",
  description: "Complete automation suite for lead capture, qualification, follow-up, and booking.",
  recommended_system: "Lead Response, Follow-Up, Booking",
  estimated_scope: "3 automations, 2 integrations (WhatsApp, Calendar)",
  priority: "critical",
  status: "won",
  created_at: "2026-08-17T10:00:00Z",
};

export const proposalAItems: ProposalItem[] = [
  { id: "pi_001", proposal_id: "prop_001", automation_name: "Lead Response System", description: "Automated lead capture, qualification, and response via WhatsApp and email.", status: "included", setup_price: 150000, monthly_price: null },
  { id: "pi_002", proposal_id: "prop_001", automation_name: "Follow-Up Sequence", description: "Multi-step follow-up sequences for unresponsive leads.", status: "included", setup_price: 100000, monthly_price: null },
  { id: "pi_003", proposal_id: "prop_001", automation_name: "Booking Automation", description: "Automated scheduling with calendar integration.", status: "included", setup_price: 100000, monthly_price: null },
  { id: "pi_004", proposal_id: "prop_001", automation_name: "Revenue Recovery", description: "Re-engagement campaigns for dormant leads.", status: "not_included", setup_price: null, monthly_price: null },
  { id: "pi_005", proposal_id: "prop_001", automation_name: "Operations Automation", description: "Internal task automation and notifications.", status: "not_included", setup_price: null, monthly_price: null },
];

export const proposalA: Proposal = {
  id: "prop_001",
  client_name: "Adebayo Okonkwo",
  client_email: "adebayo@abcproperties.ng",
  company_name: "ABC Properties",
  title: "Automation Proposal - ABC Properties",
  items: proposalAItems,
  total_setup: 350000,
  total_monthly: 0,
  implementation_timeline: "2-3 weeks",
  support_plan: "30 days post-launch support included",
  status: "accepted",
  valid_until: "2026-09-15T00:00:00Z",
  created_at: "2026-08-18T11:00:00Z",
  sent_at: "2026-08-18T11:05:00Z",
  accepted_at: "2026-08-20T14:22:00Z",
};

export const contractA: Contract = {
  id: "cont_001",
  proposal_id: "prop_001",
  client_name: "Adebayo Okonkwo",
  company_name: "ABC Properties",
  scope_summary: "Lead Response System, Follow-Up Sequence, Booking Automation. One-time setup. 30 days post-launch support.",
  total_amount: 350000,
  status: "signed",
  sent_at: "2026-08-21T09:00:00Z",
  signed_at: "2026-08-22T16:45:00Z",
  expires_at: "2026-09-21T00:00:00Z",
  signatory: "Adebayo Okonkwo",
  created_at: "2026-08-21T09:00:00Z",
};

export const paymentA: Payment = {
  id: "pay_001",
  contract_id: "cont_001",
  client_name: "Adebayo Okonkwo",
  company_name: "ABC Properties",
  amount: 350000,
  status: "paid",
  payment_method: "Bank Transfer",
  payment_reference: "PAY-2026-001-ABC",
  paid_at: "2026-08-23T10:30:00Z",
  created_at: "2026-08-23T10:30:00Z",
};

export const orderAItems: OrderItem[] = [
  { id: "oi_001", order_id: "ord_001", automation_name: "Lead Response System", automation_key: "lead_response", setup_price: 150000 },
  { id: "oi_002", order_id: "ord_001", automation_name: "Follow-Up Sequence", automation_key: "follow_up", setup_price: 100000 },
  { id: "oi_003", order_id: "ord_001", automation_name: "Booking Automation", automation_key: "booking", setup_price: 100000 },
];

export const orderA: Order = {
  id: "ord_001",
  payment_id: "pay_001",
  client_name: "Adebayo Okonkwo",
  company_name: "ABC Properties",
  items: orderAItems,
  total_amount: 350000,
  status: "confirmed",
  created_at: "2026-08-23T10:35:00Z",
};

export const entitlementsA: Entitlement[] = [
  { id: "ent_001", order_id: "ord_001", client_id: "client_001", automation_name: "Lead Response System", automation_key: "lead_response", status: "active", purchased_at: "2026-08-23T10:35:00Z", implementation_status: "live" },
  { id: "ent_002", order_id: "ord_001", client_id: "client_001", automation_name: "Follow-Up Sequence", automation_key: "follow_up", status: "active", purchased_at: "2026-08-23T10:35:00Z", implementation_status: "live" },
  { id: "ent_003", order_id: "ord_001", client_id: "client_001", automation_name: "Booking Automation", automation_key: "booking", status: "active", purchased_at: "2026-08-23T10:35:00Z", implementation_status: "live" },
];

export const orgA: Organization = {
  id: "org_001",
  name: "ABC Properties",
  industry: "Real Estate",
  website: "https://abcproperties.ng",
  created_at: "2026-08-23T10:40:00Z",
};

export const clientA: Client = {
  id: "client_001",
  organization_id: "org_001",
  organization: orgA,
  contact_name: "Adebayo Okonkwo",
  email: "adebayo@abcproperties.ng",
  phone: "+2348031234567",
  lifecycle_status: "live",
  onboarding_stage: "handover",
  contract_id: "cont_001",
  payment_id: "pay_001",
  created_at: "2026-08-23T10:40:00Z",
};

export const onboardingTasksA: OnboardingTask[] = [
  { id: "ot_001", client_id: "client_001", stage: "welcome", title: "Welcome to ELION", description: "Review your automation plan and what happens next.", status: "completed", required: true },
  { id: "ot_002", client_id: "client_001", stage: "kickoff", title: "Kickoff Call", description: "Confirm scope, workflow, and requirements.", status: "completed", required: true },
  { id: "ot_003", client_id: "client_001", stage: "business_info", title: "Business Information", description: "Provide business hours, contact details, and team information.", status: "completed", required: true },
  { id: "ot_004", client_id: "client_001", stage: "configuration", title: "Connect WhatsApp", description: "Connect your WhatsApp Business account for automated responses.", status: "completed", required: true },
  { id: "ot_005", client_id: "client_001", stage: "configuration", title: "Set Response Rules", description: "Configure how ELION responds to new leads.", status: "completed", required: true },
  { id: "ot_006", client_id: "client_001", stage: "configuration", title: "Set Follow-Up Timing", description: "Configure follow-up schedule and stop conditions.", status: "completed", required: true },
  { id: "ot_007", client_id: "client_001", stage: "approval", title: "Review Automation", description: "Review the plain-English summary of your automation.", status: "completed", required: true },
  { id: "ot_008", client_id: "client_001", stage: "build", title: "Build", description: "ELION builds and connects your automation systems.", status: "completed", required: true },
  { id: "ot_009", client_id: "client_001", stage: "testing", title: "Testing", description: "Verify all automations work correctly.", status: "completed", required: true },
  { id: "ot_010", client_id: "client_001", stage: "launch", title: "Go Live", description: "Your automation systems are now active.", status: "completed", required: true },
  { id: "ot_011", client_id: "client_001", stage: "handover", title: "Handover", description: "Documentation, access details, and support information.", status: "in_progress", required: true },
];

export const clientAutomationsA: ClientAutomation[] = [
  { id: "ca_001", client_id: "client_001", automation_name: "Lead Response System", automation_key: "lead_response", template_version: "v2.1", status: "live", configuration: { business_hours: "9am-6pm WAT", response_channel: "whatsapp", greeting: "Thank you for contacting ABC Properties" }, activated_at: "2026-09-01T10:00:00Z" },
  { id: "ca_002", client_id: "client_001", automation_name: "Follow-Up Sequence", automation_key: "follow_up", template_version: "v1.3", status: "live", configuration: { follow_up_1: "4 hours", follow_up_2: "24 hours", follow_up_3: "72 hours", stop_on_response: true }, activated_at: "2026-09-01T10:00:00Z" },
  { id: "ca_003", client_id: "client_001", automation_name: "Booking Automation", automation_key: "booking", template_version: "v1.1", status: "live", configuration: { calendar: "google", duration: "30 minutes", buffer: "15 minutes", timezone: "Africa/Lagos" }, activated_at: "2026-09-01T10:00:00Z" },
];

export const clientIntegrationsA: ClientIntegration[] = [
  { id: "ci_001", client_id: "client_001", integration_type: "WhatsApp Business", status: "connected", last_verified: "2026-09-02T08:00:00Z" },
  { id: "ci_002", client_id: "client_001", integration_type: "Google Calendar", status: "connected", last_verified: "2026-09-02T08:00:00Z" },
  { id: "ci_003", client_id: "client_001", integration_type: "Email (SMTP)", status: "connected", last_verified: "2026-09-02T08:00:00Z" },
];

export const activitiesA: Activity[] = [
  { id: "act_001", client_id: "client_001", actor: "System", action: "Lead captured", details: "New enquiry from funnel submission", created_at: "2026-08-15T10:30:00Z" },
  { id: "act_002", client_id: "client_001", actor: "ELION", action: "Audit completed", details: "Automation score: 38/100. 3 findings identified.", created_at: "2026-08-16T14:30:00Z" },
  { id: "act_003", client_id: "client_001", actor: "Ayoola", action: "Proposal sent", details: "3 automations, total setup: N350,000", created_at: "2026-08-18T11:05:00Z" },
  { id: "act_004", client_id: "client_001", actor: "Adebayo", action: "Proposal accepted", details: "Client accepted the proposal", created_at: "2026-08-20T14:22:00Z" },
  { id: "act_005", client_id: "client_001", actor: "System", action: "Contract generated", details: "Contract sent for signature", created_at: "2026-08-21T09:00:00Z" },
  { id: "act_006", client_id: "client_001", actor: "Adebayo", action: "Contract signed", details: "Signed by Adebayo Okonkwo", created_at: "2026-08-22T16:45:00Z" },
  { id: "act_007", client_id: "client_001", actor: "System", action: "Payment received", details: "N350,000 via Bank Transfer", created_at: "2026-08-23T10:30:00Z" },
  { id: "act_008", client_id: "client_001", actor: "System", action: "Client created", details: "ABC Properties onboarded", created_at: "2026-08-23T10:40:00Z" },
  { id: "act_009", client_id: "client_001", actor: "ELION", action: "Kickoff completed", details: "Scope confirmed, requirements gathered", created_at: "2026-08-25T11:00:00Z" },
  { id: "act_010", client_id: "client_001", actor: "ELION", action: "Configuration approved", details: "All automations configured and approved", created_at: "2026-08-28T15:00:00Z" },
  { id: "act_011", client_id: "client_001", actor: "ELION", action: "Build completed", details: "3 automations built and connected", created_at: "2026-08-30T14:00:00Z" },
  { id: "act_012", client_id: "client_001", actor: "ELION", action: "Testing passed", details: "All automations verified", created_at: "2026-08-31T16:00:00Z" },
  { id: "act_013", client_id: "client_001", actor: "ELION", action: "Go live", details: "All 3 automations are now active", created_at: "2026-09-01T10:00:00Z" },
];

// ============================================================
// CLIENT B: Fresh Ventures - ONBOARDING (new client)
// ============================================================

export const leadB: Lead = {
  id: "lead_002",
  contact_name: "Ngozi Adeyemi",
  email: "ngozi@freshventures.ng",
  phone: "+2348059876543",
  company_name: "Fresh Ventures",
  website: "https://freshventures.ng",
  industry: "E-commerce",
  primary_problem: "Customer info scattered across tools",
  lead_status: "opportunity",
  source: "funnel",
  created_at: "2026-09-01T14:00:00Z",
};

export const clientB: Client = {
  id: "client_002",
  organization_id: "org_002",
  organization: { id: "org_002", name: "Fresh Ventures", industry: "E-commerce", website: "https://freshventures.ng", created_at: "2026-09-02T10:00:00Z" },
  contact_name: "Ngozi Adeyemi",
  email: "ngozi@freshventures.ng",
  phone: "+2348059876543",
  lifecycle_status: "onboarding",
  onboarding_stage: "configuration",
  contract_id: "cont_002",
  payment_id: "pay_002",
  created_at: "2026-09-02T10:00:00Z",
};

export const entitlementsB: Entitlement[] = [
  { id: "ent_004", order_id: "ord_002", client_id: "client_002", automation_name: "Lead Response System", automation_key: "lead_response", status: "active", purchased_at: "2026-09-02T10:05:00Z", implementation_status: "pending_config" },
  { id: "ent_005", order_id: "ord_002", client_id: "client_002", automation_name: "Follow-Up Sequence", automation_key: "follow_up", status: "active", purchased_at: "2026-09-02T10:05:00Z", implementation_status: "pending_config" },
];

export const onboardingTasksB: OnboardingTask[] = [
  { id: "ot_012", client_id: "client_002", stage: "welcome", title: "Welcome to ELION", description: "Review your automation plan.", status: "completed", required: true },
  { id: "ot_013", client_id: "client_002", stage: "kickoff", title: "Kickoff Call", description: "Confirm scope and requirements.", status: "completed", required: true },
  { id: "ot_014", client_id: "client_002", stage: "business_info", title: "Business Information", description: "Provide business details.", status: "completed", required: true },
  { id: "ot_015", client_id: "client_002", stage: "configuration", title: "Connect WhatsApp", description: "Connect your WhatsApp Business account.", status: "in_progress", required: true },
  { id: "ot_016", client_id: "client_002", stage: "configuration", title: "Set Response Rules", description: "Configure lead response behaviour.", status: "pending", required: true },
  { id: "ot_017", client_id: "client_002", stage: "configuration", title: "Set Follow-Up Timing", description: "Configure follow-up schedule.", status: "pending", required: true },
  { id: "ot_018", client_id: "client_002", stage: "approval", title: "Review Automation", description: "Approve the automation summary.", status: "pending", required: true },
  { id: "ot_019", client_id: "client_002", stage: "build", title: "Build", description: "ELION builds your automations.", status: "pending", required: true },
  { id: "ot_020", client_id: "client_002", stage: "testing", title: "Testing", description: "Verify everything works.", status: "pending", required: true },
  { id: "ot_021", client_id: "client_002", stage: "launch", title: "Go Live", description: "Automations go live.", status: "pending", required: true },
  { id: "ot_022", client_id: "client_002", stage: "handover", title: "Handover", description: "Documentation and support.", status: "pending", required: true },
];

// ============================================================
// CLIENT C: Chidi & Sons - CONTRACT PENDING
// ============================================================

export const clientC: Client = {
  id: "client_003",
  organization_id: "org_003",
  organization: { id: "org_003", name: "Chidi & Sons", industry: "Healthcare", website: null, created_at: "2026-09-01T08:00:00Z" },
  contact_name: "Chidi Nwosu",
  email: "chidi@chidisons.ng",
  phone: "+2348011112222",
  lifecycle_status: "contract_pending",
  onboarding_stage: null,
  contract_id: "cont_003",
  payment_id: null,
  created_at: "2026-09-01T08:00:00Z",
};

// ============================================================
// CLIENT D: Dewdrops Hotel - PROSPECT
// ============================================================

export const clientD: Client = {
  id: "client_004",
  organization_id: "org_004",
  organization: { id: "org_004", name: "Dewdrops Hotel", industry: "Hospitality", website: "https://dewdropshotel.ng", created_at: "2026-08-28T12:00:00Z" },
  contact_name: "Fatima Bello",
  email: "fatima@dewdropshotel.ng",
  phone: "+2348098765432",
  lifecycle_status: "prospect",
  onboarding_stage: null,
  contract_id: null,
  payment_id: null,
  created_at: "2026-08-28T12:00:00Z",
};

// ============================================================
// ALL DATA COLLECTIONS
// ============================================================

export const allLeads: Lead[] = [leadA, leadB];
export const allClients: Client[] = [clientA, clientB, clientC, clientD];
export const allProposals: Proposal[] = [proposalA];
export const allContracts: Contract[] = [contractA];
export const allPayments: Payment[] = [paymentA];
export const allEntitlements: Entitlement[] = [...entitlementsA, ...entitlementsB];
export const allActivities: Activity[] = activitiesA;

// Get client by ID
export function getClient(id: string): Client | undefined {
  return allClients.find(c => c.id === id);
}

// Get entitlements for client
export function getClientEntitlements(clientId: string): Entitlement[] {
  return allEntitlements.filter(e => e.client_id === clientId);
}

// Get activities for client
export function getClientActivities(clientId: string): Activity[] {
  return allActivities.filter(a => a.client_id === clientId);
}

// Get onboarding tasks for client
export function getClientOnboardingTasks(clientId: string): OnboardingTask[] {
  if (clientId === "client_001") return onboardingTasksA;
  if (clientId === "client_002") return onboardingTasksB;
  return [];
}

// Get client automations
export function getClientAutomations(clientId: string): ClientAutomation[] {
  if (clientId === "client_001") return clientAutomationsA;
  return [];
}

// Get client integrations
export function getClientIntegrations(clientId: string): ClientIntegration[] {
  if (clientId === "client_001") return clientIntegrationsA;
  return [];
}
