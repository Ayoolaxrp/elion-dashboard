import type { Metadata } from "next";
import { LegalDoc, LP, LUL, LegalReview } from "@/components/legal-doc";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The terms that govern access to and use of ELION's website, automation platforms and related services.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <LegalDoc
      title="Terms of Service"
      description="The terms governing access to and use of ELION's website, automation platforms and related services."
      lastUpdated="August 28, 2026"
      sections={[
        {
          id: "acceptance",
          title: "Acceptance of Terms",
          body: (
            <>
              <LP>
                By accessing or using the services provided by ELION (&ldquo;Company&rdquo;, &ldquo;we&rdquo;,
                &ldquo;us&rdquo;, or &ldquo;our&rdquo;), including our website, automation platforms, and
                related services (collectively, the &ldquo;Services&rdquo;), you agree to be bound by these
                Terms of Service (&ldquo;Terms&rdquo;).
              </LP>
              <LP>If you do not agree to these Terms, you must not access or use our Services.</LP>
            </>
          ),
        },
        {
          id: "services",
          title: "Services Description",
          body: (
            <>
              <LP>ELION provides business automation services including but not limited to:</LP>
              <LUL
                items={[
                  <>Lead response automation systems</>,
                  <>Follow-up sequence automation</>,
                  <>Revenue recovery campaigns</>,
                  <>Appointment booking engines</>,
                  <>Operations workflow automation</>,
                  <>Website and digital presence auditing</>,
                ]}
              />
            </>
          ),
        },
        {
          id: "payment",
          title: "Payment Terms",
          body: (
            <>
              <LP>
                All pricing is listed in Nigerian Naira (NGN) unless otherwise stated. Payment is due in full
                before implementation begins unless otherwise agreed in writing. One-time payments grant full
                ownership of the delivered automation workflows. Monthly retainer fees are billed on the 1st
                of each month.
              </LP>
              <LegalReview>
                Confirm whether ELION setup fees and recurring management fees should be defined here, and
                whether third-party provider charges should be stated as billed separately.
              </LegalReview>
            </>
          ),
        },
        {
          id: "ownership-ip",
          title: "Ownership and Intellectual Property",
          body: (
            <LP>
              Upon full payment, you own all automation workflows, configurations, and custom code built
              specifically for your business. ELION retains ownership of any pre-built components, frameworks,
              or tools used in the development process. Third-party services (such as WhatsApp Business API,
              email providers, CRM software, and hosting) are subject to their own terms and pricing, which
              are the responsibility of the client.
            </LP>
          ),
        },
        {
          id: "ip-notice",
          title: "Intellectual Property Notice",
          body: (
            <>
              <LP>&copy; 2026 ELION. All rights reserved.</LP>
              <LP>
                ELION and its associated software, systems, automation workflows, processes, frameworks,
                designs, documentation, trademarks, and other materials constitute proprietary intellectual
                property (&ldquo;Protected Materials&rdquo;) owned by or licensed to ELION.
              </LP>
              <LP>
                Except as expressly permitted by ELION&rsquo;s Terms of Use or a separate written agreement,
                you may not copy, reproduce, modify, distribute, publish, sell, sublicense, disclose, reverse
                engineer, create derivative works from, or commercially exploit the Protected Materials
                without prior written authorization from ELION.
              </LP>
              <LP>
                Unauthorized use may violate applicable copyright, trademark, trade-secret, contract, and
                other laws and may result in suspension of access and the pursuit of available legal and
                equitable remedies.
              </LP>
              <LP>
                <span className="font-semibold text-[var(--color-text-primary)]">ELION&trade;</span> &mdash; AI
                operations for growing businesses.
              </LP>
            </>
          ),
        },
        {
          id: "warranty",
          title: "Warranty and Support",
          body: (
            <>
              <LP>
                ELION warrants that delivered automation systems will function as specified in the agreed
                scope of work. If a system does not perform as documented within the applicable support period,
                ELION will address the issue at no additional cost.
              </LP>
              <LP>
                Results from automation depend on many factors including business processes, data quality,
                third-party service performance, and team adoption. ELION does not guarantee specific revenue
                or conversion outcomes.
              </LP>
              <LP>
                Monthly retainer services are billed on the 1st of each month and may be cancelled with 30 days
                written notice.
              </LP>
            </>
          ),
        },
        {
          id: "liability",
          title: "Limitation of Liability",
          body: (
            <LP>
              To the maximum extent permitted by law, ELION shall not be liable for any indirect, incidental,
              special, consequential, or punitive damages, or any loss of profits or revenue, whether incurred
              directly or indirectly, or any loss of data, use, goodwill, or other intangible losses resulting
              from your use of the Services.
            </LP>
          ),
        },
        {
          id: "termination",
          title: "Termination",
          body: (
            <LP>
              Either party may terminate the agreement with 30 days written notice. Upon termination, you
              retain ownership of all delivered automation workflows. Monthly retainer services will cease at
              the end of the current billing period.
            </LP>
          ),
        },
        {
          id: "governing-law",
          title: "Governing Law",
          body: (
            <LP>
              These Terms shall be governed by and construed in accordance with the laws of the Federal
              Republic of Nigeria. Any disputes shall be resolved in the courts of Lagos State, Nigeria.
            </LP>
          ),
        },
        {
          id: "contact",
          title: "Contact",
          body: (
            <LP>
              For questions about these Terms, contact us at{" "}
              <a
                href="mailto:legal@elion.com.ng"
                className="text-[var(--color-accent-bright)] hover:underline underline-offset-2"
              >
                legal@elion.com.ng
              </a>
              .
            </LP>
          ),
        },
      ]}
    />
  );
}
