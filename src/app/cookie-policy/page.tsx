import type { Metadata } from "next";
import { LegalDoc, LP, LUL, LegalReview } from "@/components/legal-doc";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description:
    "How ELION uses cookies and similar technologies on its website, and the choices available to you.",
  alternates: { canonical: "/cookie-policy" },
};

export default function CookiePolicyPage() {
  return (
    <LegalDoc
      title="Cookie Policy"
      description="How ELION uses cookies and similar technologies on its website."
      lastUpdated="September 2026"
      sections={[
        {
          id: "what-are-cookies",
          title: "What cookies are",
          body: (
            <>
              <LP>
                Cookies are small text files stored on your device when you visit a website. They are widely
                used to make websites work, work more efficiently, and to provide information to site owners.
              </LP>
            </>
          ),
        },
        {
          id: "how-we-use-cookies",
          title: "How ELION uses cookies",
          body: (
            <>
              <LP>ELION uses cookies for the following purposes:</LP>
              <LUL
                items={[
                  <>
                    <strong className="text-[var(--color-text-primary)]">Essential / strictly necessary</strong>{" "}
                    — required for the platform to function, including authentication and session cookies that
                    keep you signed in to the client or admin dashboard.
                  </>,
                  <>
                    <strong className="text-[var(--color-text-primary)]">Functionality</strong> — to remember
                    preferences you have made (where available).
                  </>,
                  <>
                    <strong className="text-[var(--color-text-primary)]">Analytics</strong> — we do not use
                    tracking cookies without your consent.
                  </>,
                ]}
              />
            </>
          ),
        },
        {
          id: "specific-cookies",
          title: "Cookies we set",
          body: (
            <>
              <LP>The Services are built on a managed authentication and database platform. The primary cookies in use are:</LP>
              <LUL
                items={[
                  <>
                    <strong className="text-[var(--color-text-primary)]">Session / auth cookies</strong> —
                    set when you sign in to the client or admin dashboard, so you stay authenticated.
                  </>,
                ]}
              />
              <LegalReview>
                Confirm the exact cookie names/domains currently issued (including any third-party platform
                cookies) and list them here once verified.
              </LegalReview>
            </>
          ),
        },
        {
          id: "controlling-cookies",
          title: "Controlling cookies",
          body: (
            <LP>
              You can control and delete cookies through your browser settings. Most browsers let you view,
              block or delete cookies. If you block essential cookies, parts of the Services (such as signing
              in) may not work correctly.
            </LP>
          ),
        },
        {
          id: "changes",
          title: "Changes to this policy",
          body: (
            <LP>
              We may update this Cookie Policy from time to time. Changes will be posted on this page with an
              updated &ldquo;Last updated&rdquo; date.
            </LP>
          ),
        },
        {
          id: "contact",
          title: "Contact",
          body: (
            <LP>
              Questions about this Cookie Policy can be sent to{" "}
              <a
                href="mailto:privacy@elion.com.ng"
                className="text-[var(--color-accent-bright)] hover:underline underline-offset-2"
              >
                privacy@elion.com.ng
              </a>
              . See also our{" "}
              <a href="/privacy" className="text-[var(--color-accent-bright)] hover:underline underline-offset-2">
                Privacy Policy
              </a>
              .
            </LP>
          ),
        },
      ]}
    />
  );
}
