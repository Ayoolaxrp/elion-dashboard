# ELION MASTER PLAN

**Status: current truth. Update this file whenever strategy or source-of-truth changes.**
Last updated: 2026-09-11

---

## 1. Positioning

Company-level: **ELION is an AI Operations & Automation company.**

Immediate commercial wedge: **Revenue Recovery + Business Process Improvement.**

Locked positioning statement:

> ELION finds where customer opportunities are being lost, proves what it can
> verify, and builds the system that captures, follows up, tracks and recovers
> those opportunities.

The homepage is NOT a generic list of AI/CRM/chatbots/analytics. Those are
capabilities. The headline is the audit -> evidence -> fix -> operate loop.

## 2. The Commercial Flywheel

```
PROSPECT → AUDIT → DIAGNOSIS → SALES CONVERSATION → DEEP AUDIT
→ SOLUTION → PROPOSAL → PAYMENT → IMPLEMENTATION → MEASUREMENT
→ CASE STUDY → TEMPLATE → MORE SALES
```

Every system built must serve a link in this chain. Anything else waits.

## 3. What exists today (production)

| Capability | State | Where |
|---|---|---|
| Multi-stage audit pipeline (static → bounded crawl → conditional render) | LIVE | `src/lib/audit/`, commit af4b734 |
| Honest verification states (found / not_found / could_not_verify) | LIVE | pipeline + audit UI |
| Solution catalogue + applicability engine | LIVE (this pass) | `src/lib/commercial/` |
| Commercial opportunities in audit API response (`commercial` field) | LIVE (this pass) | `/api/audit` |
| Deep Audit API (Observed/Reported/Modeled separation) | LIVE, migrations 025/033 applied | `/api/admin/deep-audit` |
| Lead intelligence API + salesperson workspace + Next Best Action | LIVE, migrations 028/029 applied | `/api/admin/lead-intelligence`, `/admin/leads` |
| Pricing + unit-economics guardrails + proposal acceptance gate | LIVE, migration 032 applied | `src/lib/commercial/`, `/admin/proposals` |
| Kora provider-neutral payment lifecycle | CODE LIVE, migration 030 applied; credentials/sandbox verification pending | `/api/payments/kora/*`, `/api/webhooks/kora` |
| Client-owned n8n deployment + vendor-cost register | LIVE, migration 031 applied | `/admin/deployments`, `N8N-DEPLOYMENT-RUNBOOK.md` |
| Channel-specific consent + exact-channel NBA | LIVE, migration 028 applied | `src/lib/commercial/consent.ts` |
| 30-business validation harness | TOOLING; previous run was 9/30 because 21 inputs were DNS/network/HTTP-blocked; clean active-site cohort still required | `scripts/validation-30.cjs` |
| Reusable client portal | LIVE locally; shared `/dashboard` + `/dashboard/portal` with membership-scoped APIs; authenticated tenant QA pending | `src/lib/auth/client.ts`, `src/app/dashboard/portal/`, `/api/client/*` |
| Founder Content Studio | LIVE locally as an admin review queue; migration 034 required; source generation/calendar/creator intelligence not built | `/admin/content`, `/api/admin/content` |
| Audit methodology page | LIVE (this pass) | `/methodology` |
| Remote rendering service | NOT BUILT (deliberately, see DECISION-LOG) | - |

## 4. Commercial Model Summary

Full detail: `COMMERCIAL-MODEL.md` (competitor research, unit economics).

| Tier | Implementation | ELION Care | Scope |
|---|---|---|---|
| Recovery Sprint | from ₦150,000 | ₦50,000/mo | 1 workflow |
| Growth System | from ₦350,000 | ₦100,000/mo | 2-4 connected workflows |
| Scale System | from ₦750,000 | ₦200,000/mo | 5+ workflows / custom |
| Custom | quoted | quoted | per discovery |

Margin guardrails: implementation ≥60% contribution margin, recurring ≥70%.
Every quote is checked by `checkQuoteMargin()`; failing quotes must be
renegotiated, not silently accepted.

Payment defaults: 70% before implementation / 30% before go-live (Scale:
50/30/20). First Care month prepaid. Commission basis: collected cleared cash.

## 5. Non-Negotiable Evidence Rules

1. Absence of technology ≠ leak. Applicability requires detection + context.
2. Unverifiable evidence never becomes a confident recommendation.
3. Reported (business claims) and modeled (derived arithmetic) are stored and
   displayed separately from observed evidence. Never merged.
4. No financial ROI promises. Operational outcomes only. Modeled figures are
   scenario ranges with assumptions attached.
5. A public WhatsApp number is not marketing consent. Consent states gate all
   outreach; opt-out wins over every commercial state.
