"use client";

import Link from "next/link";
import { useState } from "react";
import dynamic from "next/dynamic";
import { ArrowRight, PlayCircle, Activity } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import { ElionLogo } from "@/components/elion-logo";

// Lazy-load below-fold sections so the initial bundle stays small
const ProblemSection = dynamic(() => import("@/components/homepage-sections").then(m => m.ProblemSection), { ssr: true, loading: () => <div className="h-40" aria-hidden /> });
const SystemMap = dynamic(() => import("@/components/homepage-sections").then(m => m.SystemMap), { ssr: true, loading: () => <div className="h-40" aria-hidden /> });
const AuditSection = dynamic(() => import("@/components/homepage-sections").then(m => m.AuditSection), { ssr: true, loading: () => <div className="h-40" aria-hidden /> });
const DashboardPreview = dynamic(() => import("@/components/homepage-sections").then(m => m.DashboardPreview), { ssr: true, loading: () => <div className="h-40" aria-hidden /> });
const AdminSection = dynamic(() => import("@/components/homepage-sections").then(m => m.AdminSection), { ssr: true, loading: () => <div className="h-40" aria-hidden /> });
const HowItWorks = dynamic(() => import("@/components/homepage-sections").then(m => m.HowItWorks), { ssr: true, loading: () => <div className="h-40" aria-hidden /> });
const OwnershipSection = dynamic(() => import("@/components/homepage-sections").then(m => m.OwnershipSection), { ssr: true, loading: () => <div className="h-40" aria-hidden /> });
const PricingSection = dynamic(() => import("@/components/homepage-sections").then(m => m.PricingSection), { ssr: true, loading: () => <div className="h-40" aria-hidden /> });
const FaqSection = dynamic(() => import("@/components/homepage-sections").then(m => m.FaqSection), { ssr: true, loading: () => <div className="h-40" aria-hidden /> });
const FinalCta = dynamic(() => import("@/components/homepage-sections").then(m => m.FinalCta), { ssr: true, loading: () => <div className="h-40" aria-hidden /> });

const NAV_LINKS = [
  { label: "Solutions", href: "#systems" },
  { label: "How It Works", href: "#how" },
  { label: "Audit", href: "/audit" },
  { label: "Demo", href: "/demo" },
  { label: "Pricing", href: "/landing/pricing" },
  { label: "About", href: "/landing/about" },
];

/* ------------------------------- Nav --------------------------------- */

