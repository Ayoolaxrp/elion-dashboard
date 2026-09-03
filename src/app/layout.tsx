import type { Metadata, Viewport } from "next";
import "./globals.css";
import { RootShell } from "@/components/root-shell";
import SmoothScroll from "@/components/smooth-scroll";
import { ScrollProgress } from "@/components/scroll-progress";

export const metadata: Metadata = {
  title: {
    default: "ELION - Business Automation Systems",
    template: "%s | ELION",
  },
  description:
    "ELION identifies where your business loses time, leads, money, and operational efficiency. Then builds automation systems to fix those leaks.",
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
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://elion.com.ng",
    siteName: "ELION",
    title: "ELION - Fix Your Operational Leaks",
    description:
      "Systems that respond to leads, follow up automatically, recover dormant revenue, and book appointments.",
    images: [{ url: "/brand/elion-e-icon.png", width: 1254, height: 1254 }],
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
            "@type": "Organization",
            name: "ELION",
            url: "https://elion.com.ng",
            description: "ELION identifies where your business loses time, leads, money, and operational efficiency. Then builds automation systems to fix those leaks.",
            sameAs: [],
            contactPoint: {
              "@type": "ContactPoint",
              contactType: "customer service",
              availableLanguage: "English",
            },
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
