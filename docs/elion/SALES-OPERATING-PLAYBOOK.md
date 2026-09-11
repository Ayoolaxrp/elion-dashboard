# ELION Sales Operating Playbook

## Positioning

ELION finds where customer opportunities may be difficult to capture, follow up or operate, proves what public evidence can verify, and builds the system that captures, follows up, tracks and recovers those opportunities.

Sell outcomes and operating systems, not generic AI-agent claims.

## Operating loop

`AUDIT → APPLICABILITY → SALESPERSON → NEXT BEST ACTION → DEEP AUDIT → QUOTE → KORA PAYMENT → CLIENT-OWNED n8n DEPLOYMENT → GO-LIVE → ELION CARE → MEASUREMENT`

## What the salesperson must see

Open the lead workspace and review:

1. **Business:** company, website, industry, location and contact paths.
2. **Observed:** evidence ELION verified from successfully inspected public pages, including source page, confidence, reachability and any could-not-verify warning.
3. **Diagnosis:** strong opportunity, investigate, insufficient evidence, not applicable or no recommendation.
4. **Reported:** what the business told ELION; do not present it as independently verified.
5. **Modeled:** arithmetic derived from reported inputs; label assumptions and do not call it measured revenue.
6. **Next Best Action:** deterministic action and the exact contact channels permitted by channel-specific permission.
7. **Commercial state:** stage, proposal, quote, direct cost, margin, invoice, payment and next activity.

## Discovery discipline

A public signal is not proof of an internal process. Ask:

- How do enquiries arrive and who owns them?
- How quickly is a first response sent?
- What happens after an enquiry does not convert?
- How are bookings, reminders and no-shows handled?
- What systems and spreadsheets are involved?
- What happens after payment and before delivery?
- Do previous customers buy again?

If the public audit does not provide strong evidence plus applicable business context, use **investigate** or **request a Deep Audit**. Zero strong opportunities is a valid result.

## Contact permission

A scraped public number is `public_business_contact`, not marketing opt-in. Email, WhatsApp, SMS and phone permissions are independent. Never use an email opt-in to authorize WhatsApp. Never queue outreach for `opted_out` or `do_not_contact`. If the exact channel is not permitted, call or ask for permission through an appropriate lawful route rather than improvising.

## Quote discipline

Every quote records:

- implementation price and Care price;
- delivery hours and shadow labour rate;
- contractor, onboarding, API/setup and ELION-paid infrastructure costs;
- contingency;
- estimated recurring direct cost;
- margin check and status.

Target contribution margins are at least 60% implementation and 70% recurring. A quote below guardrails cannot be accepted without a substantive founder override recording the user, time, reason and margin snapshot. No cost inputs means the quote is economically blind and cannot be accepted.

## Package ladder

- **Recovery Sprint:** from ₦150,000 implementation + ₦50,000/month Care; one defined workflow.
- **Growth System:** from ₦350,000 implementation + ₦100,000/month Care; 2–4 connected workflows.
- **Scale System:** from ₦750,000 implementation + ₦200,000/month Care; multi-workflow/custom integrations.
- **Custom:** scoped individually.

The Founding Partner Pilot is internal-only and must not be published by default.

## Payment and delivery

Use Kora as the current payment provider. Accepted proposal leads to invoice/order and a Kora checkout. A return URL is not proof of payment. Only server-side Kora verification or a validated, re-verified webhook may mark payment successful and unlock onboarding. Repeated webhooks must be idempotent.

After required payment, use the client-owned n8n runbook. Record client ownership, plan/execution assumptions, vendor costs, access state, workflow version, acceptance test and Care state before go-live.

## Care boundaries

Included: monitoring, defect repair, routine tuning and agreed minor configuration. Separately quote new workflows, new integrations, major scope expansion and new features. Track support hours and classify each request before work begins.

## First validation queue

Do not confuse discovered domains with qualified prospects. A candidate must have an active public website, source/retrieval metadata, a completed audit, useful evidence, confidence and a permission state that does not block the proposed channel. Dead/DNS/timeout/HTTP-blocked inputs are validation failures to classify, not commercial findings.


The first queue is founder-reviewed, not automated outreach. A prospect may enter only when its website is active, the audit completed, evidence is useful, and the proposed discovery question is relevant. For each queued prospect record the strongest observation, evidence URL, confidence, unknowns, first question, candidate solution, exact permitted channel, priority and reason. Leave contacted, replied, decision-maker reached, problem confirmed, call, proposal, sale, rejection reason and amount collected empty until the real interaction occurs.

Standard rejection reasons: no budget, price too high, no urgency, already solved, wrong problem, wrong decision maker, no trust, recurring fee objection, n8n/vendor-cost objection, timing, not interested, other.

## Never claim

Do not claim a business has no CRM because it was not detected. Do not claim a revenue leak without business data and a documented calculation. Do not present modeled figures as observed. Do not claim consent from a public contact. Do not fabricate outcomes, testimonials or case studies.
