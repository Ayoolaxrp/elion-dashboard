import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, LifeBuoy } from "lucide-react";
import { DOC_CATEGORIES, DOC_ARTICLES_FLAT } from "@/content/docs";
import { DocsSearch } from "@/components/docs-search";

export const metadata: Metadata = {
  title: "Documentation",
  description:
    "Guides and reference for ELION: what the platform does, how to run an audit, connect Google Calendar, configure AI agents, and understand pricing.",
  alternates: { canonical: "/docs" },
};

const POPULAR = [
  { label: "Running Your Free Audit", href: "/docs/getting-started/running-your-free-audit" },
  { label: "How ELION Works", href: "/docs/getting-started/how-elion-works" },
  { label: "WhatsApp Lead Response", href: "/docs/automations/lead-response" },
  { label: "Booking Automation", href: "/docs/automations/booking-automation" },
  { label: "Understanding ELION Pricing", href: "/docs/billing/understanding-pricing" },
  { label: "Data & Security", href: "/docs/security/data-and-security" },
];

export default function DocsHome() {
  const totalArticles = DOC_ARTICLES_FLAT.length;
  return (
    <div>
      {/* Hero */}
      <section className="mb-12">
        <nav aria-label="Breadcrumb" className="text-xs text-[var(--color-text-muted)] mb-6">
          <Link href="/" className="hover:text-[var(--color-text-primary)] transition-colors">Home</Link>
          <span className="mx-2" aria-hidden>/</span>
          <span className="text-[var(--color-text-secondary)]">Documentation</span>
        </nav>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--color-text-primary)]">
          ELION Documentation
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--color-text-muted)]">
          Everything you need to understand ELION — the audit, the automation systems, how onboarding and
          activation work, and what each product needs to go live. {totalArticles} guides across{" "}
          {DOC_CATEGORIES.length} sections.
        </p>
        <div className="mt-7 max-w-xl">
          <DocsSearch
            docs={DOC_ARTICLES_FLAT.map((a) => ({
              categorySlug: a.categorySlug,
              categoryTitle: a.categoryTitle,
              slug: a.slug,
              title: a.title,
              description: a.description,
            }))}
          />
        </div>
      </section>

      {/* Category cards */}
      <section aria-label="Documentation categories" className="grid sm:grid-cols-2 gap-4">
        {DOC_CATEGORIES.map((cat) => (
          <Link
            key={cat.slug}
            href={`/docs/${cat.slug}`}
            className="group rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-6 transition-colors hover:border-[var(--color-border-light)]"
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-[var(--color-text-primary)] tracking-tight">
                {cat.title}
              </h2>
              <ArrowRight className="w-4 h-4 text-[var(--color-text-muted)] group-hover:text-[var(--color-accent-bright)] group-hover:translate-x-0.5 transition-all" aria-hidden />
            </div>
            <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">{cat.description}</p>
            <p className="mt-4 text-xs font-medium text-[var(--color-accent-bright)]">
              {cat.articles.length} {cat.articles.length === 1 ? "guide" : "guides"}
            </p>
          </Link>
        ))}
      </section>

      {/* Popular */}
      <section className="mt-14">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-4">
          Popular topics
        </h2>
        <ul className="grid sm:grid-cols-2 gap-x-8 gap-y-3">
          {POPULAR.map((p) => (
            <li key={p.href}>
              <Link
                href={p.href}
                className="group flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
              >
                <span className="h-1 w-1 rounded-full bg-[var(--color-accent)]/70 shrink-0" aria-hidden />
                {p.label}
                <ArrowRight className="w-3.5 h-3.5 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all text-[var(--color-accent-bright)]" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Help CTA */}
      <section className="mt-14 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-6 py-8 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div className="flex items-start gap-4">
          <div className="p-2.5 rounded-xl bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20">
            <LifeBuoy className="w-5 h-5 text-[var(--color-accent-bright)]" aria-hidden />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[var(--color-text-primary)]">Still have questions?</h2>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              Our team can walk you through audits, onboarding and any system in your scope.
            </p>
          </div>
        </div>
        <Link
          href="/landing/support"
          className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--color-accent)] text-white text-sm font-medium hover:bg-[var(--color-accent-hover)] transition-colors"
        >
          Contact support
          <ArrowRight className="w-4 h-4" aria-hidden />
        </Link>
      </section>
    </div>
  );
}
