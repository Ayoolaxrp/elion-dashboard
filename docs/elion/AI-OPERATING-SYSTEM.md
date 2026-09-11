# ELION AI OPERATING SYSTEM

**Status:** Internal operating standard
**Updated:** 2026-09-11

## Purpose

ELION is designed for a founder-led micro-team: founder + one core operator/salesperson + bounded AI workflows + targeted specialists when necessary. AI is the default for repeatable internal work only where the evidence shows it is reliable. It is not an excuse to create autonomous production access or to imitate a large company.

## Risk and approval policy

| Risk | Examples | Default treatment |
|---|---|---|
| Low | Research, summaries, classification, internal analysis, audit failure grouping | May run automatically; retain source/evidence and run history |
| Medium | CRM changes, task creation, lead prioritization, content-calendar changes | May run with validation, auditability, and reversible state |
| High | External messages, publishing, payment state, pricing overrides, permissions, production deployment, deletion | Human approval required until reliability is demonstrated per workflow |

Approval is workflow-specific. A successful low-risk run does not authorize a high-risk action.

## Bounded loops

- **Daily founder brief:** sales, audits, leads, payments, failures, content and the highest-leverage actions.
- **Weekly commercial review:** replies, conversations, calls, proposals, wins/losses, cash, margin and rejection reasons.
- **Audit quality loop:** could-not-verify reasons, false-positive candidates, renderer degradation and completion reliability.
- **Content loop:** real ELION events or explicitly supplied founder ideas become drafts; no automatic publishing.
- **Competitor watch:** record material changes only; do not copy claims or treat public positioning as verified performance.

## Structured output contract

AI output that enters business logic must follow:

`model → JSON parse → typed validation → business rules → persistence`

The shared validators live in `src/lib/ai/structured-output.ts` and cover lead research, content drafts and meeting notes. Malformed JSON, missing required fields, invalid statuses and out-of-range confidence are rejected rather than silently persisted.

## Content Studio rules

Content items must identify a `source_event`, evidence sources, angle, hook, platform drafts and status. Initial lifecycle:

`IDEA → DRAFT → REVIEW → APPROVED → SCHEDULED → PUBLISHED`

A founder may reject or edit a draft. Publishing is not implied by approval in the data model. No AI output may invent customers, revenue, testimonials, ROI, competitor facts or founder experiences. Audit evidence must be anonymised before public use.

The database table for this small internal queue is migration `034_content_studio.sql`. It is intentionally not a public content CMS. The current UI is a review queue for structured drafts; it does not yet generate source ideas from logs, ingest creator URLs, provide a calendar, or invoke n8n publishing. Those remain intentionally deferred until the founder has a real source/approval workflow to operate.

## Lead generation and qualification

Discovery is not qualification. The current repository has a zero-cost operator-controlled CSV/API discovery boundary, preflight and qualification tooling, but no paid/compliant business-discovery provider has been connected or proven in production. The minimum flow is:

`criteria/import → discovery → website validation → deduplication → public evidence → audit → applicability → human review → CRM`

`src/lib/prospect/discovery.ts` and `src/lib/prospect/qualification.ts` reject private/local hosts, require a public source URL and retrieval timestamp, normalize domains for deduplication, classify DNS/HTTP/HTML/identity failures, and prevent a prospect entering the sales queue without a completed audit, evidence, usable confidence, and a permitted contact state. Invalid domains are dataset/discovery failures, not audit failures. `/admin/prospecting` is intentionally an operator review surface; Google Places and SerpAPI remain deferred until manual validation proves their cost is justified.

No outbound message is sent automatically from these foundations. Consent remains channel-specific; a public business email or phone number is not automatically marketing consent. ELION has no separate cold-email send queue in this scope; retain drafting/review only until permission, deliverability and legal review are complete.

## Client account and portal boundary

The existing `/dashboard` and `/dashboard/portal` are one reusable client workspace, not bespoke client dashboards. Client APIs resolve the authenticated user's active client organization through `src/lib/auth/client.ts`; they reject absent, inactive, admin-only, or ambiguous multi-tenant membership and never accept a browser-supplied `client_id`. Portal rows are then filtered to that resolved client. Admin CRM, margins, internal notes and raw credentials remain outside the client surface. Verified payment currently updates invoice/lead state idempotently; a provider-backed Kora test and an explicit production account-creation/entitlement activation check remain pending.

## n8n and Google boundary

`N8N_WEBHOOK_URL`/`N8N_WEBHOOK_SECRET` are integration hooks, not evidence that a self-hosted internal n8n instance is deployed. Record actual VPS, database/storage, backup, monitoring, TLS and maintenance costs before treating internal n8n as live. Client production n8n remains client-owned by default. Google Calendar integration is server-side and client-scoped; request only the scopes needed for the specific workflow, retain revocation/disconnect behavior, and do not require each client to create a Google Cloud project for ordinary ELION identity. Verified Kora payment updates invoice/lead state idempotently and upserts the linked client organization when a `client_id` is present; it does not create an auth user or membership implicitly. Provider-backed Kora testing and explicit production account/entitlement verification remain pending.

## AI capability edge

### AI handles reliably when

- the input is bounded and structured;
- source pages/events are attached;
- output is validated before persistence;
- the action is reversible or internal;
- a human can review the evidence and correct the result.

### Human judgment remains required for

- whether an observed issue matters to a particular business;
- legal/compliance interpretation and direct-marketing basis;
- relationship-sensitive outreach, objections and discovery;
- claims, pricing, overrides, payment settlement and production changes;
- final approval of public content and sales prospects.

### Known failure modes

- unavailable, blocked, dead or JS-only websites;
- absence being mistaken for an internal process failure;
- plausible but unsupported AI prose;
- stale public information;
- malformed model output;
- consent ambiguity;
- provider and network failures.

### What could permit more automation

- repeated measured outcomes;
- stable validation and false-positive metrics;
- explicit approval logs and rollback paths;
- professional legal review of messaging rules;
- provider-backed delivery and payment evidence;
- human-reviewed samples showing workflow-specific reliability.

## Research notes — 2026-09-10

- The NDPC 2025 GAID search result states that consent is required for direct marketing activity; this supports ELION's conservative permission gate. This is an operational interpretation, not legal advice. Source: [NDPC GAID 2025](https://ndpc.gov.ng/wp-content/uploads/2025/07/NDP-ACT-GAID-2025-MARCH-20TH.pdf).
- n8n documentation/search results describe explicit human approval for selected AI tool calls and recommend structured JSON/JSON Schema output for machine-consumed results. Source: [n8n agent tools](https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.agent/tools-agent).
- Google Search Central recommends relevant Organization structured data, self-referential canonicals where appropriate, and sitemap submission. ELION already exposes Organization JSON-LD, sitemap and robots routes; these remain subject to live Search Console verification. Sources: [Organization structured data](https://developers.google.com/search/docs/appearance/structured-data/organization), [canonical URLs](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls).
- Market discovery search showed Nigerian-facing competitors and adjacent providers emphasizing WhatsApp CRM, lead management and AI responses. This supports keeping ELION's differentiation evidence-led rather than claiming an empty market. Public positioning is not proof of competitor capability or pricing.
