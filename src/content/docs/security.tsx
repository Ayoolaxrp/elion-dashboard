import { DocH2, DocP, DocLead, DocUL, Callout } from "./ui";
import type { DocCategory } from "./types";

export const security: DocCategory = {
  slug: "security",
  title: "Security & Privacy",
  description: "How ELION protects client data: isolation, server-side credentials, authentication and access control.",
  articles: [
    {
      slug: "data-and-security",
      title: "Data & Security",
      description:
        "A plain-English description of the security measures in ELION's architecture — and what ELION does not claim.",
      keywords: ["security", "privacy", "data", "isolation", "credentials", "encryption", "rls", "access control", "client isolation"],
      updated: "September 2026",
      toc: [
        { id: "what-we-do", title: "What ELION does" },
        { id: "client-isolation", title: "Client isolation" },
        { id: "credentials", title: "Server-side credentials" },
        { id: "access-control", title: "Authentication and roles" },
        { id: "what-we-dont-claim", title: "What ELION does not claim" },
      ],
      body: (
        <>
          <DocLead>
            ELION is built so that each client's data is separate, credentials stay server-side, and status is
            always truthful.
          </DocLead>

          <DocH2 id="what-we-do">What ELION does</DocH2>
          <DocUL
            items={[
              <>
                <strong className="text-[var(--color-text-primary)]">Client isolation</strong> — data is
                scoped per organization at the database and API level, not just hidden in the interface.
              </>,
              <>
                <strong className="text-[var(--color-text-primary)]">Server-side credentials</strong> —
                provider keys and OAuth tokens are stored and used server-side and are never sent to the
                browser.
              </>,
              <>
                <strong className="text-[var(--color-text-primary)]">Role-based access</strong> — admin and
                client surfaces are separated, and client-facing routes only expose that client's data.
              </>,
              <>
                <strong className="text-[var(--color-text-primary)]">No secrets in logs</strong> — execution
                logs record operational information and never API keys, passwords or tokens.
              </>,
            ]}
          />

          <DocH2 id="client-isolation">Client isolation</DocH2>
          <DocP>
            Client A can never see Client B's conversations, credentials, workflows, configuration or results.
            Isolation is enforced by the database and the API layer: every query is scoped by the
            authenticated organization, so isolation holds even if the interface were bypassed.
          </DocP>

          <DocH2 id="credentials">Server-side credentials</DocH2>
          <DocP>
            Google OAuth tokens, WhatsApp/API credentials and other provider secrets are stored on the server
            and referenced by the automation that needs them. Public APIs return connection state (connected,
            not configured) — never the credentials themselves.
          </DocP>

          <DocH2 id="access-control">Authentication and roles</DocH2>
          <DocUL
            items={[
              <>authentication through the platform's managed auth,</>,
              <>admin versus client role separation,</>,
              <>client access limited to the client's own organization, and</>,
              <>admin APIs that require admin authorization.</>,
            ]}
          />

          <DocH2 id="what-we-dont-claim">What ELION does not claim</DocH2>
          <DocP>
            ELION does not claim security certifications, compliance standards or guarantees it has not
            earned. No certification claims (such as SOC 2 or ISO) are made unless independently verified and
            published. If you need a specific assurance for your procurement, ask during onboarding — ELION
            will answer truthfully about what the architecture actually provides.
          </DocP>
          <Callout variant="info" title="See also">
            Full details of how information is handled are in the{" "}
            <a className="underline underline-offset-2" href="/privacy">Privacy Policy</a> and the{" "}
            <a className="underline underline-offset-2" href="/terms">Terms of Service</a>.
          </Callout>
        </>
      ),
    },
  ],
};
