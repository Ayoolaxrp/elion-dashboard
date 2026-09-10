# ELION Client-Owned n8n Deployment Runbook

**Status:** Operating standard
**Owner:** ELION delivery
**Scope:** Paid client automations using n8n Cloud or an approved self-hosted n8n instance.

## Principle

The client owns the production n8n account/instance, billing and production vendor credentials by default. ELION designs, configures, deploys, tests, versions, monitors while ELION Care is active, and supports the agreed scope. Do not centralize multiple clients' production credentials in an ELION-owned instance without an explicit later business/licensing decision.

## Pre-sale

1. Link the proposed workflow to the evidence-backed business problem and confirmed discovery answers.
2. Confirm the intervention and disqualifiers; do not sell a workflow merely because a technology was not detected publicly.
3. Estimate execution demand from schedules, webhooks, enquiries, messages, polling/background jobs and retry allowance.
4. Identify every required vendor and record who owns and pays it in the vendor-cost register.
5. Include any ELION-paid client-specific usage in direct-cost and recurring-margin calculations. Never promise unlimited usage.

## After payment

1. Confirm the accepted proposal, required payment and onboarding entitlement.
2. Create the deployment checklist and assign a delivery owner.
3. Client creates or approves the n8n account/instance using a company-controlled identity and payment method.
4. Client owns n8n billing and production credentials unless a written exception is approved.
5. Client grants ELION the least-privilege access needed for the build.

## Credentials

- Never place passwords, API keys, OAuth secrets or private tokens in ordinary `client_automations` fields, notes, proposals or vendor-cost rows.
- Prefer the client's native secret store/credential vault and invitation-based access.
- Record only ownership, access state, provider, workspace/instance reference and a safe credential reference where necessary.
- Client production credentials remain client-owned wherever practical.

## Build

1. Start from a versioned ELION internal template when appropriate.
2. Apply client-specific configuration without changing the reusable template's identity.
3. Record workflow version, instance/workspace reference and backup/export reference.
4. Configure timeouts, retries, deduplication, error routing and human escalation.
5. Update estimated execution volume if the design changes.

## QA acceptance matrix

Test and record results for:

- normal success path;
- invalid input;
- duplicate webhook/event;
- provider/API failure;
- timeout and retry;
- missing credential;
- downstream outage;
- notification delivery;
- human escalation;
- usage and execution-limit warning.

A deployment is not `live` until the client acceptance test, known-good version and payment/go-live gate are recorded.

## Go-live

Required before activation:

- billing owner decided (client by default);
- client-owned instance/workspace recorded;
- ELION access granted at the required least-privilege level;
- known-good workflow version recorded;
- acceptance test recorded;
- material implementation balance cleared;
- monitoring and Care state recorded;
- client and ELION understand variable usage/overage responsibility.

## ELION Care

Care includes monitoring, defect repair, routine tuning, supported usage review and agreed response targets. Classify every request as incident, bug, configuration, included change, change request or new workflow. A new integration, new workflow or material scope expansion is separately quoted; Care is not unlimited development. Track support hours and incidents by client.

## Offboarding

If Care stops or the client cancels:

1. Do not delete a fully paid deployment.
2. Stop ELION monitoring and SLA/support at the agreed date.
3. Remove ELION access and record the removal.
4. Supply the latest known-good workflow export/version where applicable.
5. Disclose unresolved incidents and known operational limitations.
6. Client retains its paid instance, workflows and production credentials.
7. Future changes, new workflows and reactivation are separately chargeable.
8. Flag IP, handover and contract treatment for legal review; this runbook is not legal advice.

## Required records

Use the deployment record to retain: client, solution, orchestration provider, deployment type, instance/workspace reference, billing owner, plan, estimated and actual executions, ELION access state, deployment state, workflow version, last tested, backup/export reference, monitoring state, Care state, go-live date and offboarding date. Do not store secrets in these records.
