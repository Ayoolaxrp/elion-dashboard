import { DocH2, DocP, DocLead, DocUL, Callout } from "./ui";
import type { DocCategory } from "./types";

export const automations: DocCategory = {
  slug: "automations",
  title: "Automations",
  description: "The reusable automation systems ELION provisions: Lead Response, Follow-Up, Booking and Revenue Recovery.",
  articles: [
    {
      slug: "lead-response",
      title: "WhatsApp Lead Response",
      description:
        "Respond to new enquiries immediately, qualify them and escalate when a human is needed.",
      keywords: ["lead response", "whatsapp", "instant response", "qualification", "leads", "speed to lead"],
      updated: "September 2026",
      toc: [
        { id: "what-it-does", title: "What it does" },
        { id: "who-its-for", title: "Who it's for" },
        { id: "what-elion-needs", title: "What ELION needs" },
        { id: "what-gets-configured", title: "What gets configured" },
        { id: "after-activation", title: "After activation" },
      ],
      body: (
        <>
          <DocLead>
            Lead Response makes sure a new enquiry gets an immediate, appropriate reply — and that nothing
            waits for a human to be free.
          </DocLead>

          <DocH2 id="what-it-does">What it does</DocH2>
          <DocP>
            When a lead arrives through a connected source, the system acknowledges the enquiry using your
            business context, collects the details you care about (such as interest, budget or preferred
            date), and follows your response rules — including outside business hours. Escalation rules decide
            when a human takes over, and a deterministic fallback keeps the lead handled even if AI is
            unavailable.
          </DocP>

          <DocH2 id="who-its-for">Who it's for</DocH2>
          <DocP>
            Businesses where speed matters — where a prospect who waits is a prospect lost. Typical examples
            include real estate, travel, education, healthcare and service businesses that receive enquiries
            through WhatsApp, websites or social channels.
          </DocP>

          <DocH2 id="what-elion-needs">What ELION needs</DocH2>
          <DocUL
            items={[
              <>a WhatsApp business account with valid provider credentials (for example Meta Cloud API),</>,
              <>your business information and industry context,</>,
              <>lead sources — which channels should feed the system, and</>,
              <>your response and escalation rules.</>,
            ]}
          />
          <DocP>
            If WhatsApp credentials are not yet configured, the automation reports{" "}
            <strong className="text-[var(--color-text-primary)]">waiting for credentials</strong> rather than
            pretending messages were sent.
          </DocP>

          <DocH2 id="what-gets-configured">What gets configured</DocH2>
          <DocUL
            items={[
              <><strong className="text-[var(--color-text-primary)]">Response rules</strong> — response mode, maximum response time and working hours.</>,
              <><strong className="text-[var(--color-text-primary)]">Outside-hours behaviour</strong> — how leads are handled when the business is closed.</>,
              <><strong className="text-[var(--color-text-primary)]">Qualification fields</strong> — what the system asks for (name, phone, interest, budget, location…).</>,
              <><strong className="text-[var(--color-text-primary)]">Escalation</strong> — when a human should take over and their WhatsApp number.</>,
              <><strong className="text-[var(--color-text-primary)]">Follow-up cadence</strong> — if follow-up was purchased, when subsequent touches happen.</>,
            ]}
          />

          <DocH2 id="after-activation">After activation</DocH2>
          <DocP>
            Every lead is stored, and each execution is logged with its real outcome — received, responded or
            failed. Your dashboard shows leads handled, response status and automation health. Delivery is
            only ever reported as sent when the channel confirms it.
          </DocP>
        </>
      ),
    },
    {
      slug: "follow-up",
      title: "Follow-Up System",
      description:
        "Keep prospects moving after the first conversation — without relying on anyone's memory.",
      keywords: ["follow up", "follow-up", "sequences", "nurture", "lead follow up", "cadence", "reminders"],
      updated: "September 2026",
      toc: [
        { id: "what-it-does", title: "What it does" },
        { id: "who-its-for", title: "Who it's for" },
        { id: "what-gets-configured", title: "What gets configured" },
        { id: "after-activation", title: "After activation" },
      ],
      body: (
        <>
          <DocLead>
            Follow-Up turns one conversation into a sequence — so prospects who are not ready to buy today are
            not simply forgotten.
          </DocLead>

          <DocH2 id="what-it-does">What it does</DocH2>
          <DocP>
            When a lead goes quiet, the system schedules the follow-up touches your business configured (for
            example after one day, three days, seven days). Each message is context-aware and stops the
            moment the prospect responds or a human takes over.
          </DocP>

          <DocH2 id="who-its-for">Who it's for</DocH2>
          <DocP>
            Any business whose sales cycle spans more than one conversation — where most revenue comes from
            leads that were contacted more than once.
          </DocP>

          <DocH2 id="what-gets-configured">What gets configured</DocH2>
          <DocUL
            items={[
              <><strong className="text-[var(--color-text-primary)]">Cadence</strong> — the timing of follow-up touches (not hardcoded; your business sets it).</>,
              <><strong className="text-[var(--color-text-primary)]">Channel</strong> — WhatsApp, email or the channels you connected.</>,
              <><strong className="text-[var(--color-text-primary)]">Stop conditions</strong> — reply received, booked, or marked by your team.</>,
              <><strong className="text-[var(--color-text-primary)]">Handoff</strong> — when a follow-up turns into a human conversation.</>,
            ]}
          />

          <DocH2 id="after-activation">After activation</DocH2>
          <DocP>
            The dashboard records every follow-up triggered and every reply received. You see real follow-up
            activity per lead — nothing simulated.
          </DocP>
        </>
      ),
    },
    {
      slug: "booking-automation",
      title: "Booking Automation",
      description:
        "Let prospects book a real time on your calendar — with Google Meet generated when configured.",
      keywords: ["booking", "appointments", "scheduling", "google calendar", "google meet", "availability", "no-show"],
      updated: "September 2026",
      toc: [
        { id: "what-it-does", title: "What it does" },
        { id: "who-its-for", title: "Who it's for" },
        { id: "what-elion-needs", title: "What ELION needs" },
        { id: "double-booking", title: "Double-booking protection" },
        { id: "after-activation", title: "After activation" },
      ],
      body: (
        <>
          <DocLead>
            Booking Automation turns an enquiry into a scheduled appointment — checking real calendar
            availability, creating the event and confirming it.
          </DocLead>

          <DocH2 id="what-it-does">What it does</DocH2>
          <DocP>
            A visitor sees the times that are genuinely free on the connected calendar (respecting your
            working hours, meeting duration, buffer, minimum notice and booking window), selects one, and
            ELION creates a real Google Calendar event — with a Google Meet conference link when enabled — and
            stores the booking.
          </DocP>

          <DocH2 id="who-its-for">Who it's for</DocH2>
          <DocP>
            Businesses that book calls, consultations or appointments and want the scheduling step to be
            self-service — no back-and-forth messages to find a time.
          </DocP>

          <DocH2 id="what-elion-needs">What ELION needs</DocH2>
          <DocUL
            items={[
              <>a connected Google Calendar (via OAuth, server-side credentials),</>,
              <>booking rules — duration, buffer, working hours, timezone, minimum notice and booking window, and</>,
              <>a booking page or entry point where prospects choose a time.</>,
            ]}
          />

          <DocH2 id="double-booking">Double-booking protection</DocH2>
          <DocP>
            The slot is re-checked before the event is created, and only one active booking can hold a slot.
            If two visitors request the same time, one succeeds and the other cleanly fails. If the calendar
            API fails, no booking is recorded as confirmed — ELION never shows success it cannot prove.
          </DocP>

          <DocH2 id="after-activation">After activation</DocH2>
          <DocP>
            Bookings appear with their real status — confirmed, cancelled, rescheduled or completed — with the
            customer, time, timezone and Meet link. Cancelling or rescheduling updates the calendar event and
            the ELION record together.
          </DocP>
        </>
      ),
    },
    {
      slug: "revenue-recovery",
      title: "Revenue Recovery",
      description:
        "Recover opportunities that would otherwise disappear — cold leads, abandoned bookings and dormant customers.",
      keywords: ["revenue recovery", "recovery", "abandoned leads", "reactivation", "cold leads", "dormant", "win-back"],
      updated: "September 2026",
      toc: [
        { id: "what-it-does", title: "What it does" },
        { id: "who-its-for", title: "Who it's for" },
        { id: "what-gets-configured", title: "What gets configured" },
        { id: "after-activation", title: "After activation" },
      ],
      body: (
        <>
          <DocLead>
            Revenue Recovery finds the value your business already earned once — leads that went cold,
            bookings that were abandoned, customers who stopped coming back.
          </DocLead>

          <DocH2 id="what-it-does">What it does</DocH2>
          <DocP>
            The system identifies dormant opportunities using your criteria and re-engages them through your
            configured channels with appropriate, non-pushy messaging. When a customer responds, the
            conversation is handled by your follow-up or sales systems — or handed to a human.
          </DocP>

          <DocH2 id="who-its-for">Who it's for</DocH2>
          <DocP>
            Businesses with existing enquiry or customer history — where re-engaging the past is cheaper and
            faster than acquiring brand new.
          </DocP>

          <DocH2 id="what-gets-configured">What gets configured</DocH2>
          <DocUL
            items={[
              <><strong className="text-[var(--color-text-primary)]">Recovery criteria</strong> — which leads or customers count as dormant (age, last activity).</>,
              <><strong className="text-[var(--color-text-primary)]">Channel and message</strong> — WhatsApp, email or both, with approved copy.</>,
              <><strong className="text-[var(--color-text-primary)]">Cadence</strong> — how many touches and when.</>,
              <><strong className="text-[var(--color-text-primary)]">Stop and handoff rules</strong> — what ends the sequence.</>,
            ]}
          />

          <DocH2 id="after-activation">After activation</DocH2>
          <DocP>
            Each recovery attempt and every response is recorded. The dashboard reports real recoveries —
            conversations re-opened, bookings made — without inventing revenue figures.
          </DocP>
          <Callout variant="info" title="Related reading">
            Recovery often pairs with <a className="underline underline-offset-2" href="/docs/automations/follow-up">Follow-Up</a> and{" "}
            <a className="underline underline-offset-2" href="/docs/automations/booking-automation">Booking Automation</a> to
            turn a re-engaged lead into an appointment.
          </Callout>
        </>
      ),
    },
  ],
};
