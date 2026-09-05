import type { Metadata } from "next";
import { LegalDoc, LP, LUL, LegalReview } from "@/components/legal-doc";

export const metadata: Metadata = {
  title: "Third-Party Services",
  description:
    "Transparency about the third-party providers used in ELION's architecture and which ones may apply to the services you select.",
  alternates: { canonical: "/third-party-services" },
};

export default function ThirdPartyServicesPage() {
  return (
    <LegalDoc
      title="Third-Party Services"
      description="Transparency about the third-party providers that power ELION's platform."
      lastUpdated="September 2026"
      sections={[
        {
          id: "introduction",
          title: "Introduction",
          body: (
            <>
              <LP>
                ELION is built on a managed infrastructure of third-party providers. This page lists the
                categories of providers used to operate the platform and deliver services to clients, and is
                published for transparency.
              </LP>
              <LP>
                The specific providers that apply to you depend on the automation systems you select. For
                example, a Booking Automation uses Google Calendar, while a WhatsApp automation uses a
                WhatsApp/Meta provider. Where a provider is required to keep your system running, its own
                terms and privacy policy also apply to that relationship.
              </LP>
              <LegalReview>
                Confirm the exact provider list, contract structure and whether formal data-processing
                agreements are required for any provider before launch.
              </LegalReview>
            </>
          ),
        },
        {
          id: "platform",
          title: "Platform infrastructure",
          body: (
            <>
              <LP>ELION&rsquo;s platform itself relies on managed infrastructure providers, including:</LP>
              <LUL
                items={[
                  <>
                    <strong className="text-[var(--color-text-primary)]">Hosting / deployment</strong> -
                    the website and APIs are deployed on a managed hosting platform (currently Vercel).
                  </>,
                  <>
                    <strong className="text-[var(--color-text-primary)]">Database / authentication</strong> -
                    data and authentication are managed through a database and auth platform (currently
                    Supabase, including its storage and row-level security model).
                  </>,
                  <>
                    <strong className="text-[var(--color-text-primary)]">Transactional email</strong> -
                    confirmation and notification emails are sent through an email delivery provider
                    (currently Resend).
                  </>,
                ]}
              />
            </>
          ),
        },
        {
          id: "automation-infrastructure",
          title: "Automation infrastructure",
          body: (
            <LP>
              Automated workflows are executed on an automation/orchestration layer (currently n8n), which
              ELION provisions per client. This layer coordinates the channels and systems described below.
            </LP>
          ),
        },
        {
          id: "channels",
          title: "Channels and integrations (client-selected)",
          body: (
            <>
              <LP>Depending on the systems in your scope, the following categories of providers may be used:</LP>
              <LUL
                items={[
                  <>
                    <strong className="text-[var(--color-text-primary)]">Google</strong> : Google Calendar and
                    Google Meet for booking automation (connected via OAuth only where enabled).
                  </>,
                  <>
                    <strong className="text-[var(--color-text-primary)]">WhatsApp / Meta</strong> : WhatsApp
                    Business messaging for lead response, follow-up and AI agents, where a WhatsApp provider
                    has been configured for the client.
                  </>,
                  <>
                    <strong className="text-[var(--color-text-primary)]">AI model providers</strong> : for
                    AI-assisted responses and agents, where configured.
                  </>,
                  <>
                    <strong className="text-[var(--color-text-primary)]">Voice providers</strong> : for voice
                    AI products, where selected.
                  </>,
                  <>
                    <strong className="text-[var(--color-text-primary)]">Email / SMS / CRM / calendar</strong>{" "}
                    : where a system integrates with them.
                  </>,
                ]}
              />
              <LP>
                No channel is claimed as connected unless it has actually been connected for your account. A
                system that requires a provider that is not yet connected reports that state clearly instead.
              </LP>
            </>
          ),
        },
        {
          id: "payments",
          title: "Payment processing",
          body: (
            <>
              <LP>
                Where payments are processed through the platform, an online payment provider handles the
                transaction. Payment details are handled by the payment provider under its own terms and are
                not stored by ELION.
              </LP>
              <LegalReview>
                Confirm the payment provider(s) currently integrated and their processing terms before listing
                them specifically.
              </LegalReview>
            </>
          ),
        },
        {
          id: "updates",
          title: "Updates to this page",
          body: (
            <LP>
              ELION may add, replace or remove providers over time. This page will be updated when the provider
              set materially changes.
            </LP>
          ),
        },
      ]}
    />
  );
}
