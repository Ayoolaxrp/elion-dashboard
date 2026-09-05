import { DocH2, DocP, DocLead, DocUL, InlineCode, Callout } from "./ui";
import type { DocCategory } from "./types";

export const troubleshooting: DocCategory = {
  slug: "troubleshooting",
  title: "Troubleshooting",
  description: "Common states and what they mean : calendar connections, pending automations and booking availability.",
  articles: [
    {
      slug: "calendar-not-connected",
      title: "Calendar Not Connected",
      description: "Why a booking page or automation shows the calendar as not connected, and what to do.",
      keywords: ["calendar", "not connected", "google calendar", "connect", "oauth", "booking unavailable"],
      updated: "September 2026",
      toc: [
        { id: "why-it-happens", title: "Why it happens" },
        { id: "what-elion-shows", title: "What ELION shows" },
        { id: "how-to-fix", title: "How to fix it" },
      ],
      body: (
        <>
          <DocLead>
            ELION only ever shows real availability from a connected calendar. If no calendar is connected, it
            says so.
          </DocLead>

          <DocH2 id="why-it-happens">Why it happens</DocH2>
          <DocUL
            items={[
              <>Google OAuth credentials have not been configured for the environment,</>,
              <>the calendar connection has not been completed, or</>,
              <>the stored connection is invalid or expired and cannot be refreshed.</>,
            ]}
          />

          <DocH2 id="what-elion-shows">What ELION shows</DocH2>
          <DocP>
            The status reads <InlineCode>Calendar not connected</InlineCode>. No availability times are shown
            and no booking can be created : ELION never fabricates free slots or a confirmation it cannot
            back with a real calendar event.
          </DocP>

          <DocH2 id="how-to-fix">How to fix it</DocH2>
          <DocOLItems />
          <Callout variant="info" title="Need help?">
            Contact <a className="underline underline-offset-2" href="/landing/support">ELION support</a> and
            the team will connect or repair the calendar connection.
          </Callout>
        </>
      ),
    },
    {
      slug: "automation-pending",
      title: "Automation Says Pending",
      description: "What a pending automation means and what has to happen before it can go live.",
      keywords: ["pending", "automation status", "activation", "credentials", "provisioning", "waiting"],
      updated: "September 2026",
      toc: [
        { id: "what-pending-means", title: "What pending means" },
        { id: "checklist", title: "The readiness checklist" },
        { id: "next-step", title: "Next step" },
      ],
      body: (
        <>
          <DocLead>
            <InlineCode>Pending</InlineCode> is ELION being honest: the automation is not live because not
            everything it needs is in place yet.
          </DocLead>

          <DocH2 id="what-pending-means">What pending means</DocH2>
          <DocP>
            An automation may be waiting on configuration, credentials, a provider connection, provisioning or
            a successful test. The status shown reflects the furthest gate reached.
          </DocP>

          <DocH2 id="checklist">The readiness checklist</DocH2>
          <DocUL
            items={[
              <>client and entitlement exist,</>,
              <>the template is available,</>,
              <>configuration is valid and complete,</>,
              <>required credentials are present,</>,
              <>required integrations are connected and healthy,</>,
              <>provisioning succeeded, and</>,
              <>a test execution passed.</>,
            ]}
          />

          <DocH2 id="next-step">Next step</DocH2>
          <DocP>
            Your ELION contact will tell you exactly which item is missing. You will never be asked to approve
            a broken automation : activation is blocked until every gate passes.
          </DocP>
        </>
      ),
    },
    {
      slug: "agent-cannot-activate",
      title: "AI Agent Cannot Activate",
      description: "Why an AI Receptionist or AI Sales Agent stays pending until its provider dependencies are connected.",
      keywords: ["ai agent", "activation", "receptionist", "sales agent", "provider", "vapi", "whatsapp", "cannot activate"],
      updated: "September 2026",
      toc: [
        { id: "why", title: "Why an agent cannot activate" },
        { id: "required-infrastructure", title: "Required infrastructure" },
        { id: "guardrails", title: "Guardrails are configured, not optional" },
      ],
      body: (
        <>
          <DocLead>
            AI agents depend on real infrastructure. Until that infrastructure is connected, the agent cannot
            honestly go live.
          </DocLead>

          <DocH2 id="why">Why an agent cannot activate</DocH2>
          <DocP>
            An agent needs its knowledge configured, its guardrails set, and the providers it talks to
            connected and healthy , an AI provider for language, a channel like WhatsApp for conversations,
            and a calendar if it books appointments. If any required provider is missing, the agent shows
            exactly what is missing rather than activating.
          </DocP>

          <DocH2 id="required-infrastructure">Required infrastructure</DocH2>
          <DocUL
            items={[
              <>AI model provider : connected and healthy,</>,
              <>conversation channel (for example WhatsApp) : credentials valid,</>,
              <>calendar : connected if booking is enabled, and</>,
              <>any voice infrastructure : connected where a voice agent uses it.</>,
            ]}
          />
          <Callout variant="warn" title="Never fake-live">
            ELION does not create fake provider connections or mark an agent live because a row exists. A
            red/yellow infrastructure state is shown until the dependency is genuinely connected.
          </Callout>

          <DocH2 id="guardrails">Guardrails are configured, not optional</DocH2>
          <DocP>
            Before activation your business completes the agent's knowledge and guardrails : what it may
            answer, what it must not claim, and when it escalates. Activation is blocked until those are in
            place, so the agent never runs without boundaries.
          </DocP>
        </>
      ),
    },
    {
      slug: "booking-unavailable",
      title: "Booking Unavailable",
      description: "Possible reasons no time slots show on a booking page, and how to check each one.",
      keywords: ["booking", "no slots", "unavailable", "availability", "working hours", "minimum notice", "booking window", "calendar"],
      updated: "September 2026",
      toc: [
        { id: "possible-causes", title: "Possible causes" },
        { id: "calendar-state", title: "Check the calendar state" },
        { id: "rules", title: "Check the booking rules" },
      ],
      body: (
        <>
          <DocLead>
            When no slots appear, the system is usually doing its job : respecting a rule or a real calendar.
          </DocLead>

          <DocH2 id="possible-causes">Possible causes</DocH2>
          <DocUL
            items={[
              <><strong className="text-[var(--color-text-primary)]">Calendar busy</strong> : every slot in range is already booked on the connected calendar.</>,
              <><strong className="text-[var(--color-text-primary)]">Outside working hours</strong> : no free time falls within the configured hours.</>,
              <><strong className="text-[var(--color-text-primary)]">Booking window</strong> , the requested dates are beyond the maximum window.</>,
              <><strong className="text-[var(--color-text-primary)]">Minimum notice</strong> , the next available slot is closer than the minimum notice period.</>,
              <><strong className="text-[var(--color-text-primary)]">Disconnected calendar</strong> : no calendar is connected, so availability cannot be checked.</>,
            ]}
          />

          <DocH2 id="calendar-state">Check the calendar state</DocH2>
          <DocP>
            First confirm the calendar shows as connected. If it reads <InlineCode>Calendar not connected</InlineCode>,
            see <a className="underline underline-offset-2" href="/docs/troubleshooting/calendar-not-connected">Calendar Not Connected</a>.
          </DocP>

          <DocH2 id="rules">Check the booking rules</DocH2>
          <DocP>
            Working hours, duration, buffer, minimum notice and the booking window are configuration values
            per client : they can be adjusted by your ELION contact if the current rules are too restrictive
            for how you actually take bookings.
          </DocP>
        </>
      ),
    },
  ],
};

/* Small local helper to avoid repeating the ordered list in one article. */
function DocOLItems() {
  return (
    <ol className="space-y-2.5 mb-5">
      {[
        <>
          Confirm the environment variables <InlineCode>GOOGLE_CLIENT_ID</InlineCode> and{" "}
          <InlineCode>GOOGLE_CLIENT_SECRET</InlineCode> are configured on the server.
        </>,
        <>
          From the admin bookings console, start <strong className="text-[var(--color-text-primary)]">Connect Google Calendar</strong>{" "}
          and complete the Google sign-in.
        </>,
        <>
          Return to ELION and confirm the connection shows as connected after a refresh.
        </>,
      ].map((item, i) => (
        <li key={i} className="flex gap-3 text-[15px] leading-6 text-[var(--color-text-secondary)]">
          <span className="mt-0.5 shrink-0 h-5 min-w-5 px-1 flex items-center justify-center rounded text-[11px] font-semibold bg-[var(--color-surface-elevated)] border border-[var(--color-border)] text-[var(--color-text-muted)]">
            {i + 1}
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ol>
  );
}
