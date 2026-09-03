import type { Metadata } from "next";
import { LegalDoc, LP, LUL, LegalReview } from "@/components/legal-doc";

export const metadata: Metadata = {
  title: "Acceptable Use",
  description:
    "The acceptable-use terms for ELION's website, platforms and automation services.",
  alternates: { canonical: "/acceptable-use" },
};

export default function AcceptableUsePage() {
  return (
    <LegalDoc
      title="Acceptable Use Policy"
      description="Rules for using ELION's website, platforms and automation services responsibly and lawfully."
      lastUpdated="September 2026"
      sections={[
        {
          id: "scope",
          title: "Scope",
          body: (
            <LP>
              This Acceptable Use Policy applies to everyone who accesses or uses ELION&rsquo;s website,
              automation platforms and related services. It complements the{" "}
              <a href="/terms" className="text-[var(--color-accent-bright)] hover:underline underline-offset-2">
                Terms of Service
              </a>
              .
            </LP>
          ),
        },
        {
          id: "lawful-use",
          title: "Lawful and responsible use",
          body: (
            <>
              <LP>You must not use the Services:</LP>
              <LUL
                items={[
                  <>in any way that breaches applicable law or regulation,</>,
                  <>to send unsolicited or unlawful communications (including spam),</>,
                  <>to misrepresent your identity or affiliation,</>,
                  <>to attempt to access another client&rsquo;s data, systems or credentials,</>,
                  <>to probe, scan or test the security of the Services without authorization,</>,
                  <>to interfere with the operation of the Services or other users&rsquo; enjoyment of them, or</>,
                  <>to reverse engineer, decompile or extract source code from the platform beyond what the terms permit.</>,
                ]}
              />
            </>
          ),
        },
        {
          id: "data",
          title: "Data you provide",
          body: (
            <LP>
              You are responsible for the accuracy of the information you provide and for ensuring you have the
              right to provide any third-party data (such as customer information) that flows through systems
              ELION operates on your behalf.
            </LP>
          ),
        },
        {
          id: "enforcement",
          title: "Enforcement",
          body: (
            <LP>
              We may suspend or terminate access to the Services if we reasonably believe this policy has been
              violated. Where possible we will give notice, but we may act immediately where required to
              protect the platform, other clients or the law.
            </LP>
          ),
        },
        {
          id: "review",
          title: "Review",
          body: (
            <>
              <LegalReview>
                This policy should be reviewed by ELION&rsquo;s legal advisor before public launch, and any
                industry-specific obligations (for example around regulated communications) added if
                applicable.
              </LegalReview>
            </>
          ),
        },
      ]}
    />
  );
}
