import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "Elion — AI Automation Agency",
    template: "%s | Elion",
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
  authors: [{ name: "Elion" }],
  creator: "Elion",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://elion.ng",
    siteName: "Elion",
    title: "Elion — Fix Your Operational Leaks",
    description:
      "AI-powered systems that respond to leads, follow up automatically, recover dormant revenue, and book appointments — so your team only steps in when it matters.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Elion — AI Automation Agency",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Elion — Fix Your Operational Leaks",
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
    <html lang="en" className={`${inter.variable}`} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <meta name="theme-color" content="#0a0a1a" />

      </head>
      <body className="bg-zinc-950 text-white antialiased min-h-screen">
        <Sidebar />
        {/* Desktop: ml-[260px] (expanded) - controlled by CSS. Mobile: no margin (sidebar is overlay) */}
        <main className="min-h-screen md:ml-[260px] transition-all duration-300 p-4 md:p-6 pt-16 md:pt-6">{children}</main>
      </body>
    </html>
  );
}
