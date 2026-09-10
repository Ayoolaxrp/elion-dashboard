// Client-owned n8n deployment model (P0 of the commercial-delivery sprint).
//
// ELION's default production model:
//   client owns the n8n account/instance and normally pays n8n directly;
//   ELION designs, configures, deploys, tests, monitors while Care is
//   active, and supports. ELION never silently centralizes client
//   production credentials in a shared instance.
//
// This module is pure/deterministic so delivery rules are testable without
// a database.

export interface ExecutionEstimateInput {
  /** Fixed schedules per day, e.g. daily report = 1. */
  scheduledRunsPerDay?: number;
  /** Expected webhook-triggered executions per month (enquiries, events). */
  webhookRunsPerMonth?: number;
  /** Expected chat/message-triggered executions per month. */
  messageRunsPerMonth?: number;
  /** Expected background/aggregation runs per month. */
  backgroundRunsPerMonth?: number;
  /** Retry/polling multiplier, e.g. 1.2 means 20% extra runs. */
  retryFactor?: number;
}

export interface ExecutionEstimate {
  estimatedMonthlyExecutions: number;
  assumptions: string[];
  /** Rough n8n plan signal (not a price). */
  planBand: "starter" | "growth" | "enterprise";
}

/**
 * Estimate monthly n8n executions BEFORE choosing a client plan. The plan
 * must be chosen from execution demand, not from workflow count. All inputs
 * are explicit assumptions; the output is a scenario, never a promise.
 */
export function estimateMonthlyExecutions(input: ExecutionEstimateInput): ExecutionEstimate {
  const assumptions: string[] = [];
  const retry = Math.max(1, input.retryFactor || 1);

  const scheduled = Math.round((input.scheduledRunsPerDay || 0) * 30);
  if (input.scheduledRunsPerDay) {
    assumptions.push(`Scheduled runs: ${input.scheduledRunsPerDay}/day → ${scheduled}/month`);
  }
  const webhooks = Math.round((input.webhookRunsPerMonth || 0) * retry);
  if (input.webhookRunsPerMonth) {
    assumptions.push(`Webhook runs: ${input.webhookRunsPerMonth}/month × retry ${retry} → ${webhooks}`);
  }
  const messages = Math.round((input.messageRunsPerMonth || 0) * retry);
  if (input.messageRunsPerMonth) {
    assumptions.push(`Message runs: ${input.messageRunsPerMonth}/month × retry ${retry} → ${messages}`);
  }
  const background = Math.round((input.backgroundRunsPerMonth || 0) * retry);
  if (input.backgroundRunsPerMonth) {
    assumptions.push(`Background runs: ${input.backgroundRunsPerMonth}/month × retry ${retry} → ${background}`);
  }

  const total = scheduled + webhooks + messages + background;
  if (total === 0) {
    assumptions.push("No execution drivers provided — estimate is 0 until drivers are known.");
  }

  const planBand: ExecutionEstimate["planBand"] = total <= 5000 ? "starter" : total <= 20000 ? "growth" : "enterprise";
  assumptions.push(`Plan band signal: ${planBand} (≈${total} executions/month). Verify against the vendor's current limits before proposing a plan.`);

  return { estimatedMonthlyExecutions: total, assumptions, planBand };
}

export type CareRequestType =
  | "incident"
  | "bug"
  | "configuration"
  | "included_change"
  | "change_request"
  | "new_workflow";

export interface CareRequestInput {
  isOutage: boolean;
  isDefectInShippedWorkflow: boolean;
  isRoutineTuning: boolean;
  isMinorConfig: boolean;
  isNewIntegration: boolean;
  isNewWorkflow: boolean;
  isMajorScopeExpansion: boolean;
}

/**
 * ELION Care is not "unlimited development". Requests outside the included
 * scope must become a change request / upsell, never silent free work.
 */
export function classifyCareRequest(input: CareRequestInput): {
  type: CareRequestType;
  included: boolean;
  note: string;
} {
  if (input.isOutage) {
    return { type: "incident", included: true, note: "Outage triage is always included while Care is active." };
  }
  if (input.isDefectInShippedWorkflow) {
    return { type: "bug", included: true, note: "Defects in the shipped workflow are included (Care or warranty)." };
  }
  if (input.isRoutineTuning) {
    return { type: "configuration", included: true, note: "Routine tuning is included." };
  }
  if (input.isMinorConfig && !input.isNewIntegration && !input.isNewWorkflow && !input.isMajorScopeExpansion) {
    return { type: "included_change", included: true, note: "Minor configuration adjustment is included." };
  }
  if (input.isNewIntegration || input.isNewWorkflow || input.isMajorScopeExpansion) {
    return { type: "new_workflow", included: false, note: "New integration/workflow/major expansion is OUT of included scope → change request / upsell." };
  }
  return { type: "change_request", included: false, note: "Out-of-scope request → change request / upsell." };
}

export interface DeploymentReadiness {
  ready: boolean;
  missing: string[];
}

/**
 * Client-owned deployment lifecycle gate. A deployment may not go live until
 * ownership is clear, ELION has least-privilege access, the workflow is
 * versioned and tested, and no unpaid implementation balance blocks go-live.
 */
export function validateDeploymentReadiness(d: {
  billingOwner?: string | null;
  elionAccessState?: string | null;
  workflowVersion?: string | null;
  lastTestedAt?: string | null;
  deploymentState?: string | null;
  outstandingImplementationBalance?: number;
}): DeploymentReadiness {
  const missing: string[] = [];
  if (d.billingOwner !== "client" && d.billingOwner !== "elion") {
    missing.push("Billing owner must be decided (client owns the account by default).");
  }
  if (d.elionAccessState !== "granted") {
    missing.push("ELION least-privilege access must be granted by the client.");
  }
  if (!d.workflowVersion) {
    missing.push("A known-good workflow version must be recorded.");
  }
  if (!d.lastTestedAt) {
    missing.push("An acceptance test must be recorded (last_tested_at).");
  }
  if (d.deploymentState !== "live" && (d.outstandingImplementationBalance || 0) > 0) {
    missing.push("Outstanding implementation balance must be cleared before go-live.");
  }
  return { ready: missing.length === 0, missing };
}

/** Required providers for the Infrastructure Setup Checklist (client-facing). */
export const INFRASTRUCTURE_CHECKLIST: Array<{
  provider: string;
  service: string;
  why: string;
  defaultOwner: "client" | "elion";
}> = [
  { provider: "n8n", service: "Workflow orchestration", why: "Runs the deployed automation. Client owns the account and billing by default.", defaultOwner: "client" },
  { provider: "WhatsApp Business", service: "Messaging channel", why: "Sends/receives the messages the workflows act on.", defaultOwner: "client" },
  { provider: "AI (OpenAI/Anthropic)", service: "Language/decision steps", why: "Used where a workflow needs language understanding or generated text.", defaultOwner: "client" },
  { provider: "Email/SMTP", service: "Transactional email", why: "Delivers confirmations, follow-ups and alerts.", defaultOwner: "client" },
  { provider: "SMS", service: "SMS channel", why: "Fallback/urgent notifications where configured.", defaultOwner: "client" },
  { provider: "Database/Hosting", service: "Data persistence", why: "Stores leads, activity and workflow state.", defaultOwner: "client" },
  { provider: "Browser/rendering", service: "Page inspection", why: "Only where a workflow needs rendered page access.", defaultOwner: "client" },
  { provider: "Third-party CRM", service: "CRM integration", why: "Where the client's existing CRM is part of the flow.", defaultOwner: "client" },
];