6. The engine can and must be able to say: "No sufficiently strong commercial
   opportunity was identified from public evidence."

## 6. Next Steps (priority order)

1. Configure Kora credentials and complete a sandbox/live payment test, including duplicate webhook and amount-mismatch cases.
2. Run the 30-business machine validation against a hand-verified target set and keep human-owner fields empty until real conversations occur.
3. Use the salesperson workspace for prospect feedback; review strong/investigate/zero-opportunity distribution.
4. Prospect outreach (20 Lagos businesses) using audit artifacts as the wedge, respecting exact-channel permission.
5. Productization review after 10-30 paying customers: pick the repeated, highest-margin, lowest-support intervention and make it THE product.

## 7. Lean AI-native operating model

Pre-PMF ELION remains founder-led: founder + one core operator/salesperson + bounded AI workflows + targeted contractors. Low-risk research, summaries and classification can run automatically; medium-risk CRM and prioritization changes need auditability and reversibility; high-risk messaging, publishing, payments, permissions and deployment require human approval. See `AI-OPERATING-SYSTEM.md`.

The internal Content Studio is deliberately small: real event → structured draft → review → approval → separate publishing action. It is not yet a source-event generator, creator-analysis tool, calendar or n8n publisher. Prospect discovery is not sales qualification: websites must be validated, normalized and deduplicated before audit evidence can enter a review queue. The repository now provides a zero-cost provider-neutral manual CSV/API discovery boundary and qualification safeguards, but no paid/provider-backed discovery integration. No automated outbound is enabled by these foundations.

## 8. Deliberately NOT Built (this sprint)

- Remote rendering service (threshold-gated: build only if >10% of qualified audits materially degrade)
- Bespoke client dashboards; the reusable client portal is the standard surface, while industry-specific systems remain separately scoped Custom Business System work
- Generic SaaS multi-tenancy, mobile app, elaborate analytics
- More provider fingerprints beyond current coverage
- Automated ROI prediction, AI-generated scoring
- International expansion (currency/config abstraction exists; launch waits for Nigerian PMF evidence)

## 8. Provider-neutral prospecting boundary (2026-09-11)

The zero-cost discovery path is now an operator-controlled CSV/API import, not a paid discovery provider. `src/lib/prospect/discovery.ts` defines the replaceable provider contract; `/admin/prospecting` and `/api/admin/prospecting` import candidates, preserve source attribution, normalize and deduplicate domains, run SSRF-safe DNS/redirect/HTML/business-identity preflight, classify failures, and persist only preflight-passed candidates as audit-ready. The queue is capped at 100 rows per import. Google Places and SerpAPI remain deferred until a hand-verified target set proves that provider cost improves the path from 100 candidates to 30 usable audits.

The reference Lead Response endpoint now requires trusted webhook authentication or an authorized admin session, resolves the client before reading configuration, scopes client reads from the authenticated membership, and uses `(client_id, inbound_event_id)` idempotency when migration 035 is applied. It does not claim delivery until the downstream n8n call succeeds.

Product catalog entries now have machine-readable commercial metadata covering problem, ideal customer, scope, ELION fees, variable-cost assumptions, provisioning, client requirements and entitlement rules. No catalog product is commercially complete without that metadata.

## 9. Engineering freeze and commercial gate

The next gate is operational: import and manually verify 100 active Nigerian prospects, run 30 valid audits, review the evidence, start 10 conversations and acquire the first customer. Do not add a paid discovery provider, automatic outbound, remote renderer or AI receptionist execution until real cost, reliability and sales evidence justify it.

## 10. Commercial reality gate

The current engineering gate is closed after the provider-neutral prospecting boundary and product-economics contract. The next work is operational: import and manually verify 100 active Nigerian prospects, run 30 valid audits, review evidence, start 10 founder-led conversations and acquire the first paying customer. Do not add paid discovery, automatic outbound, remote rendering, AI receptionist execution or additional product surface until those steps produce evidence.

## 11. First-customer validation surfaces (2026-09-11)

The existing public `/demo` is now an explicitly labelled simulated Lagos real-estate Lead Response reference scenario: sample knowledge base/listings, FAQs, qualification, CRM capture, follow-up and human viewing handoff. It is demonstration data only and does not create production records or send messages.

The founder dashboard exposes six recorded validation counters through `/api/admin/stats`: businesses reviewed, audits completed, qualified opportunities, conversations started, proposals sent and customers won. These counters are operational records, not owner-confirmed outcomes, revenue claims or forecasts. The next milestone remains one real Nigerian business acquired, paid, onboarded, deployed and measured.
