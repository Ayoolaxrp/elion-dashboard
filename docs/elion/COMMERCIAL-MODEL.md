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

## 6. Financial Operating Dashboard (specified, lean)

Track (in admin analytics as data accumulates; do not build decorative charts
without data):

- ACQUISITION: prospects, audits run, qualified leads, conversations, calls
- SALES: proposals, win rate, avg implementation price, sales cycle
- CASH: invoices issued, cash collected, outstanding receivables, runway
- REVENUE: implementation revenue, MRR, ARR, expansion
- ECONOMICS: direct delivery cost, contribution margin, contractor cost, third-party usage, CAC, CAC payback
- DELIVERY: implementation hours, time-to-live, support hours/client, incidents
- RETENTION: active clients, churn, expansions, downgrades

## 7. Tax / Accounting (requires professional confirmation)

Accounting/reporting must distinguish: cash collected vs revenue; VAT where
applicable; client pass-through funds; third-party costs; MRR; receivables;
refunds. **No tax conclusions are hard-coded into pricing.** Nigeria VAT and
NDPA obligations to be confirmed with an accountant/adviser before invoicing
changes. Documented as an open item, not resolved here.
