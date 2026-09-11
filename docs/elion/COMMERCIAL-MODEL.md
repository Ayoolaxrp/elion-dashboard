# ELION COMMERCIAL MODEL

**Holds market/pricing/economics assumptions. Update when competitors, pricing, or unit economics change.**
Research date-stamped: 2026-09-09. Re-verify competitor pricing quarterly.

---

## 1. Pricing Ladder (canonical)

Configured in `src/lib/commercial/pricing-model.ts` (machine-readable) and
mirrored on the public pricing page (customer-facing).

| Tier | Implementation | ELION Care | Scope | Direct-cost ceiling (impl) | Direct-cost ceiling (recurring) |
|---|---|---|---|---|---|
| Recovery Sprint | from ₦150,000 | ₦50,000/mo | 1 workflow/problem | ₦60,000 | ₦15,000/mo |
| Growth System | from ₦350,000 | ₦100,000/mo | 2-4 connected workflows | ₦140,000 | ₦30,000/mo |
| Scale System | from ₦750,000 | ₦200,000/mo | 5+ / custom integrations | ₦300,000 | ₦60,000/mo |
| Custom | quoted | quoted | per discovery | computed at quote time | computed at quote time |

Margin targets: **implementation ≥60%** contribution margin, **recurring ≥70%**.
`checkQuoteMargin()` enforces these. Failing quotes must NOT be silently
accepted: reduce scope, move tier, quote custom, or improve reusability.

### Build + Handover
1.4-1.6× normal implementation. Includes documentation, handover, 30-day
defect warranty. Excludes monitoring/optimisation/hosting/SLA. Never priced
below the managed-service equivalent.

### Annual pricing
Max 10% discount on BASE recurring fee only. Never discount variable usage.
Configurable; protects margin against FX and infrastructure inflation.

### Founding Partner Pilot (INTERNAL ONLY, never public by default)
₦100,000 implementation minimum, max 5 qualified customers, one templated
problem, strict scope, measured pilot, normal expansion pricing.

## 2. Usage / Overage Model

Third-party variable usage (WhatsApp/SMS/email/AI/voice/CRM seats/n8n/storage/
enrichment APIs) is NEVER unlimited inside a fixed fee:
- ₦15,000/month third-party usage allowance included at Care floor
- Above allowance: pass-through at provider cost + 20% handling, billed with
  next Care invoice or prepaid wallet
- USD-denominated services reviewed quarterly for FX movement

## 3. Cash-Flow Rules

- Sprint/Growth: 70% before implementation, 30% before go-live. Scale: 50/30/20.
- First ELION Care month prepaid.
- No provisioning of paid third-party infrastructure before kickoff cash clears.
- Sales commission on **collected cleared cash**, not signed proposals.
- No production activation with material overdue implementation balances.
- Large Nigerian invoices: bank transfer / virtual account preferred; cards retained.

## 4. Competitor Research (dated 2026-09-09)

Sources checked: vendor pricing pages and Nigerian agency public pages.
**Caveat: prices change; re-verify before using in sales conversations. Do not
read competitor claims as verified facts.**

### Global WhatsApp-first platforms (USD, per-agent or conversation pricing)

| Vendor | Model | Entry price point | Notes |
|---|---|---|---|
| WATI | SaaS platform | ~$49-99/agent/mo (growth tiers) + conversation fees | Self-serve; WhatsApp BSP margins stack |
| Respond.io | SaaS platform | ~$79-99/user/mo published range | Positioning: conversation management |
| HubSpot | CRM suite | Free CRM; Starter ~$15-20/seat/mo (promo structures vary) | CRM+marketing bundle; costs scale with seats |
| Zoho | CRM suite | Standard ~$14-20/user/mo billed annually | Broad suite; local partner ecosystem in NG |

### Nigerian market (agency-implemented systems, NGN)

| Player | Observed positioning | Price signal | Notes |
|---|---|---|---|
| Forge Growth | Business automation/CRM implementation | NGN setup + monthly, exact figures not stably published | Direct competitor space |
| PhiXtra | WhatsApp automation agency | Quote-based | Similar wedge (WhatsApp-first) |
| Zana / Siteti / HelloGrowthCRM / Eaglescroft / MetroHyp | Local automation/CRM agencies | Quote-based; several advertise "from ₦" landing prices | Verify individually at sales time |
| Unofficial n8n/freelancer layer | Custom builds | ₦80k-₦500k one-off typical advertised range | Competes on price, not on audit/verification |

**ELION differentiation vs this field:** verified public evidence (audit) before
the pitch, honest verification states, applicability engine (does not pitch
irrelevant tech), scoped Care with usage transparency, margin-guarded delivery.
Most competitors sell a tool; ELION sells a diagnosed, measured intervention.

**Pricing rationale:** ELION sits ABOVE the freelancer layer (justified by
audit + delivery + Care) and BELOW annualised foreign SaaS for SMBs that want
done-for-you (a 5-agent WATI deployment at ~$50/agent/mo ≈ ₦3.7m+/yr plus
setup, versus Growth System ₦350k + ₦1.2m/yr Care with local delivery).

## 5. Unit Economics Assumptions

- Labour shadow rate default: **₦5,000/hour** (founder input; review quarterly).
- Contingency default: 10% of direct costs.
- Included usage allowance: ₦15,000/mo (see §2).
- CAC / payback: to be measured from the validation harness + CRM data.
  **Not estimated on paper. Measured or left blank.**

## 6. Validation and financial operating dashboard (specified, lean)

