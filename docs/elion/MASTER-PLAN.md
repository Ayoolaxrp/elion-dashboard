# ELION MASTER PLAN

**Status: current truth. Update this file whenever strategy or source-of-truth changes.**
Last updated: 2026-09-09

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
| Deep Audit API (Observed/Reported/Modeled separation) | CODE LIVE, migration 025 must be applied | `/api/admin/deep-audit` |
| Lead intelligence API with Next Best Action + consent gating | CODE LIVE, migration 025 must be applied | `/api/admin/lead-intelligence` |
| Pricing + unit-economics guardrails as configuration | LIVE (this pass) | `src/lib/commercial/pricing-model.ts` |
| 30-business validation harness | TOOLING (this pass) | `scripts/validation-30.cjs` |
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

1. **Apply migration 025** and verify deep-audit + consent columns (owner action or agent with Supabase access).
2. **Wire lead-intelligence into the admin lead view UI** (the API exists; the salesperson dashboard panel is the next UI slice).
3. **Run the 30-business validation harness** (`scripts/validation-30.cjs run`) and human-review the outputs.
4. Prospect outreach (20 Lagos businesses) using audit artifacts as the wedge.
5. Productization review after 10-30 paying customers: pick the repeated, highest-margin, lowest-support intervention and make it THE product.

## 7. Deliberately NOT Built (this sprint)

- Remote rendering service (threshold-gated: build only if >10% of qualified audits materially degrade)
- Generic SaaS multi-tenancy, mobile app, elaborate analytics
- More provider fingerprints beyond current coverage
- Automated ROI prediction, AI-generated scoring
- International expansion (currency/config abstraction exists; launch waits for Nigerian PMF evidence)

See DECISION-LOG.md for the reasoning and revisit triggers.
