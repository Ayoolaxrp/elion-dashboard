import { DocH2, DocP, DocLead, DocUL, Callout } from "./ui";
import type { DocCategory } from "./types";

export const billing: DocCategory = {
  slug: "billing",
  title: "Billing",
  description: "Understanding ELION pricing: setup fees, management fees and third-party infrastructure costs.",
  articles: [
    {
      slug: "understanding-pricing",
      title: "Understanding ELION Pricing",
      description:
        "The difference between one-time setup, recurring management, and third-party provider costs that may apply separately.",
      keywords: ["pricing", "fees", "setup fee", "management fee", "monthly", "third party", "infrastructure", "cost"],
      updated: "September 2026",
      toc: [
        { id: "three-kinds-of-cost", title: "Three kinds of cost" },
        { id: "elion-fees", title: "ELION fees" },
        { id: "third-party-infrastructure", title: "Third-party infrastructure" },
        { id: "provider-examples", title: "Provider examples" },
        { id: "transparency", title: "Transparency" },
      ],
      body: (
        <>
          <DocLead>
            ELION pricing separates what ELION charges from what third-party providers charge , so you always
            know what you are paying for.
          </DocLead>

          <DocH2 id="three-kinds-of-cost">Three kinds of cost</DocH2>
          <DocUL
            items={[
              <><strong className="text-[var(--color-text-primary)]">ELION setup fee</strong> : one-time implementation and configuration.</>,
              <><strong className="text-[var(--color-text-primary)]">ELION management fee</strong> : recurring monthly management, monitoring, maintenance and optimisation.</>,
              <><strong className="text-[var(--color-text-primary)]">Third-party infrastructure</strong> : separate charges from the providers your automation depends on.</>,
            ]}
          />

          <DocH2 id="elion-fees">ELION fees</DocH2>
          <DocP>
            The setup fee covers building and configuring your automation. The management fee covers keeping
            it running: monitoring health, maintaining templates, managing integrations and optimising
            performance. The management fee is ongoing : it is not another setup fee.
          </DocP>

          <DocH2 id="third-party-infrastructure">Third-party infrastructure</DocH2>
          <DocP>
            Many automation products depend on external services that carry their own recurring or
            usage-based charges. These charges are not ELION revenue, and ELION does not hide them:
          </DocP>
          <Callout variant="warn" title="Separate charges may apply">
            Additional third-party provider or usage charges may apply depending on the automation and
            integrations you select. Where a provider is required to keep your system running, ELION will tell
            you clearly rather than implying the system is free to operate.
          </Callout>

          <DocH2 id="provider-examples">Provider examples</DocH2>
          <DocUL
            items={[
              <><strong className="text-[var(--color-text-primary)]">WhatsApp / Meta</strong> : WhatsApp Business messaging and provider charges may apply.</>,
              <><strong className="text-[var(--color-text-primary)]">Voice AI</strong> : voice infrastructure and usage charges are billed separately where applicable.</>,
              <><strong className="text-[var(--color-text-primary)]">AI models</strong> : AI model usage may incur third-party charges depending on configuration and volume.</>,
              <><strong className="text-[var(--color-text-primary)]">Email / SMS / calendar / CRM</strong> : provider plans or per-message charges may apply.</>,
            ]}
          />
          <DocP>
            Provider prices change and depend on your usage, so ELION does not publish fixed third-party
            prices. Your proposal or onboarding documents state the ELION fees; the provider's own terms and
            pricing govern their charges.
          </DocP>

          <DocH2 id="transparency">Transparency</DocH2>
          <DocP>
            Before you buy, ELION states the setup fee, the management fee and which third-party
            infrastructure the automation requires. If ELION manages a paid provider on your behalf, that
            arrangement is explicit. You will never discover an infrastructure charge that was not disclosed.
          </DocP>
        </>
      ),
    },
  ],
};
