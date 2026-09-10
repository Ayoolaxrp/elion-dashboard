# ELION IMPLEMENTATION LOG

**Records actual code/deployment changes. Newest at bottom. One entry per meaningful phase.**

---

## 2026-09-06 — Audit engine rebuild (commit af4b734, deployed)

- **Objective:** Reduce audit false negatives without false positives; honest verification states.
- **Files:** `src/lib/audit/` (fetch-safe, registry, extract, detect, crawl, deep, pipeline), `src/app/api/audit/route.ts`, `src/app/audit/page.tsx`, `scripts/scrape.py`, `tests/audit/*`, `scripts/cleanup-audit-qa.cjs`.
- **Behaviour:** Static homepage → bounded 5-page crawl → conditional Scrapling render with runtime-network capture. Categories report found / not_found / could_not_verify with per-finding evidence and source pages. "What this audit checked" panel in UI.
- **Tests:** 24/24 fixtures, 11/11 integration, 9/9 UI, 216/220 Simeone sweep (4 documented false expectations).
- **Production:** Verified live; deep stage records serverless limitation visibly (no Python on Vercel).
- **Risks:** Rendered-DOM coverage unavailable on Vercel; sitemap/robots discovery not yet added.

## 2026-09-09 — Commercial engine sprint (Phases 0-7)

- **Objective:** Turn the audit into an evidence-led revenue engine (MASTER-PLAN phases).
- **Competitor research:** Re-verified 2026-09-09; see COMMERCIAL-MODEL.md §4.
- **Files changed:**
  - `src/lib/commercial/solutions.ts` — 7-solution catalogue with applicability, disqualifiers, discovery questions, tiers.
  - `src/lib/commercial/applicability.ts` — opportunity engine: detection + context + confidence; "no strong opportunity" is a valid result; disqualifier caps state at investigate.
  - `src/lib/commercial/pricing-model.ts` — tiers, Care plans, margin guardrails (`checkQuoteMargin`), usage/overage model, cash-flow rules, build+handover, annual discount cap, internal pilot config.
  - `src/app/api/audit/route.ts` — response now includes `commercial` (opportunities) computed by the engine; backward-compatible.
  - `supabase/migrations/025_deep_audit_consent.sql` — `deep_audits` table (reported/modeled JSONB separated) + `leads.contact_permission`/`consent_source`/`consent_updated_at`.
  - `src/app/api/admin/deep-audit/route.ts` — Deep Audit API; deterministic modeled derivations with assumptions; honest 503 when migration not applied.
  - `src/app/api/admin/lead-intelligence/route.ts` — one sales payload: observed (audit), reported (deep audit), modeled, proposals, unpaid invoices, deterministic Next Best Action with consent gating.
  - `src/app/methodology/page.tsx` — public audit-methodology page (evidence classes, checks, limitations, data handling); footer link + sitemap entry.
  - `src/app/page.tsx` — homepage title → "ELION - Revenue Recovery & Business Automation for Nigerian Businesses".
  - `public/robots.txt` — DELETED (stale trap pointing sitemap at elion.ng; src/app/robots.ts is canonical).
  - `scripts/validation-30.cjs` — 30-business validation harness with separate human-validation fields.
  - `tests/commercial/run-applicability.cjs` (28 checks), `tests/commercial/run-nba.cjs` (13 checks).
- **Database changes:** migration 025 (apply pending at time of writing).
- **Behaviour changed:** audit API consumers now receive `commercial`; leads API consumers must tolerate `contact_permission` defaulting to 'unknown'.
- **Tests:** applicability 28/28; NBA/consent 13/13; typecheck clean; build verified this pass (see final report).
- **Deliberately not built:** remote renderer, admin lead-intelligence UI panel (API ready), outcome dataset, benchmarks display.
- **Remaining risks:** migration 025 must be applied before deep-audit/intelligence APIs function; NDPA specifics pending professional review; harness human fields require real conversations.

## 2026-09-10 — Commercial delivery operating layer (verified phase)

- **Repository identity confirmed before edits:** `C:/Users/User/Projects/elion`; remote `https://github.com/Ayoolaxrp/elion-dashboard.git`; branch `master`; package `elion`; production domain `https://elion.com.ng`; commit baseline `dd34b26` and subsequent ELION commits. This is not the Ingenuity HRM repository.
- **Objective:** Complete the operational loop from salesperson diagnosis through economically safe quote, verified Kora payment and client-owned n8n delivery.
- **Security:** `exec_sql` was confirmed as a SECURITY DEFINER arbitrary-SQL RPC that was callable by anon before this sprint. Migration 027 now revokes PUBLIC/anon/authenticated execution and grants only `service_role`; live regression passed. Admin migrate/setup routes now require a real admin session.
- **Consent:** Migration 028 adds normalized `lead_contact_permissions` channel rows (email, WhatsApp, SMS, phone) and preserves scalar fallback. NBA is channel-exact; public contact is never opt-in. Consent/NBA tests pass.
- **Applicability:** Mozilla-style all-absence inflation fixed. Solution definitions now require positive evidence before strong opportunity; solution-level `notApplicableWhen` is wired. Applicability suite: 28/28.
- **Salesperson UI:** `LeadIntelligencePanel` is wired into `/admin/leads`, showing business context, observed opportunities/evidence, channel permission, observed/reported/modeled truth types, NBA, proposals and invoices. Migration 029 persists audit `verified` categories so the panel can re-run commercial applicability from stored evidence.
- **Payments:** Migrations 030/032 add provider-neutral Kora fields, webhook idempotency index, verification metadata and proposal margin snapshots. Kora initialize/verify/webhook routes were added. Webhooks use documented `x-korapay-signature` HMAC-SHA256 over the `data` object, re-verify server-side and reject amount mismatches. Kora tests: 26/26. Kora credentials are not configured in the repository, so a live checkout was not performed.
- **Delivery:** Migration 031 adds client-owned n8n deployment fields to `client_automations` and creates `vendor_costs`. Deployment API/page records ownership, access, plan, execution estimate/actual, version, testing, monitoring, Care and offboarding. Execution/deployment/Care/vendor tests: 19/19.
- **Economics/Care:** Proposal creation stores margin inputs; proposal acceptance is blocked when margin is blind/below guardrails unless a substantive founder override is logged. Margin tests: 10/10. Care classification and usage/vendor cost warnings are deterministic.
- **Deep Audit:** Migration 033 projects frequently queried reported fields into columns while retaining Reported/Modeled JSONB snapshots; API writes both consistently.
- **QA:** Simeone suite was corrected so mobile CTA availability is asserted against global header DOM/menu, not accidental body copy. Local production build sweep: 220/220.
- **Build/typecheck:** `npx tsc --noEmit` passed; `npm run build` passed.
- **Database changes applied live:** 027, 028, 029, 030, 031, 032, 033. No destructive QA data was created by these migrations.
- **Verification status:** This phase is complete and verified locally/live where applicable; production deployment was not performed in this continuation. ELION production remains at the previously deployed baseline until this committed change set is reviewed and deployed through the normal repository identity.
- **Remaining risks:** Kora secret/webhook configuration and a real sandbox/live payment test remain; 30-business machine validation and human owner validation remain pending; professional legal review remains required for NDPA/messaging terms; no remote renderer was added. The proposal UI now captures the margin inputs required for acceptance, but the Kora flow still awaits credentials and end-to-end payment verification.
