import type { Metadata } from "next";
import "./globals.css";
import { RootShell } from "@/components/root-shell";

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
  metadataBase: new URL("https://elion.ng"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://elion.ng",
    siteName: "ELION",
    title: "ELION - Fix Your Operational Leaks",
    description:
      "Systems that respond to leads, follow up automatically, recover dormant revenue, and book appointments.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#0A0D14" />
      </head>
      <body className="bg-[var(--color-surface)] text-[var(--color-text-primary)] antialiased min-h-screen">
        <RootShell>{children}</RootShell>
      </body>
    </html>
  );
}
