import type { Metadata } from "next";
import { LegalDoc, LP, LUL, LegalReview } from "@/components/legal-doc";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How ELION collects, uses, protects and manages information , including what we collect, why, and your rights.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalDoc
      title="Privacy Policy"
      description="How ELION collects, uses, protects and manages information."
      lastUpdated="August 28, 2026"
      sections={[
        {
          id: "overview",
          title: "Overview",
          body: (
            <>
              <LP>
                This Privacy Policy explains what information ELION collects when you use our website,
                automation platforms and related services (collectively, the &ldquo;Services&rdquo;), how we
                use it, and the choices available to you.
              </LP>
              <LP>
                &ldquo;We&rdquo;, &ldquo;us&rdquo; or &ldquo;our&rdquo; means ELION. By using the Services, you
                agree to the practices described in this policy.
              </LP>
              <LegalReview>
                Confirm the legal entity name, jurisdiction and contact details for the data controller, and
                whether this document should name any specific data-protection law beyond general good
                practice.
              </LegalReview>
            </>
          ),
        },
        {
          id: "collect",
          title: "Information We Collect",
          body: (
            <>
              <LP>
                We collect information you provide directly to us, such as when you fill out a form, request an
                audit, or contact us:
              </LP>
              <LUL
                items={[
                  <>Name and email address</>,
                  <>Phone number</>,
                  <>Company name and industry</>,
                  <>Website URL (for audit purposes)</>,
                  <>Communication preferences</>,
                ]}
              />
              <LP>
                We may also collect information automatically when you use the Services, such as usage data
                needed to operate and secure the platform.
              </LP>
            </>
          ),
        },
        {
          id: "use",
          title: "How We Use Your Information",
          body: (
            <>
              <LP>We use the information we collect to:</LP>
              <LUL
                items={[
                  <>Provide and improve our automation services</>,
                  <>Respond to your inquiries and send you requested information</>,
                  <>Send you marketing communications (with your consent)</>,
                  <>Process payments and manage your account</>,
                  <>Analyze website usage to improve our services</>,
                ]}
              />
            </>
          ),
        },
        {
          id: "sharing",
          title: "Information Sharing",
          body: (
            <>
              <LP>We do not sell your personal information. We may share your information with:</LP>
              <LUL
                items={[
                  <>
                    Service providers who assist in delivering our services (e.g., hosting, email providers,
                    CRM platforms)
                  </>,
                  <>When required by law or to protect our legal rights</>,
                  <>With your explicit consent</>,
                ]}
              />
              <LegalReview>
                Identify the specific categories of service providers currently used and confirm whether a
                list of subprocessors should be published (see Third-Party Services).
              </LegalReview>
            </>
          ),
        },
        {
          id: "security",
          title: "Data Security",
          body: (
            <LP>
              We implement appropriate technical and organizational measures to protect your personal
              information against unauthorized access, alteration, disclosure, or destruction. However, no
              method of transmission over the Internet is 100% secure.
            </LP>
          ),
        },
        {
          id: "retention",
          title: "Data Retention",
          body: (
            <LP>
              We retain your personal information for as long as necessary to provide our services and fulfill
              the purposes described in this policy. You may request deletion of your data at any time by
              contacting us.
            </LP>
          ),
        },
        {
          id: "rights",
          title: "Your Rights",
          body: (
            <>
              <LP>You have the right to:</LP>
              <LUL
                items={[
                  <>Access the personal information we hold about you</>,
                  <>Request correction of inaccurate information</>,
                  <>Request deletion of your personal information</>,
                  <>Opt out of marketing communications at any time</>,
                ]}
              />
            </>
          ),
        },
        {
          id: "cookies",
          title: "Cookies",
          body: (
            <LP>
              Our website uses essential cookies to maintain functionality. We do not use tracking cookies
              without your consent. You can control cookie settings through your browser. See our{" "}
              <a href="/cookie-policy" className="text-[var(--color-accent-bright)] hover:underline underline-offset-2">
                Cookie Policy
              </a>{" "}
              for details.
            </LP>
          ),
        },
        {
          id: "changes",
          title: "Changes to This Policy",
          body: (
            <LP>
              We may update this Privacy Policy from time to time. We will notify you of any material changes
              by posting the new policy on this page and updating the &ldquo;Last updated&rdquo; date.
            </LP>
          ),
        },
        {
          id: "contact",
          title: "Contact",
          body: (
            <LP>
              For privacy-related inquiries, contact us at{" "}
              <a
                href="mailto:privacy@elion.com.ng"
                className="text-[var(--color-accent-bright)] hover:underline underline-offset-2"
              >
                privacy@elion.com.ng
              </a>
              .
            </LP>
          ),
        },
      ]}
    />
  );
}
