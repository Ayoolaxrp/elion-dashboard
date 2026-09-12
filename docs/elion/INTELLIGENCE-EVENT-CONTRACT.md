# ELION Intelligence Event Contract

**Status:** Design contract only — no automation is enabled by this document.
**Updated:** 2026-09-12

ELION's intelligence layer must observe existing commercial events, retain the source record, produce a bounded recommendation, and wait for founder approval before any external, financial, permission or production action.

| Event | Trigger | Data available | Possible recommendation | Approval required |
|---|---|---|---|---|
| `audit.completed` | An audit reaches `completed` | Audit ID, lead ID, company, findings, severity, evidence state, recommendations, score | Review finding quality; prepare proposal context | Yes before client-facing claims or proposal send |
| `proposal.created` | A proposal draft is inserted | Proposal ID, audit/lead IDs, client context, document fields, line items, currency, pricing and margin snapshot | Flag missing scope, missing assumptions, or margin review | Yes before review/send |
| `proposal.sent` | A proposal moves from `draft` to `sent` | Proposal ID, recipient context, amount, currency, validity, sent timestamp | Suggest a manual follow-up date and conversation prompt | Yes before any contact |
| `proposal.accepted` | Margin-gated proposal becomes `accepted` | Proposal ID, acceptance timestamp, margin status, override metadata when applicable | Prepare contract/invoice and implementation handoff checklist | Yes before contract, invoice or provisioning |
| `payment.completed` | Server-side payment verification succeeds | Payment/invoice IDs, verified amount and currency, provider reference, linked client/lead | Prepare onboarding and reconcile commercial records | Yes before access, entitlement or production activation |
| `client.created` | A client record is created through an approved lifecycle path | Client ID, organization, linked lead/contract/payment context, lifecycle status | Prepare welcome and onboarding checklist | Yes before sending client communication |
| `deployment.failed` | A deployment or provisioning operation records failure | Client/automation IDs, workflow version, error category, timestamp, owner | Prioritize incident review and propose rollback or remediation | Yes before production changes or vendor actions |

## Safety rules

1. Events are observations, not proof of a business outcome.
2. Recommendations must cite the event data and distinguish observed, reported and modeled values.
3. External messages, publishing, payment state, pricing overrides, permissions, deletion and production deployment remain human-approved actions.
4. Repeated provider events must be idempotent; an event consumer must not create duplicate contracts, invoices, payments, clients or entitlements.
5. An event contract does not authorize a new database table, provider, outbound channel or background worker.

## Current implementation boundary

Existing `activity_log`, notifications, proposal, payment, client and deployment paths already record overlapping lifecycle activity. This document is the normalized contract for a future intelligence consumer; it intentionally does not add a dispatcher, queue, AI agent or automatic action.
