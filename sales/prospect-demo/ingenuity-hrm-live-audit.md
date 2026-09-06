# ELION Live Audit — Demonstration Brief

**Business analyzed:** Ingenuity HR Solutions — recruitment / human-resource services
**Website:** https://ingenuityhrm.com
**Audit date:** 2026-09-06 (live run, real public website)
**Source of every statement below:** output of ELION's live audit engine against the public site. "Observed" = found in the fetched page; "Inferred" = reasonable reading of what was observed; "Recommended" = what ELION would implement. No traffic, revenue, or pipeline numbers were available to us, so none are claimed.

---

## 1. We analyzed this business

ELION fetched the live site and verified these public facts:

- Website opens as *"Ingenuity HR Solutions — Enabling & Enhancing Human Capital Capabilities"*.
- Business type is clear from the site: **recruitment / HR services**.
- **Observed:** WhatsApp contact path on the site (wa.me link).
- **Observed:** Contact details present — phone **+234 802 315 4451** and email **info@ingenuityhrm.com**.
- **Observed:** Links to 4 social profiles (Instagram, Facebook, Twitter/X, LinkedIn).
- **Observed:** Modern website stack (Next.js / React) and strong technical presence (site scores 89/100 on the digital-presence signals ELION checks).

Digital Operations Score: **62 / 100**

| Area | Score | Reading |
|---|---|---|
| Digital presence | 89 | Strong — site is modern and findable |
| Scheduling | 75 | Some scheduling signals present |
| Reporting | 30 | Inferred gap — no visible CRM/automation layer |
| Lead response | 23 | Inferred gap — no visible automated response step |
| Follow-up | 18 | Inferred gap — no visible follow-up automation |
| Reactivation | 20 | Inferred gap — no visible re-engagement system |

---

## 2. Here's what ELION found — the operational gap

**Primary gap — follow-up and lead/candidate management (high priority, inferred):**
The site invites enquiries (WhatsApp + email + forms) but ELION found **no CRM or follow-up automation layer** (no HubSpot, Salesforce, Pipedrive, Zoho, or similar detectable). For a recruitment business, that means:

- Candidate applications and client enquiries likely arrive into manual inboxes/WhatsApp chats.
- Acknowledgement, shortlisting, interview scheduling and follow-up depend on people remembering — the exact workflow that quietly leaks when volume grows.
- Nothing is measured (time-to-acknowledge, response rate, follow-up coverage), so the gap compounds invisibly.

**Secondary gap — instant response surface (medium, observed absence):**
No live chat or AI assistant was detected on the site. Public research ELION cites (Zendesk 2025) finds most consumers expect an immediate response to an enquiry; with no automated layer, after-hours candidate or client messages wait.

**What ELION did NOT claim:** no lost-candidate counts, no revenue loss, no response-time statistics, no conversion figures. Those cannot be measured from a public website and no such number appears here.

---

## 3. Here's the automation we'd implement

For a recruitment / HR firm, the recommendation maps to systems ELION builds from reusable templates:

1. **Lead Response Engine (candidate + client intake)** — instant acknowledgement of every enquiry across WhatsApp, website forms and email; capture name, role interest, and source into one pipeline.
2. **Follow-Up System** — scheduled, multi-touch sequences for candidates after application and for clients after enquiry; automatic escalation when nothing happens.
3. **Interview / Viewing-style scheduling automation** — calendar-linked booking for screening calls and interviews, with reminders.
4. **Candidate & Client Reporting** — an operations view of pipeline activity (time-to-acknowledge, follow-up coverage, interviews booked) so the business is measuring instead of guessing.
5. **AI Receptionist (optional layer)** — instant answers to repeat questions (services, process, locations) on the site, with human handoff when it matters.

**Fit with the offer:** the findings support the **Growth package (₦350,000)** — lead response + follow-up + booking in one pipeline — which is precisely the intake-to-follow-up flow recruitment businesses run on. (Scale would add reporting/recovery depth later.)

---

## 4. Why this brief is trustworthy

- Every "observed" line is a fact from the live site, reproducible on screen.
- Every "inferred" line is labelled as an inference from what was observed.
- Benchmarks are labelled as benchmarks to confirm, not measured losses.
- No fabricated statistics, no fake testimonials, no invented client results.

**Note on live copy (updated 2026-09-06):** the honesty pass that rewords over-strong sentences (benchmarks labelled as benchmarks, reachability-aware WhatsApp/booking findings, Observed/Inferred/Estimated chips) is deployed to production as of commit `0261e05`. Re-running this audit on elion.com.ng/audit now shows screen output consistent with this brief.