function SiteNav() {
  const [open, setOpen] = useState(false);
  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-nav">
      <nav className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" aria-label="ELION home" className="flex items-center">
          <ElionLogo size="md" />
        </Link>

        <div className="hidden md:flex items-center gap-7">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              className="text-sm text-[var(--color-text-secondary)] hover:text-white transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link href="/login" className="text-sm text-[var(--color-text-secondary)] hover:text-white transition-colors">
            Sign In
          </Link>
          <Link
            href="/audit"
            className="px-5 py-2 rounded-xl bg-[var(--color-accent)] text-white text-sm font-semibold hover:bg-[var(--color-accent-hover)] transition-all active:scale-[0.97]"
          >
            Run Free Audit
          </Link>
        </div>

        <button
          onClick={() => setOpen(!open)}
          className="md:hidden p-2 rounded-lg text-[var(--color-text-secondary)] hover:text-white transition-colors cursor-pointer"
          aria-label="Toggle navigation menu"
          aria-expanded={open}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </nav>

      {open && (
        <div className="md:hidden border-b border-[var(--color-border)]/50 bg-[var(--color-surface)]/95 backdrop-blur-xl">
          <div className="px-6 py-5 space-y-1">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                onClick={() => setOpen(false)}
                className="block py-2.5 text-sm text-[var(--color-text-secondary)] hover:text-white transition-colors"
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="block py-2.5 text-sm text-[var(--color-text-secondary)] hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/audit"
              onClick={() => setOpen(false)}
              className="mt-3 block w-full text-center px-5 py-3 rounded-xl bg-[var(--color-accent)] text-white text-sm font-semibold"
            >
              Run Free Audit
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

/* ------------------------------- Hero -------------------------------- */

function Hero() {
  // CSS-keyframe entrance (runs at first paint, no JS/hydration dependency,
  // so LCP is not blocked). Reduced-motion fallback handled in globals.css.
  return (
    <section className="relative pt-36 pb-20 md:pt-44 md:pb-28 px-6 overflow-hidden">
      {/* Radial-gradient glows instead of blur() filters (cheap to paint) */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 w-[720px] h-[420px] rounded-full pointer-events-none" style={{ background: "radial-gradient(closest-side, rgba(79,124,255,0.10), transparent 70%)" }} />
      <div className="absolute top-40 left-1/4 w-[300px] h-[300px] rounded-full pointer-events-none" style={{ background: "radial-gradient(closest-side, rgba(0,212,255,0.07), transparent 70%)" }} />

      <div className="relative max-w-4xl mx-auto text-center">
        <div className="animate-hero-in" style={{ animationDelay: "0ms" }}>
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] animate-pulse" />
            <span className="text-xs font-medium text-[var(--color-accent-bright)]">AI Operations for Growing Businesses</span>
          </span>
        </div>

        <h1
          className="animate-hero-in mt-8 text-5xl md:text-7xl font-bold text-[var(--color-text-primary)] leading-[1.04] tracking-[-0.03em]"
          style={{ animationDelay: "80ms" }}
        >
          Find the leaks in your business.
          <br />
          <span className="bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-cyan)] bg-clip-text text-transparent">
            Then automate them.
          </span>
        </h1>

        <p
          className="animate-hero-in mt-7 text-lg md:text-xl text-[var(--color-text-secondary)] max-w-2xl mx-auto leading-relaxed"
          style={{ animationDelay: "160ms" }}
        >
          ELION identifies where leads, follow-ups, bookings, and operational
          workflows are breaking down, then deploys systems to fix them.
        </p>

        <div className="animate-hero-in mt-10 flex flex-col sm:flex-row items-center justify-center gap-4" style={{ animationDelay: "240ms" }}>
          <Link
            href="/audit"
            className="group inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--color-accent)] text-white font-semibold hover:bg-[var(--color-accent-hover)] transition-all shadow-lg shadow-[var(--color-accent)]/20 active:scale-[0.97] px-8 py-4 text-base"
          >
            Run Your Free Business Audit
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/demo"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-light)] hover:text-white transition-all active:scale-[0.97] px-8 py-4 text-base"
          >
            <PlayCircle className="w-4 h-4" />
            See ELION in Action
          </Link>
        </div>

        <p className="animate-hero-in mt-8 text-xs text-[var(--color-text-muted)]" style={{ animationDelay: "320ms" }}>
          No credit card. No commitment. Evidence-based findings.
        </p>
      </div>
    </section>
  );
}

/* ------------------------- Product preview --------------------------- */

function ProductPreview() {
  const metrics = [
    { label: "Leads processed", value: "127", note: "this week" },
    { label: "Responses sent", value: "94", note: "automated" },
    { label: "Follow-ups triggered", value: "31", note: "on schedule" },
  ];
  const automations = [
    { name: "Lead Response", status: "Live", tone: "success" as const },
    { name: "Follow-Up", status: "Live", tone: "success" as const },
    { name: "Booking", status: "Not configured", tone: "muted" as const },
  ];
  return (
    <section className="px-6 pb-24 md:pb-32">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
            Product Preview (Illustrative)
          </p>
        </div>

        <div className="relative rounded-2xl border border-[var(--color-border)]/60 bg-[var(--color-surface-raised)] shadow-2xl shadow-black/40 overflow-hidden">
          <div className="flex items-center gap-1.5 px-5 py-3 border-b border-[var(--color-border)]/50 bg-[var(--color-surface)]/60">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-border-light)]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-border-light)]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-border-light)]" />
            <span className="ml-3 text-[11px] text-[var(--color-text-muted)] font-medium">ELION Operations</span>
          </div>

          <div className="p-6 md:p-8 grid md:grid-cols-2 gap-6">
            <div className="rounded-xl border border-[var(--color-border)]/50 bg-[var(--color-surface)] p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">Automation Health</p>
                <span className="flex items-center gap-1.5 text-[11px] text-[var(--color-success)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)] animate-pulse" />
                  Operational
                </span>
              </div>
              <div className="space-y-3">
                {automations.map((a) => (
                  <div key={a.name} className="flex items-center justify-between py-2 border-b border-[var(--color-border)]/40 last:border-0">
                    <span className="text-sm text-[var(--color-text-secondary)]">{a.name}</span>
                    <span
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-md ${
                        a.tone === "success"
                          ? "text-[var(--color-success)] bg-[var(--color-success)]/10"
                          : "text-[var(--color-text-muted)] bg-[var(--color-border)]/40"
                      }`}
                    >
                      {a.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {metrics.map((m) => (
                <div key={m.label} className="rounded-xl border border-[var(--color-border)]/50 bg-[var(--color-surface)] p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-[var(--color-text-muted)]">{m.label}</p>
                    <p className="text-[11px] text-[var(--color-text-secondary)] mt-0.5">{m.note}</p>
                  </div>
                  <span className="text-2xl font-bold text-[var(--color-text-primary)] tracking-tight">{m.value}</span>
                </div>
              ))}
              <div className="rounded-xl border border-[var(--color-border)]/50 bg-[var(--color-surface)] p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-[var(--color-text-muted)]">Activity</p>
                  <p className="text-[11px] text-[var(--color-text-secondary)] mt-0.5">last 24 hours</p>
                </div>
                <span className="flex items-center gap-1.5 text-xs text-[var(--color-success)]">
                  <Activity className="w-4 h-4" />
                  8 executions
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------- Page -------------------------------- */

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      <a href="#main" className="skip-to-content">Skip to content</a>
      <SiteNav />
      <main id="main">
        <Hero />
        <ProductPreview />
        <ProblemSection />
        <SystemMap />
        <AuditSection />
        <DashboardPreview />
        <AdminSection />
        <HowItWorks />
        <OwnershipSection />
        <PricingSection />
        <FaqSection />
        <FinalCta />
      </main>
      <SiteFooter />
    </div>
  );
}