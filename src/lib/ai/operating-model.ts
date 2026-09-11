export type AutomationRisk = "low" | "medium" | "high";

export interface OperatingWorkflow {
  id: string;
  name: string;
  purpose: string;
  risk: AutomationRisk;
  defaultApprovalRequired: boolean;
  reversible: boolean;
  owner: "founder" | "operator" | "system";
}

export const ELION_OPERATING_WORKFLOWS: OperatingWorkflow[] = [
  { id: "research", name: "Research and summaries", purpose: "Prepare evidence-backed internal briefs", risk: "low", defaultApprovalRequired: false, reversible: true, owner: "system" },
  { id: "audit-qa", name: "Audit quality review", purpose: "Classify reachability failures and possible false positives", risk: "low", defaultApprovalRequired: false, reversible: true, owner: "operator" },
  { id: "lead-prioritization", name: "Lead prioritization", purpose: "Rank reviewed prospects using evidence and permission state", risk: "medium", defaultApprovalRequired: false, reversible: true, owner: "operator" },
  { id: "crm-update", name: "CRM updates", purpose: "Record approved internal state changes with an audit trail", risk: "medium", defaultApprovalRequired: false, reversible: true, owner: "operator" },
  { id: "content-draft", name: "Content drafting", purpose: "Turn real ELION events into platform-specific drafts", risk: "medium", defaultApprovalRequired: true, reversible: true, owner: "founder" },
  { id: "external-message", name: "External messages", purpose: "Send approved, permission-gated outreach", risk: "high", defaultApprovalRequired: true, reversible: false, owner: "founder" },
  { id: "publish", name: "Content publishing", purpose: "Publish approved content to an external channel", risk: "high", defaultApprovalRequired: true, reversible: false, owner: "founder" },
  { id: "payment", name: "Payments and pricing overrides", purpose: "Change commercial or payment state", risk: "high", defaultApprovalRequired: true, reversible: false, owner: "founder" },
  { id: "deployment", name: "Production deployment", purpose: "Change live application or client workflow state", risk: "high", defaultApprovalRequired: true, reversible: false, owner: "founder" },
];

export function requiresHumanApproval(workflow: OperatingWorkflow, approved = false): boolean {
  return workflow.defaultApprovalRequired && !approved;
}
