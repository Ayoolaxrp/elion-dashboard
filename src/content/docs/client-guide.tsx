import { DocH2, DocP, DocLead, DocUL, DocOL, Callout, InlineCode } from "./ui";
import type { DocCategory } from "./types";

export const clientGuide: DocCategory = {
  slug: "client-guide",
  title: "Client Guide",
  description: "Onboarding, connecting calendars, and the AI Receptionist and AI Sales Agent products.",
  articles: [
    {
      slug: "client-onboarding",
      title: "Client Onboarding",
      description:
        "What happens after you purchase: from business details and automation selection through configuration, integrations, testing and activation.",
      keywords: ["onboarding", "kickoff", "activation", "stages", "what happens next", "provisioning", "configuration"],
      updated: "September 2026",
      toc: [
        { id: "the-journey", title: "The journey" },
        { id: "what-you-configure", title: "What you configure" },
        { id: "readiness", title: "Readiness and activation" },
        { id: "timeline", title: "What to expect" },
      ],
      body: (
        <>
          <DocLead>
            Onboarding turns what you purchased into a working system. You only configure what you actually
            bought — never a generic list of every ELION feature.
          </DocLead>

          <DocH2 id="the-journey">The journey</DocH2>
          <DocOL
            items={[
              <>
                <strong className="text-[var(--color-text-primary)]">Business details</strong> — core
                information such as business name, industry, timezone and currency.
              </>,
              <>
                <strong className="text-[var(--color-text-primary)]">Automation selection</strong> — the
                products in your scope (for example WhatsApp Lead Response, AI Receptionist, Booking
                Automation).
              </>,
              <>
                <strong className="text-[var(--color-text-primary)]">Configuration</strong> — ELION shows only
                the configuration required by the systems you selected.
              </>,
              <>
                <strong className="text-[var(--color-text-primary)]">Integrations</strong> — required
                connections such as WhatsApp or Google Calendar are identified and connected.
              </>,
              <>
                <strong className="text-[var(--color-text-primary)]">Testing</strong> — a provisioned system
                is tested before it can go live.
              </>,
              <>
                <strong className="text-[var(--color-text-primary)]">Activation</strong> — the system becomes
                live and visible in your dashboard.
              </>,
            ]}
          />

          <DocH2 id="what-you-configure">What you configure</DocH2>
          <DocP>Configuration is scoped to your purchased systems. Examples:</DocP>
          <DocUL
            items={[
              <>
                <strong className="text-[var(--color-text-primary)]">WhatsApp Lead Response</strong> — your
                WhatsApp business number, business hours, response rules, lead-qualification fields and
                escalation contacts.
              </>,
              <>
                <strong className="text-[var(--color-text-primary)]">AI Receptionist</strong> — business
                knowledge, personality, capabilities and guardrails.
              </>,
              <>
                <strong className="text-[var(--color-text-primary)]">Booking</strong> — calendar connection,
                working hours, meeting duration and buffers.
              </>,
            ]}
          />
          <DocP>
            The same configuration is available on your onboarding page and is merged into the automation that
            ELION provisions — what you enter is what the live system runs on.
          </DocP>

          <DocH2 id="readiness">Readiness and activation</DocH2>
          <DocP>
            A system can only be activated when everything it needs exists: an entitlement, valid
            configuration, required credentials, a healthy provider connection and a successful test. Until
            then its status is honest about what is missing:
          </DocP>
          <DocUL
            items={[
              <><InlineCode>Pending</InlineCode> — not yet configured or provisioned,</>,
              <><InlineCode>Waiting for credentials</InlineCode> — a required provider key is missing,</>,
              <><InlineCode>Testing</InlineCode> — provisioned and being validated,</>,
              <><InlineCode>Live</InlineCode> — only after every gate has passed.</>,
            ]}
          />
          <Callout variant="info" title="Truthful status">
            ELION never reports a system as live, or a message as sent, unless it actually is. Missing
            credentials and unconnected providers are shown clearly instead.
          </Callout>

          <DocH2 id="timeline">What to expect</DocH2>
          <DocP>
            After payment is verified, an onboarding record is created with clear stages (Welcome, Kickoff,
            Business Information, Configuration, Approval, Build, Testing, Launch, Handover). You can follow
            progress on your onboarding page and in your client dashboard, and your ELION contact coordinates
            the kickoff and handover.
          </DocP>
        </>
      ),
    },
    {
      slug: "connecting-google-calendar",
      title: "Connecting Google Calendar",
      description:
        "How booking availability works with Google Calendar and Google Meet, and what must be connected before bookings go live.",
      keywords: ["google calendar", "google meet", "booking", "availability", "connect calendar", "oauth", "calendar"],
      updated: "September 2026",
      toc: [
        { id: "how-it-works", title: "How it works" },
        { id: "who-connects", title: "Who connects the calendar" },
        { id: "availability", title: "How availability is calculated" },
        { id: "what-you-see", title: "What happens after a booking" },
      ],
      body: (
        <>
          <DocLead>
            When a Booking Automation is part of your scope, ELION reads real availability from a connected
            Google Calendar and creates real events — with a Google Meet conference when configured.
          </DocLead>

          <DocH2 id="how-it-works">How it works</DocH2>
          <DocOL
            items={[
              <>The calendar is connected through Google's OAuth flow. Credentials stay server-side.</>,
              <>ELION checks the calendar's real busy/free periods to show available times.</>,
              <>A visitor selects an available slot and enters their details.</>,
              <>ELION re-checks the slot and creates the Google Calendar event.</>,
              <>A Google Meet link is generated with the event when enabled.</>,
              <>The booking is stored and a confirmation is sent to the customer.</>,
            ]}
          />
          <DocP>
            ELION never shows a booking as confirmed unless the calendar event was actually created, and never
            invents a Meet link. If the calendar is unavailable, the booking page says so.
          </DocP>

          <DocH2 id="who-connects">Who connects the calendar</DocH2>
          <DocUL
            items={[
              <>
                <strong className="text-[var(--color-text-primary)]">ELION's own calendar</strong> powers
                strategy calls booked from the public booking page.
              </>,
              <>
                <strong className="text-[var(--color-text-primary)]">Your calendar</strong> powers bookings for
                your own Booking Automation. An ELION administrator connects it from the admin console using
                the Google account that should own the events.
              </>,
            ]}
          />
          <Callout variant="info" title="Not connected?">
            Until a calendar is connected the status shows <InlineCode>Calendar not connected</InlineCode> and
            no availability is displayed or fabricated.
          </Callout>

          <DocH2 id="availability">How availability is calculated</DocH2>
          <DocP>Available times respect your configured rules:</DocP>
          <DocUL
            items={[
              <>working hours and timezone,</>,
              <>meeting duration and buffer between meetings,</>,
              <>busy periods already on the connected calendar,</>,
              <>minimum notice and the maximum booking window.</>,
            ]}
          />
          <DocP>
            Two visitors can never book the same slot: the slot is re-checked and reserved before the event is
            created, and duplicate bookings are rejected.
          </DocP>

          <DocH2 id="what-you-see">What happens after a booking</DocH2>
          <DocP>
            The booking appears in the ELION admin console and, where relevant, in the client dashboard —
            with date, time, timezone, customer, status and the Google Meet link. Cancellations and
            reschedules update both the calendar event and the ELION record.
          </DocP>
        </>
      ),
    },
    {
      slug: "ai-receptionist",
      title: "AI Receptionist",
      description:
        "A virtual receptionist that answers questions, collects information and escalates — configured with your business knowledge and guardrails.",
      keywords: ["ai receptionist", "receptionist", "virtual assistant", "guardrails", "faq", "escalation", "business knowledge"],
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
            The AI Receptionist handles inbound communication — answering common questions, collecting
            customer details and escalating to a human when it should.
          </DocLead>

          <DocH2 id="what-it-does">What it does</DocH2>
          <DocP>
            The receptionist can be enabled to answer questions about your services and opening hours, explain
            what you offer, qualify an enquiry, collect customer information, route to booking, and hand over
            to a human. It only performs the capabilities your business actually enables — it never invents
            capabilities.
          </DocP>
          <Callout variant="warn" title="Guardrails matter">
            A receptionist must never invent business information. When it does not know something, it says so
            and offers to connect the customer with someone who can help.
          </Callout>

          <DocH2 id="who-its-for">Who it's for</DocH2>
          <DocP>
            Businesses that receive a steady flow of repeat questions — enquiries about hours, location,
            services, pricing or availability — and want every enquiry handled consistently, including outside
            working hours.
          </DocP>

          <DocH2 id="what-elion-needs">What ELION needs</DocH2>
          <DocUL
            items={[
              <>an AI model provider configured for the client,</>,
              <>a channel — WhatsApp or another enabled conversation channel — with valid credentials,</>,
              <>a calendar connection if booking is enabled, and</>,
              <>your completed business knowledge and guardrails.</>,
            ]}
          />
          <DocP>
            If a required provider is not connected, the automation stays in a pending state and the dashboard
            says exactly what is missing.
          </DocP>

          <DocH2 id="what-gets-configured">What gets configured</DocH2>
          <DocUL
            items={[
              <>
                <strong className="text-[var(--color-text-primary)]">Business knowledge</strong> — business
                description, services, pricing, FAQs, policies, location and opening hours.
              </>,
              <>
                <strong className="text-[var(--color-text-primary)]">Personality</strong> — professional,
                friendly, concise or your own instruction for how it communicates.
              </>,
              <>
                <strong className="text-[var(--color-text-primary)]">Capabilities</strong> — answer FAQs,
                explain services, provide pricing, qualify leads, collect information, book appointments,
                escalate.
              </>,
              <>
                <strong className="text-[var(--color-text-primary)]">Guardrails</strong> — topics it must not
                answer, claims it must not make, and when to escalate.
              </>,
              <>
                <strong className="text-[var(--color-text-primary)]">Human handoff</strong> — the contact
                details and conditions for transferring to a person.
              </>,
            ]}
          />

          <DocH2 id="after-activation">After activation</DocH2>
          <DocP>
            Conversations and escalations are recorded as real activity. The dashboard shows what the
            receptionist handled, what it escalated and any failed interactions — never fabricated numbers.
            You can adjust its knowledge and guardrails as your business changes.
          </DocP>
        </>
      ),
    },
    {
      slug: "ai-sales-agent",
      title: "AI Sales Agent",
      description:
        "An agent that qualifies opportunities, recommends services within approved limits, follows up and escalates high-value leads.",
      keywords: ["ai sales agent", "sales", "qualification", "objections", "lead nurturing", "follow up", "approved claims"],
      updated: "September 2026",
      toc: [
        { id: "what-it-does", title: "What it does" },
        { id: "who-its-for", title: "Who it's for" },
        { id: "what-gets-configured", title: "What gets configured" },
        { id: "guardrails", title: "Guardrails" },
        { id: "after-activation", title: "After activation" },
      ],
      body: (
        <>
          <DocLead>
            The AI Sales Agent converts opportunities into revenue: it qualifies leads, recommends the right
            service within approved boundaries, follows up and books meetings.
          </DocLead>

          <DocH2 id="what-it-does">What it does</DocH2>
          <DocP>
            Depending on what your business enables, the agent can qualify an enquiry against your criteria,
            recommend a service, answer questions from your approved knowledge, handle objections using
            approved responses, follow up with prospects, book meetings and notify your team about
            high-value or high-intent leads.
          </DocP>

          <DocH2 id="who-its-for">Who it's for</DocH2>
          <DocP>
            Businesses that receive enquiries needing qualification before a sale — where consistency in the
            first conversation materially affects conversion. It is a complement to your sales team, not a
            replacement: escalations hand off to your people.
          </DocP>

          <DocH2 id="what-gets-configured">What gets configured</DocH2>
          <DocUL
            items={[
              <>
                <strong className="text-[var(--color-text-primary)]">Qualification</strong> — the questions it
                asks, the lead information it must capture, ideal-customer criteria and disqualifying
                criteria.
              </>,
              <>
                <strong className="text-[var(--color-text-primary)]">Offer knowledge</strong> — services or
                products, who each is for, and approved pricing.
              </>,
              <>
                <strong className="text-[var(--color-text-primary)]">Objection handling</strong> — approved
                responses to common objections such as price, timing, competition and trust.
              </>,
              <>
                <strong className="text-[var(--color-text-primary)]">Actions</strong> — qualify, recommend,
                follow up, book a meeting, send a message, escalate.
              </>,
              <>
                <strong className="text-[var(--color-text-primary)]">Escalation</strong> — human contact
                details and the conditions that trigger handoff.
              </>,
            ]}
          />

          <DocH2 id="guardrails">Guardrails</DocH2>
          <DocP>Your business defines the limits, for example:</DocP>
          <DocUL
            items={[
              <>maximum discount or special offers the agent may reference,</>,
              <>claims it is prohibited from making,</>,
              <>approved pricing and approved promises only — no invented policies or discounts,</>,
              <>automatic escalation for complaints or anything outside its approved boundaries.</>,
            ]}
          />
          <Callout variant="warn" title="Approved information only">
            The agent operates strictly on the knowledge and rules your business provides. It must not invent
            pricing, policies or product claims.
          </Callout>

          <DocH2 id="after-activation">After activation</DocH2>
          <DocP>
            Leads, conversations, bookings and escalations are recorded as real activity in your dashboard.
            You can refine the qualification criteria and objection responses over time as you learn what
            converts.
          </DocP>
        </>
      ),
    },
  ],
};
