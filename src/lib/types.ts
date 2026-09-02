// ELION Commercial Lifecycle Types

export type LeadStatus = "new" | "audited" | "contacted" | "qualified" | "opportunity" | "lost";
export type OpportunityStatus = "new" | "qualified" | "proposal" | "negotiation" | "won" | "lost";
export type ProposalStatus = "draft" | "sent" | "viewed" | "accepted" | "rejected" | "expired";
export type ContractStatus = "draft" | "sent" | "viewed" | "signed" | "declined" | "expired";
export type PaymentStatus = "pending" | "paid" | "failed" | "partially_paid" | "refunded";
export type ClientLifecycleStatus = "prospect" | "contract_pending" | "payment_pending" | "onboarding" | "implementation" | "testing" | "live" | "paused" | "completed" | "cancelled";
export type OnboardingStage = "welcome" | "kickoff" | "business_info" | "configuration" | "approval" | "build" | "testing" | "launch" | "handover";
export type AutomationStatus = "not_purchased" | "purchased" | "pending_config" | "provisioning" | "testing" | "failed" | "ready" | "live" | "paused";
export type IntegrationStatus = "not_connected" | "pending" | "connected" | "needs_attention" | "failed";
export type ProposalItemStatus = "included" | "not_included";

export interface Lead {
  id: string;
  contact_name: string;
  email: string;
  phone: string | null;
  company_name: string | null;
  website: string | null;
  industry: string | null;
  primary_problem: string | null;
  lead_status: LeadStatus;
  source: string | null;
  created_at: string;
}

export interface AuditFinding {
  id: string;
  lead_id: string;
  finding_type: "critical" | "high" | "medium" | "low";
  title: string;
  description: string;
  evidence: string;
  business_impact: string;
  recommended_automation: string;
  priority: number;
}

export interface Audit {
  id: string;
  lead_id: string;
  automation_score: number;
  status: "pending" | "in_progress" | "completed";
  critical_findings: number;
  high_findings: number;
  findings: AuditFinding[];
  created_at: string;
  completed_at: string | null;
}

export interface Opportunity {
  id: string;
  lead_id: string;
  audit_id: string;
  title: string;
  description: string;
  recommended_system: string;
  estimated_scope: string;
  priority: "critical" | "high" | "medium";
  status: OpportunityStatus;
  created_at: string;
}

export interface ProposalItem {
  id: string;
  proposal_id: string;
  automation_name: string;
  description: string;
  status: ProposalItemStatus;
  monthly_price: number | null;
  setup_price: number | null;
}

export interface Proposal {
  id: string;
  client_name: string;
  client_email: string;
  company_name: string;
  title: string;
  items: ProposalItem[];
  total_setup: number;
  total_monthly: number;
  implementation_timeline: string;
  support_plan: string;
  status: ProposalStatus;
  valid_until: string;
  created_at: string;
  sent_at: string | null;
  accepted_at: string | null;
}

export interface Contract {
  id: string;
  proposal_id: string;
  client_name: string;
  company_name: string;
  scope_summary: string;
  total_amount: number;
  status: ContractStatus;
  sent_at: string | null;
  signed_at: string | null;
  expires_at: string;
  signatory: string | null;
  created_at: string;
}

export interface Payment {
  id: string;
  contract_id: string;
  client_name: string;
  company_name: string;
  amount: number;
  status: PaymentStatus;
  payment_method: string;
  payment_reference: string;
  paid_at: string | null;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  automation_name: string;
  automation_key: string;
  setup_price: number;
}

export interface Order {
  id: string;
  payment_id: string;
  client_name: string;
  company_name: string;
  items: OrderItem[];
  total_amount: number;
  status: "pending" | "confirmed" | "fulfilled";
  created_at: string;
}

export interface Entitlement {
  id: string;
  order_id: string;
  client_id: string;
  automation_name: string;
  automation_key: string;
  status: "active" | "revoked" | "expired";
  purchased_at: string;
  implementation_status: AutomationStatus;
}

export interface Organization {
  id: string;
  name: string;
  industry: string;
  website: string | null;
  created_at: string;
}

export interface Client {
  id: string;
  organization_id: string;
  organization: Organization;
  contact_name: string;
  email: string;
  phone: string | null;
  lifecycle_status: ClientLifecycleStatus;
  onboarding_stage: OnboardingStage | null;
  contract_id: string | null;
  payment_id: string | null;
  created_at: string;
}

export interface OnboardingTask {
  id: string;
  client_id: string;
  stage: OnboardingStage;
  title: string;
  description: string;
  status: "pending" | "in_progress" | "completed" | "blocked";
  required: boolean;
}

export interface ClientAutomation {
  id: string;
  client_id: string;
  automation_name: string;
  automation_key: string;
  template_version: string;
  status: AutomationStatus;
  configuration: Record<string, unknown>;
  activated_at: string | null;
}

export interface ClientIntegration {
  id: string;
  client_id: string;
  integration_type: string;
  status: IntegrationStatus;
  last_verified: string | null;
}

export interface Activity {
  id: string;
  client_id: string | null;
  actor: string;
  action: string;
  details: string;
  created_at: string;
}
