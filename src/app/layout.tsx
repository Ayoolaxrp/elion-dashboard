import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";
import { ScrollProgress } from "@/components/scroll-progress";
import { FloatingContact } from "@/components/floating-contact";

export const metadata: Metadata = {
  title: {
    default: "ELIAN - AI Automation Agency",
    template: "%s | ELIAN",
  },
  description:
    "We find and fix operational leaks that cost businesses time, leads, and revenue. AI-powered lead response, follow-up automation, revenue recovery, and booking systems.",
  keywords: [
    "AI automation",
    "lead response",
    "follow-up automation",
    "revenue recovery",
    "booking automation",
    "Nigeria",
    "SaaS",
    "SMMA",
    "business automation",
    "WhatsApp automation",
  ],
  authors: [{ name: "ELIAN" }],
  creator: "ELIAN",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://elian.ng",
    siteName: "ELIAN",
    title: "ELIAN - Fix Your Operational Leaks",
    description:
      "AI-powered systems that respond to leads, follow up automatically, recover dormant revenue, and book appointments, so your team only steps in when it matters.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ELIAN AI Automation Agency",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ELIAN - Fix Your Operational Leaks",
    description:
      "AI-powered lead response, follow-up, revenue recovery, and booking systems for businesses in Nigeria and beyond.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <meta name="theme-color" content="#09090b" />
      </head>
      <body className="bg-zinc-50 text-zinc-900 antialiased min-h-screen">
        <a href="#main-content" className="skip-to-content">
          Skip to content
        </a>
        <ScrollProgress />
        <Sidebar />
        <main id="main-content" className="min-h-screen md:ml-[260px] transition-all duration-200 p-4 md:p-6 pt-16 md:pt-6">
          {children}
        </main>
        <FloatingContact />
      </body>
    </html>
  );
}