Pre-PMF operating model: founder + one core operator/salesperson + bounded AI workflows + targeted contractors. Do not expand headcount or lower pricing because the system feels busy; first measure repeated paying clients, repeated problems sold, healthy margins, Care retention, delivery time, referrals and objection patterns.

The current machine validation result is a reliability signal, not a sales
claim: the latest 30-site run completed 9/30 because 21 inputs were
DNS/network/HTTP-blocked. The cohort must be rebuilt with independently
verified active Nigerian websites before completion-rate or opportunity-quality
benchmarks are used commercially. Human fields remain blank until real
conversations occur.

Rejection reasons are standardized as: no budget, price too high, no urgency,
already solved, wrong problem, wrong decision maker, no trust, recurring fee
objection, n8n/vendor-cost objection, timing, not interested, other.

Track in admin analytics as data accumulates; do not build decorative charts
without data:

- ACQUISITION: prospects, audits run, qualified leads, conversations, calls
- SALES: proposals, win rate, avg implementation price, sales cycle
- CASH: invoices issued, cash collected, outstanding receivables, runway
- REVENUE: implementation revenue, MRR, ARR, expansion
- ECONOMICS: direct delivery cost, contribution margin, contractor cost, third-party usage, CAC, CAC payback
- DELIVERY: implementation hours, time-to-live, support hours/client, incidents
- RETENTION: active clients, churn, expansions, downgrades

## 7. Product catalogue commercial contract

The deploy catalogue in `src/lib/products.ts` now pairs each product configuration schema with a commercial contract: customer problem, ideal customer, implementation scope, setup/Care prices, provider-cost assumptions, usage model, margin basis, provisioning checklist, client requirements and entitlement rule. The catalog is not a promise that every product is currently live; `activation_status` remains explicit and required infrastructure is checked separately.

Current commercial rule: provider and usage costs are not unlimited inside Care. Client-owned production vendor accounts remain client costs by default; ELION-paid infrastructure must be represented in the quote and vendor-cost register. Bespoke industry-specific software or dashboards are separately scoped as Custom Business System work.

## 8. Provider-neutral prospecting economics

Early discovery deliberately uses manual/CSV/API import at zero provider cost. `/admin/prospecting` performs source attribution, domain deduplication, DNS/SSRF-safe preflight, HTML and basic business-identity checks before candidates can be treated as audit-ready. The target operating funnel is an internal goal: 100 imported candidates → 30 valid audits → 10 founder-led conversations → first customer. It is not a forecast or an achieved result.

Paid Google Places, SerpAPI and enterprise lead sources are deferred until the zero-cost process demonstrates that the added provider cost improves qualified pipeline quality. Record provider fees, quota/budget limits and retained fields before enabling one.

## 9. Client portal and custom-system boundary

The standard delivery includes one reusable client portal for implementation status, automations, health, measured activity, vendor/access requests, documents, invoices and Care/support. It does not expose ELION margins, internal CRM notes, other clients or raw credentials. An industry-specific operational application or bespoke dashboard is a separate **Custom Business System** opportunity and must be separately scoped and margin-checked; it is not included in Recovery Sprint, Growth System or Scale System by implication.

Verified Kora payment is the gate for paid onboarding. Payment redirects alone never create access. Client organization/membership activation must remain idempotent on provider replay and tenant-scoped.

## 10. Commercial reality gate

The current catalogue and audit-to-sales foundations are sufficient for a controlled founder-led pilot; they are not evidence of market domination, customer outcomes or product-market fit. The next milestone is one Nigerian business acquired, paid, onboarded, deployed and measured.

The first reference offer remains Lead Response, followed by Follow-Up and Booking only when a customer's confirmed workflow requires them. AI Receptionist, broad AI Sales Agent behavior, Customer Support AI and bespoke Business Automation Systems remain scoped products, not promises of autonomous capability. Every proposal still requires a direct-cost estimate and margin check before acceptance.

The provider-neutral discovery path is intentionally zero-cost: an authorized operator imports a CSV/API batch, the system normalizes and deduplicates domains, performs SSRF-safe DNS/HTTP/HTML/identity preflight, and holds candidates in a human-review queue. The internal target is 100 candidates → 30 valid audits → 10 conversations → first customer; none of those numbers is an achieved result. Google Places, SerpAPI, automatic outbound and broad SEO landing-page expansion are deferred until this manual process demonstrates repeatable quality and commercial value.

The standard client experience is the existing reusable multi-tenant portal. A bespoke industry dashboard or application is separately scoped as Custom Business System work and is not included by implication in a standard package. Client-owned production n8n and vendor accounts remain the default; ELION internal infrastructure costs must be recorded separately from client-direct costs.

## 11. First-customer validation surfaces

The reusable `/demo` surface contains a clearly labelled simulated Lagos real-estate Lead Response scenario. It demonstrates a sample knowledge base/listings, FAQs, qualification flow, CRM capture, follow-up and handoff to a human property consultant. It is not a customer case study and sends no real messages.

The founder dashboard's validation section reads six operational counters from existing records: businesses reviewed (leads with an audit attempt), audits completed, qualified opportunities (commercial lead stages), conversations started (distinct leads with conversation activity), proposals sent (sent/viewed/accepted) and customers won (active/completed clients). These definitions are intentionally conservative and do not infer owner confirmation or commercial success.

## 12. Tax / Accounting (requires professional confirmation)

Accounting/reporting must distinguish: cash collected vs revenue; VAT where
applicable; client pass-through funds; third-party costs; MRR; receivables;
refunds. **No tax conclusions are hard-coded into pricing.** Nigeria VAT and
NDPA obligations are to be confirmed with an accountant/adviser before
invoicing changes. This remains an open item, not a resolved legal or tax
conclusion.
