import type { Metadata, Viewport } from "next";
import "./globals.css";
import { RootShell } from "@/components/root-shell";
import SmoothScroll from "@/components/smooth-scroll";
import { ScrollProgress } from "@/components/scroll-progress";

export const metadata: Metadata = {
  title: {
    default: "ELION - Revenue Recovery & Business Automation for Nigerian Businesses",
    template: "%s | ELION",
  },
  description:
    "ELION finds the leaks in your business and automates them. Free audit, evidence-based findings, automation systems for lead response, follow-up, booking and recovery for Nigerian businesses.",
  keywords: [
    "business automation",
    "lead response",
    "follow-up automation",
    "revenue recovery",
    "booking automation",
    "Nigeria",
    "WhatsApp automation",
  ],
  authors: [{ name: "ELION" }],
  creator: "ELION",
  metadataBase: new URL("https://elion.com.ng"),
  verification: {
    // Add official verification tokens here once claimed (e.g. Google, Bing, Pinterest).
    // Do not invent verification codes.
  },

  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://elion.com.ng",
    siteName: "ELION",
    title: "ELION - Revenue Recovery & Business Automation for Nigerian Businesses",
    description:
      "ELION finds the leaks in your business and automates them. Free audit, evidence-based findings, automation systems for lead response, follow-up, booking and recovery.",
    images: [{ url: "/brand/elion-e-icon.png", width: 1254, height: 1254, alt: "ELION" }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@elion",
    title: "ELION - Revenue Recovery & Business Automation for Nigerian Businesses",
    description:
      "ELION finds the leaks in your business and automates them. Free audit, evidence-based findings, automation systems for lead response, follow-up, booking and recovery.",
    images: ["https://elion.com.ng/brand/elion-e-icon.png"],
  },
  icons: {
    icon: "/brand/elion-e-icon.svg",
    shortcut: "/brand/elion-e-icon.svg",
    apple: "/brand/elion-e-icon.svg",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#0A0D14",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preload" href="/fonts/Inter-Variable.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/SpaceGrotesk-Variable.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "Organization",
                "name": "ELION",
                "url": "https://elion.com.ng",
                "logo": "https://elion.com.ng/brand/elion-e-icon.png",
                "description": "ELION identifies where your business loses time, leads, money, and operational efficiency. Then builds automation systems to fix those leaks.",
                "sameAs": [],
                "contactPoint": {
                  "@type": "ContactPoint",
                  "contactType": "customer service",
                  "availableLanguage": "English",
                },
              },
              {
                "@type": "WebSite",
                "name": "ELION",
                "url": "https://elion.com.ng",
                "description": "Free business audit and automation systems for Nigerian businesses: lead response, follow-up, booking, revenue recovery, and operations.",
                "potentialAction": {
                  "@type": "SearchAction",
                  "target": "https://elion.com.ng/?query={search_term_string}",
                  "query-input": "required name=search_term_string",
                },
              },
              {
                "@type": "SoftwareApplication",
                "name": "ELION",
                "applicationCategory": "BusinessApplication",
                "operatingSystem": "Web",
                "description": "ELION audits where businesses lose leads, time, and revenue, then builds and operates the automation systems that fix those leaks. Lead response, follow-up, booking, revenue recovery, and operations automation.",
                "url": "https://elion.com.ng",
                "offers": {
                  "@type": "Offer",
                  "priceCurrency": "NGN",
                  "availability": "https://schema.org/InStock",
                  "description": "Implementation from NGN 100,000 with optional monthly support. Free audit available.",
                },
              },
              {
                "@type": "FAQPage",
                "mainEntity": [
                  {
                    "@type": "Question",
                    "name": "What is AI automation for business?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "AI automation for business is the use of AI and workflow systems to handle repetitive tasks such as lead response, follow-up, booking, and customer support. The goal is not novelty; it is faster response, fewer lost opportunities, and less manual work.",
                    },
                  },
                  {
                    "@type": "Question",
                    "name": "How can businesses automate WhatsApp enquiries?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "Businesses can automate WhatsApp enquiries by connecting a WhatsApp Business number to a workflow that detects new messages, sends an approved first response, qualifies the lead, logs the interaction, and escalates to a human when needed. The key is an approved knowledge base and clear escalation rules, not generic auto-replies.",
                    },
                  },
                  {
                    "@type": "Question",
                    "name": "How does ELION help businesses?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "ELION audits a business's public digital presence to find where leads, time, and revenue are being lost, then builds and operates the automation systems that fix those leaks. Typical outcomes are faster lead response, structured follow-up, booking automation, revenue recovery, and internal workflow automation.",
                    },
                  },
                  {
                    "@type": "Question",
                    "name": "Is the ELION business audit free?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "Yes. ELION analyzes publicly available information about a business and delivers evidence-based findings at no cost. No credit card is required. The audit is a discovery step, not a sales promise.",
                    },
                  },
                  {
                    "@type": "Question",
                    "name": "Do businesses own the automation ELION builds?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "Yes. The workflows and configuration are documented and belong to the business. ELION’s optional Care plan covers monitoring, maintenance, and minor tuning, but there is no artificial lock-in. Systems continue running without ELION if the business chooses.",
                    },
                  },
                ],
              },
            ],
          }),
        }}
      />
    </head>
      <body className="bg-[var(--color-surface)] text-[var(--color-text-primary)] antialiased min-h-screen">
        <ScrollProgress />
        <SmoothScroll>
          <RootShell>{children}</RootShell>
        </SmoothScroll>
      </body>
    </html>
  );
}
