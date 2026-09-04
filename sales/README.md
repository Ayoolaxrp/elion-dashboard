# ELION — Sales Operating Layer (Batch 1 · Lagos Real Estate)

Objective: 20 prospects → 20 personalized contacts → 5+ replies → 3+
conversations → 2+ demos → 1–3 proposals → **1 paying client** (Growth,
₦350,000, Lead Response + Follow-Up + Booking).

## What's in this folder

| File | Purpose |
|---|---|
| `prospect-pipeline.csv` | The 20-prospect tracker — stage, next action, last contact, observed channel. Update after every touch. |
| `outreach-briefs.md` | Per-prospect briefs #1–20: leak, evidence, opener, follow-up, tier. |
| `research/findings.md` | Deep-research digest (Scrapling) — observed emails/phones/socials/site state per prospect. |
| `research/*.json` | Raw per-site deep research (evidence provenance: `fetcher_used` = http/stealth Scrapling, or node-fallback). |
| `message-templates.md` | 7 reusable, evidence-safe outreach templates. |
| `demo-script.md` | 5-minute screen-share demo flow. |
| `../templates/prospect-batch-1-lagos-real-estate.md` | Batch doc (scoring, tiering, angles). |
| `../templates/client-measurement-framework.md` | Before → ELION → After capture for client #1. |

## The funnel you are operating

**Audit (wedge)** → personalized contact with THEIR finding → conversation
→ demo (their audit + the fix) → proposal (from their audit) → contract →
invoice → payment (manual Opay) → client → onboarding → provisioning → LIVE.

Every downstream step is built and admin-operable on real tables. Your job
is the middle: turning the 20 audits into conversations.

## Experiment scoreboard (targets)

| Metric | Target |
|---|---|
| Prospects / audited | 20 / 20 ✅ |
| Decision makers contacted | 20 |
| Replies | 5+ |
| Conversations | 3+ |
| Demos | 2+ |
| Proposals | 1–3 |
| Paying clients | 1+ |
| Revenue | ₦350,000+ |

Diagnose the funnel, don't guess:
- 0 replies → fix targeting/message/channel.
- Replies, no conversations → fix positioning/CTA.
- Conversations, no demos → trust/clarity/offer.
- Demos, no proposals → qualification/perceived value.
- Proposals, no payment → price/trust/scope/urgency/decision-maker access.

## Re-running deep research (Scrapling)

New prospects or a refresh pass:

```bash
pip install scrapling        # python >= 3.9 (already installed on dev box)
python scripts/scrape.py https://example.com      # single site test
node scripts/deep-research-prospects.cjs --max 6  # batch (resume-safe)
```

- `scripts/scrape.py` — Scrapling deep fetch: HTTP fetcher first; falls back
  to `StealthyFetcher` (headless Chrome) on block/TLS failure. Output is
  single-line JSON on stdout.
- `scripts/deep-research-prospects.cjs` — runs scrape.py across
  `sales/prospect-pipeline.csv`, stores `sales/research/<id>.json`, and
  rebuilds `summary.json` + `findings.md`. `--all` re-fetches; `--max N`
  bounds each run.
- Fetcher provenance is explicit (`fetcher_used`), and `node-fallback`
  rows are plain-fetch evidence, never passed off as Scrapling output.
- Evidence rules: only directly observed facts enter outreach. Never
  invent contact info; every phone/email above came from the prospect's own
  public site.

## Manual steps before onboarding client #1

1. **Resend sender domain** — verify `elion.com.ng` as the sending domain
   (DNS records in Resend dashboard: SPF/DKIM; then send a test to a
   non-owner address). Until done, onboarding email only reliably reaches
   the account owner's verified address.
2. No other engineering blockers — do not open the roadmap for features.

## First-client measurement

Before implementation, record baseline (enquiries/week, first-response
time, follow-up coverage, booked viewings, abandoned enquiries, manual
workload). After launch, measure the same list. That produces the first
real case study — the strongest future proof on the site.
