"use client";

import Link from "next/link";
import { ElionLogo } from "@/components/elion-logo";

interface FooterLink {
  label: string;
  href: string;
}

const FOOTER_COLUMNS: { title: string; links: FooterLink[] }[] = [
  {
    title: "Product",
    links: [
      { label: "Automation Systems", href: "/docs/automations" },
      { label: "Free Business Audit", href: "/audit" },
      { label: "Booking", href: "/landing/book" },
      { label: "Client Dashboard", href: "/login" },
      { label: "Pricing", href: "/landing/pricing" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/landing/about" },
      { label: "Support", href: "/landing/support" },
      { label: "Documentation", href: "/docs" },
      { label: "Status", href: "/status" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Getting Started", href: "/docs/getting-started/what-is-elion" },
      { label: "How ELION Works", href: "/docs/getting-started/how-elion-works" },
      { label: "Audit Guide", href: "/docs/getting-started/running-your-free-audit" },
      { label: "Automation Guide", href: "/docs/automations/lead-response" },
      { label: "FAQ", href: "/#faq" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Cookie Policy", href: "/cookie-policy" },
      { label: "Acceptable Use", href: "/acceptable-use" },
      { label: "Third-Party Services", href: "/third-party-services" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-surface-raised)]">
      <div className="max-w-7xl mx-auto px-6 pt-16 pb-10">
        <div className="grid grid-cols-2 md:grid-cols-12 gap-x-6 gap-y-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-4">
            <ElionLogo size="md" className="mb-5" />
            <p className="text-sm leading-relaxed text-[var(--color-text-muted)] max-w-[240px]">
              AI operations for growing businesses. Find the leaks in your business. Then automate them.
            </p>
          </div>

          {/* Link columns */}
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title} className="md:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-primary)] mb-4">
                {col.title}
              </p>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label + l.href}>
                    <Link
                      href={l.href}
                      className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom strip */}
        <div className="mt-14 pt-7 border-t border-[var(--color-border)]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <p className="text-xs text-[var(--color-text-muted)]">
              © 2026 ELION. All rights reserved.
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">
              ELION™ &middot; AI operations for growing businesses.
            </p>
          </div>
          <p className="mt-5 text-[11px] leading-relaxed text-[var(--color-text-muted)]/80 max-w-4xl">
            ELION and its associated software, systems, automation workflows, processes, frameworks, designs,
            documentation, trademarks, and other materials constitute proprietary intellectual property owned
            by or licensed to ELION. Unauthorized use is prohibited. See our{" "}
            <Link href="/terms" className="underline underline-offset-2 hover:text-[var(--color-text-primary)] transition-colors">
              Terms of Service
            </Link>{" "}
            for details.
          </p>
        </div>
      </div>
    </footer>
  );
}
