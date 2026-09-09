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
