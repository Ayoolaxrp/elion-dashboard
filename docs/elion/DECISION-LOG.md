# ELION DECISION LOG

**Every material decision gets an entry: decision, context, alternatives, reason, consequence, revisit trigger.**
Never silently change commercial assumptions. Newest entries at the bottom.

---

## D-001: Commercial wedge is Revenue Recovery + Business Process Improvement, not "AI agency"

- **Decision:** Position ELION's immediate offer around revenue recovery and
  business process improvement, backed by the audit. Company-level positioning
  stays "AI Operations & Automation company."
- **Context:** Nigerian SMB market buys outcomes (recovered enquiries, booked
  appointments), not "AI agents." The AI-agency space is crowded and commoditising.
- **Alternatives considered:** Lead with "AI automation agency" (rejected: generic,
  price-compressed); lead with a single vertical product (rejected: premature
  before validation data).
- **Reason:** The audit is the differentiator. Evidence-first sales converts
  better and justifies higher prices than tool-selling.
- **Consequence:** Homepage/product copy leads with audit → fix → operate; AI
  capabilities are supporting detail.
- **Revisit trigger:** If 10+ discovery conversations show buyers want a named
  tool first, revisit packaging.

## D-002: No unexplained 0-100 "Automation Opportunity Score"

- **Decision:** Do not rely on an arbitrary composite score for commercial
  decisions. Findings carry evidence strength, confidence, applicability, and
  verification status instead.
- **Context:** An unexplained score invites challenge ("why 62?") and cannot be
  defended empirically yet. The audit already shows an overallScore; it is
  deterministic and documented, but it is not the sales engine.
- **Alternatives:** Keep a weighted score with published weights (rejected:
  weights are not yet empirically validated); remove all scores (rejected: the
  existing deterministic website-quality score is honest and useful).
- **Reason:** Every number in a sales conversation must survive scrutiny.
- **Consequence:** Opportunities are ranked by state (strong/investigate) and
  confidence, never by invented points.
- **Revisit trigger:** After the 30-business validation produces real outcome
  data, a validated weighted score MAY be reconsidered.

## D-003: Modeled revenue is scenario arithmetic, never a forecast

- **Decision:** Deep Audit "modeled" figures are ranges derived from the
  business's OWN reported inputs, with assumptions attached, labeled as
  scenarios. ELION never states "you are losing ₦X/month" from public evidence.
- **Context:** Fabricated ROI is the fastest way to destroy trust and invites
  regulatory and reputational exposure.
- **Alternatives:** AI-generated ROI narratives (rejected: hallucination risk);
  no numbers at all (rejected: quantified scenarios are genuinely useful when
  honestly framed).
- **Reason:** Accuracy and honesty beat impressive-sounding claims.
- **Consequence:** All modeled output carries `assumptions` arrays in the API
  and must be shown with them in any UI.
- **Revisit trigger:** Only if real measured baselines exist per client
  (Outcome dataset, later phase).

## D-004: Consent states gate all outreach; public WhatsApp ≠ marketing consent

- **Decision:** `contact_permission` on leads defaults to `unknown`. Publicly
  discovered business contact info maps to `public_business_contact` at most.
  WhatsApp outreach requires `opted_in_whatsapp`. Opt-out/do-not-contact
  overrides every commercial state, including paid.
- **Context:** NDPA (Nigeria Data Protection Act 2023) and WhatsApp Business
  Messaging Policy both restrict unsolicited messaging; bulk-promoting to
  scraped numbers risks number blocking and legal exposure.
- **Alternatives:** Treat public contact as implied consent (rejected: against
  both NDPA guidance direction and WhatsApp policy); no consent tracking
  (rejected: outreach at scale without it is reckless).
- **Reason:** Compliance and deliverability. One blocked WhatsApp Business
  account costs more than slower outreach.
- **Consequence:** Next Best Action never suggests a blocked channel. Human
  review of NDPA specifics still required before any bulk outreach program.
- **Revisit trigger:** Professional legal review completed, or jurisdiction
  expansion.

## D-005: Remote rendering is threshold-gated, not built now

- **Decision:** Do not build a browser-rendering service this sprint. Build it
  only if rendering limitations materially degrade >10% of qualified audits or
  repeatedly hide commercially relevant evidence.
- **Context:** The pipeline already records `deepAnalysisAttempted/Succeeded`
  honestly. Vercel serverless has no Python; a remote renderer is real money
  and real operational surface.
- **Alternatives:** Build Cloudflare Browser Rendering now (rejected: cost
  before evidence of need); drop Scrapling (rejected: it works locally and is
  already integrated).
- **Reason:** The next constraint is commercial proof, not technical coverage.
- **Consequence:** JS-heavy sites may show `could_not_verify` categories; the
  harness (`scripts/validation-30.cjs`) measures exactly how often that happens.
- **Revisit trigger:** Harness shows render-need above the threshold.

## D-006: Pricing moves to configuration, single source

- **Decision:** All commercial numbers live in
  `src/lib/commercial/pricing-model.ts`. Public copy mirrors it; proposals and
  guardrails read from it.
- **Context:** Prices scattered across copy drift out of sync and cannot feed
  margin checks.
- **Alternatives:** DB-stored pricing (rejected: unnecessary operational surface
  for a 4-tier model; revisit if pricing becomes dynamic).
- **Reason:** Changing commercial assumptions = changing one file + a
  DECISION-LOG entry.
- **Consequence:** Pricing page and proposal tooling must stay in sync with the
  module; a mismatch is a bug.
- **Revisit trigger:** Dynamic/segmented pricing requirements appear.

## D-007: Founding Partner Pilot stays internal

- **Decision:** The ₦100k-minimum pilot exists in config but is never shown
  publicly unless the owner explicitly approves.
- **Context:** Anchor prices shape category perception; a discount tier visible
  to everyone undermines the ladder.
- **Reason:** Price integrity for the first 5 real reference customers.
- **Revisit trigger:** Owner decision, or pilot phase ends.
