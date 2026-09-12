# ELION Intelligence Readiness

**Status:** Preparation only; no dispatcher, worker, model call, or automatic action is enabled.
**Updated:** 2026-09-12

The intelligence layer will observe existing records and produce evidence-linked recommendations. It must not become an unreviewed actor. `docs/elion/INTELLIGENCE-EVENT-CONTRACT.md` remains the event vocabulary.

| Event | Input available | Bounded decision | Possible action | Founder approval |
|---|---|---|---|---|
| `audit.completed` | Audit, lead, evidence states, findings, score, recommendations | Is the finding sufficiently evidenced and is a proposal context complete? | Prepare a review checklist and draft context | Required before client-facing claims or proposal send |
| `proposal.created` | Audit/lead links, client details, document fields, line items, currency, margin snapshot | Is scope, pricing, margin, assumptions, and client context complete? | Flag omissions for founder review | Required before review or send |
| `proposal.sent` | Proposal, recipient context, amount, currency, validity and sent time | Is a follow-up due based on the recorded date and current status? | Suggest a date and conversation prompt | Required before contacting the prospect |
| `proposal.accepted` | Proposal acceptance, margin status, override metadata | Is the commercial handoff complete for contracting and invoicing? | Prepare a handoff checklist | Required before contract, invoice, or provisioning |
| `payment.completed` | Verified provider event, invoice/payment IDs, amount, currency and client link | Do verified records reconcile and is onboarding ready? | Prepare onboarding tasks and reconciliation note | Required before entitlement or production activation |
| `client.created` | Client, linked lead/contract/payment context and lifecycle status | Are contact, scope, access and onboarding prerequisites present? | Prepare a welcome/onboarding checklist | Required before external communication |
| `deployment.failed` | Client/automation IDs, failure category, version, timestamp and owner | Is this a transient issue, missing prerequisite, or incident requiring escalation? | Prioritize review and suggest rollback/remediation options | Required before production or provider changes |

## Guardrails

- Recommendations cite source records and preserve observed, reported, and modeled distinctions.
- No model output may invent customer facts, results, revenue, ROI, consent, or evidence.
- External messaging, publication, pricing overrides, payment state, permissions, deletion, and production changes always remain founder-approved.
- Consumers must be idempotent and deduplicate provider/event retries.
- A recommendation is not an authorization. Approval must be recorded separately from generation.

## Readiness gates before implementation

1. The event producer and payload version are identified for each event.
2. Existing activity/notification records are mapped without duplicating lifecycle truth.
3. Structured output validation and evidence references are available at the consumer boundary.
4. A dry-run/replay path and audit log exist.
5. Approval, rejection, correction, and rollback are defined for each action.
6. Repeated real workflow samples demonstrate stable quality before any higher-risk automation is considered.
