"use client";

import Link from "next/link";
import { ElionLogo } from "@/components/elion-logo";
import { ArrowRight, CalendarDays, LifeBuoy, SearchCheck } from "lucide-react";

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
      { label: "Booking", href: "/book" },
      { label: "Client Dashboard", href: "/login" },
      { label: "Pricing", href: "/pricing" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Audit Methodology", href: "/methodology" },
      { label: "Support", href: "/support" },
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

        {/* Commercial decision path */}
        <section className="col-span-2 mb-2 border-y border-[var(--color-border)]/70 py-8" aria-labelledby="footer-next-step">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--color-accent-bright)]">Choose your next step</p>
              <h2 id="footer-next-step" className="mt-2 text-xl font-semibold tracking-tight text-[var(--color-text-primary)]">Start where you are.</h2>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-[var(--color-text-muted)]">Not sure what you need? Start with diagnosis. Already know the problem? Talk implementation. Already a client? Get support.</p>
          </div>
          <div className="mt-6 grid gap-px overflow-hidden border border-[var(--color-border)]/70 bg-[var(--color-border)]/70 md:grid-cols-3">
            <Link href="/audit" className="group bg-[var(--color-surface-raised)] p-4 transition-colors hover:bg-[var(--color-surface-elevated)]">
              <SearchCheck className="h-4 w-4 text-[var(--color-accent-bright)]" />
              <p className="mt-3 text-sm font-semibold text-[var(--color-text-primary)]">I need clarity</p>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">Run the free business audit.</p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-accent-bright)]">Find the leak <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" /></span>
            </Link>
            <Link href="/book" className="group bg-[var(--color-surface-raised)] p-4 transition-colors hover:bg-[var(--color-surface-elevated)]">
              <CalendarDays className="h-4 w-4 text-[var(--color-accent-bright)]" />
              <p className="mt-3 text-sm font-semibold text-[var(--color-text-primary)]">I know the problem</p>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">Book a discovery call.</p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-accent-bright)]">Discuss implementation <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" /></span>
            </Link>
            <Link href="/support" className="group bg-[var(--color-surface-raised)] p-4 transition-colors hover:bg-[var(--color-surface-elevated)]">
              <LifeBuoy className="h-4 w-4 text-[var(--color-text-secondary)]" />
              <p className="mt-3 text-sm font-semibold text-[var(--color-text-primary)]">I am already a client</p>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">Get help from support.</p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-accent-bright)]">Open support <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" /></span>
            </Link>
          </div>
        </section>

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
