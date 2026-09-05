import { DocH2, DocP, DocLead, DocUL, DocOL, Callout, InlineCode } from "./ui";
import type { DocCategory } from "./types";

export const gettingStarted: DocCategory = {
  slug: "getting-started",
  title: "Getting Started",
  description: "What ELION is, how the platform works, and how to run your free business audit.",
  articles: [
    {
      slug: "what-is-elion",
      title: "What is ELION?",
      description:
        "ELION is an AI operations platform that helps growing businesses identify operational leaks and deploy automation systems to address them.",
      keywords: ["what is elion", "platform", "overview", "ai operations", "automation", "leaks"],
      updated: "September 2026",
      toc: [
        { id: "the-problem", title: "The problem" },
        { id: "what-elion-does", title: "What ELION does" },
        { id: "the-loop", title: "The ELION loop" },
        { id: "what-you-own", title: "What you own" },
      ],
      body: (
        <>
          <DocLead>
            ELION is an AI operations platform that helps growing businesses find where leads, follow-ups,
            bookings and internal workflows are breaking down , then deploys automation systems to fix them.
          </DocLead>

          <DocH2 id="the-problem">The problem</DocH2>
          <DocP>
            Most revenue leaks are not dramatic. A lead waits hours for a reply. A follow-up is forgotten.
            A booking requires another message. A handoff between team members is missed. Each one is small -
            but together they are the difference between a business that grows predictably and one that
            depends on luck and memory.
          </DocP>

          <DocH2 id="what-elion-does">What ELION does</DocH2>
          <DocP>ELION works through three layers:</DocP>
          <DocUL
            items={[
              <>
                <strong className="text-[var(--color-text-primary)]">Discovery.</strong> The free business
                audit scans your public digital presence and identifies likely operational gaps.
              </>,
              <>
                <strong className="text-[var(--color-text-primary)]">Delivery.</strong> ELION provisions
                reusable automation systems , such as Lead Response, Follow-Up, Booking, AI Receptionist and
                AI Sales Agent : configured for your business.
              </>,
              <>
                <strong className="text-[var(--color-text-primary)]">Operations.</strong> Your client
                dashboard shows whether each system is healthy and what it has actually done, using real
                activity data rather than estimates.
              </>,
            ]}
          />

          <DocH2 id="the-loop">The ELION loop</DocH2>
          <DocP>The platform is built around one repeatable loop:</DocP>
          <DocOL
            items={[
              <>
                <strong className="text-[var(--color-text-primary)]">Audit</strong> : understand where the
                business leaks.
              </>,
              <>
                <strong className="text-[var(--color-text-primary)]">Diagnose</strong> : prioritise the gaps
                with the largest operational impact.
              </>,
              <>
                <strong className="text-[var(--color-text-primary)]">Configure</strong> : define the systems,
                rules and integrations for your business.
              </>,
              <>
                <strong className="text-[var(--color-text-primary)]">Provision</strong> : ELION deploys the
                automation using its reusable template architecture.
              </>,
              <>
                <strong className="text-[var(--color-text-primary)]">Automate</strong> , the system runs on
                your channels, such as WhatsApp or Google Calendar.
              </>,
              <>
                <strong className="text-[var(--color-text-primary)]">Measure</strong> : activity and health
                are recorded and visible in your dashboard.
              </>,
            ]}
          />

          <DocH2 id="what-you-own">What you own</DocH2>
          <DocP>
            ELION does not lock you in. Under the ELION commercial model, workflows, configurations and data
            delivered for your business are owned by you according to your contract, and ELION retains
            ownership of its pre-built templates, frameworks and platform components. See the{" "}
            <a className="text-[var(--color-accent-bright)] underline underline-offset-2" href="/terms">
              Terms of Service
            </a>{" "}
            for the authoritative terms.
          </DocP>
          <Callout variant="info" title="Start here">
            Run a <a className="underline underline-offset-2" href="/audit">free business audit</a> to see
            what ELION would look for in your business : no credit card required.
          </Callout>
        </>
      ),
    },
    {
      slug: "how-elion-works",
      title: "How ELION Works",
      description:
        "The architecture in plain language: your business, ELION, automation systems, channels, and outcomes.",
      keywords: ["how elion works", "architecture", "infrastructure", "n8n", "supabase", "channels", "integrations"],
      updated: "September 2026",
      toc: [
        { id: "one-view", title: "One view of your operations" },
        { id: "the-layers", title: "The layers" },
        { id: "templates-and-clients", title: "One template, many clients" },
        { id: "external-infrastructure", title: "External infrastructure" },
      ],
      body: (
        <>
          <DocLead>
            ELION sits between your business and the systems it already uses : one place to configure,
            deploy and monitor automation.
          </DocLead>

          <DocH2 id="one-view">One view of your operations</DocH2>
          <DocP>In simple terms:</DocP>
          <DocOL
            items={[
              <>
                <strong className="text-[var(--color-text-primary)]">Your business</strong> receives enquiries,
                leads and requests across channels such as WhatsApp, your website and email.
              </>,
              <>
                <strong className="text-[var(--color-text-primary)]">ELION</strong> connects those channels to
                reusable automation systems.
              </>,
              <>
                <strong className="text-[var(--color-text-primary)]">Automation systems</strong> respond,
                qualify, follow up, book and recover according to the rules your business configured.
              </>,
              <>
                <strong className="text-[var(--color-text-primary)]">Channels and integrations</strong> , such
                as WhatsApp providers, Google Calendar, email and AI models : carry the work into the real
                world.
              </>,
              <>
                <strong className="text-[var(--color-text-primary)]">Business outcome</strong> : every action
                is recorded so you can see what happened, not just what was supposed to happen.
              </>,
            ]}
          />

          <DocH2 id="the-layers">The layers</DocH2>
          <DocUL
            items={[
              <>
                <strong className="text-[var(--color-text-primary)]">ELION platform</strong> : client
                dashboard, admin control plane, configuration, provisioning, billing and monitoring.
              </>,
              <>
                <strong className="text-[var(--color-text-primary)]">System of record</strong> : data is
                stored in a managed database with per-organization isolation.
              </>,
              <>
                <strong className="text-[var(--color-text-primary)]">Execution engine</strong> : automated
                workflows run on n8n, the execution layer ELION provisions per client.
              </>,
              <>
                <strong className="text-[var(--color-text-primary)]">Intelligence</strong> : AI models provide
                language and decision capability where a system is configured to use them.
              </>,
              <>
                <strong className="text-[var(--color-text-primary)]">Channels</strong> : WhatsApp, Google
                Calendar, email and other providers are the external infrastructure the automation talks to.
              </>,
            ]}
          />
          <DocP>
            ELION never exposes provider credentials or private tokens in the browser. Credentials are stored
            server-side and referenced by the automation instance that needs them.
          </DocP>

          <DocH2 id="templates-and-clients">One template, many clients</DocH2>
          <DocP>
            ELION does not build a bespoke workflow for every client. Each automation product is a reusable
            template. A client automation instance is simply:
          </DocP>
          <DocUL
            items={[
              <>a template (for example <InlineCode>lead-response</InlineCode>),</>,
              <>the client's own configuration (business details, rules, channels), and</>,
              <>references to the client's credentials and integrations.</>,
            ]}
          />
          <DocP>
            That is why two clients can run the same product with completely different business rules, and why
            one client can never see another client's configuration, credentials or activity.
          </DocP>

          <DocH2 id="external-infrastructure">External infrastructure</DocH2>
          <DocP>
            Depending on the systems you select, ELION may use external infrastructure such as WhatsApp/Meta
            providers, Google Calendar, AI model providers, email infrastructure, voice providers and
            automation infrastructure. A system is only ever reported as active when the infrastructure it
            depends on is actually connected and healthy : otherwise its status truthfully shows what is still
            required.
          </DocP>
        </>
      ),
    },
    {
      slug: "running-your-free-audit",
      title: "Running Your Free Audit",
      description:
        "How the audit works, what ELION checks, and how to read evidence levels : Verified, Supported and Estimated.",
      keywords: ["audit", "free audit", "evidence", "verified", "supported", "estimated", "how to run an audit", "leaks"],
      updated: "September 2026",
      toc: [
        { id: "what-happens", title: "What happens" },
        { id: "evidence-levels", title: "Evidence levels" },
        { id: "finding-types", title: "Finding types" },
        { id: "after-the-audit", title: "After the audit" },
      ],
      body: (
        <>
          <DocLead>
            The free business audit analyses publicly available information about your business and reports
            potential operational leaks : with the evidence for each finding.
          </DocLead>

          <DocH2 id="what-happens">What happens</DocH2>
          <DocOL
            items={[
              <>Enter your business information (name, industry, website where available).</>,
              <>
                ELION researches publicly available information : for example whether your website is
                reachable, how visitors can contact you, and which channels you publish.
              </>,
              <>ELION identifies potential operational gaps, such as lead response, follow-up or booking friction.</>,
              <>
                Every finding is classified by <em>evidence level</em> : Verified, Supported or Estimated.
              </>,
              <>ELION recommends the automation products most relevant to the gaps it found.</>,
              <>You can book a call if you want help implementing any of them.</>,
            ]}
          />
          <DocP>
            The audit only reports what it has a basis to report. When information is not publicly available,
            ELION omits it rather than guessing.
          </DocP>

          <DocH2 id="evidence-levels">Evidence levels</DocH2>
          <DocUL
            items={[
              <>
                <strong className="text-[var(--color-text-primary)]">Verified</strong> : directly observable
                from the business website or a reliable public source.
              </>,
              <>
                <strong className="text-[var(--color-text-primary)]">Supported</strong> : strongly indicated
                by multiple public signals, though not directly confirmed.
              </>,
              <>
                <strong className="text-[var(--color-text-primary)]">Estimated</strong> , a reasonable
                benchmark estimate, clearly labelled as such and never presented as a fact about the business.
              </>,
            ]}
          />
          <Callout variant="warn" title="Estimates are not guarantees">
            Where ELION estimates an operational or financial opportunity, the estimate is illustrative and
            based on stated assumptions (such as lead volume or average customer value). Estimates are not
            promises of results.
          </Callout>

          <DocH2 id="finding-types">Finding types</DocH2>
          <DocP>Common finding categories include:</DocP>
          <DocUL
            items={[
              <>
                <strong className="text-[var(--color-text-primary)]">Lead Response Gap</strong> : no visible
                immediate-response system for new enquiries.
              </>,
              <>
                <strong className="text-[var(--color-text-primary)]">Follow-Up Gap</strong> : no obvious
                mechanism for pursuing leads after first contact.
              </>,
              <>
                <strong className="text-[var(--color-text-primary)]">Booking Friction</strong> , the journey
                from enquiry to appointment requires manual steps.
              </>,
              <>
                <strong className="text-[var(--color-text-primary)]">Contact Friction</strong> : it is hard
                for prospects to reach the business.
              </>,
            ]}
          />
          <DocP>
            Each major finding maps to a real ELION product (for example a Lead Response Gap maps to WhatsApp
            Lead Response). Findings are only generated when there is evidence to support them.
          </DocP>

          <DocH2 id="after-the-audit">After the audit</DocH2>
          <DocP>
            You can review the full findings, see which products ELION would deploy, and book a strategy call
            to discuss implementation. There is no obligation , the audit is free and is not a sales wall.
          </DocP>
        </>
      ),
    },
  ],
};
