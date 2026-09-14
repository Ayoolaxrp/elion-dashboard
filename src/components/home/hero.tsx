"use client";

import Link from "next/link";
import { ArrowRight, PlayCircle } from "lucide-react";

function OpsConsole() {
  const observations = [
    { label: "Observed leak", value: "Enquiries wait for a manual reply", tone: "text-[var(--color-warning)]" },
    { label: "Recommended system", value: "Lead Response", tone: "text-[var(--color-accent-bright)]" },
    { label: "Next step", value: "Confirm the opportunity in an audit", tone: "text-[var(--color-success)]" },
  ];

  return (
    <div className="border-l border-[var(--color-border-light)] pl-6 md:pl-8">
      <div className="mb-8">
        <p className="public-eyebrow">Illustrative diagnosis</p>
        <p className="mt-3 text-2xl font-semibold leading-tight tracking-[-0.025em] text-[var(--color-text-primary)]">A clearer next action.</p>
        <p className="mt-3 max-w-sm text-sm leading-7 text-[var(--color-text-secondary)]">ELION turns an observable business problem into a scoped system recommendation.</p>
      </div>
      <div className="divide-y divide-[var(--color-border)] border-y border-[var(--color-border)]">
        {observations.map((observation) => (
          <div key={observation.label} className="py-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">{observation.label}</p>
            <p className={`mt-1.5 text-sm font-medium ${observation.tone}`}>{observation.value}</p>
          </div>
        ))}
      </div>
      <p className="mt-5 text-[11px] text-[var(--color-text-muted)]">Example only · real findings follow an audit</p>
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative overflow-hidden px-6 pb-20 pt-36 md:pb-28 md:pt-44">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(ellipse_at_top,rgba(59,102,232,0.07),transparent_62%)]" aria-hidden />
      <div className="relative mx-auto max-w-7xl">
        <div className="grid items-center gap-16 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-24">
          <div className="max-w-3xl text-center lg:text-left">
            <div className="animate-hero-in">
              <span className="inline-flex items-center gap-2 border-l-2 border-[var(--color-accent)] pl-3 text-left">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" aria-hidden />
                <span className="text-xs font-medium text-[var(--color-accent-bright)]">AI operations for growing businesses</span>
              </span>
            </div>

            <h1 className="animate-hero-slide mt-8 display-type max-w-4xl text-[var(--color-text-primary)]">
              Find where your business is leaking
              <br className="hidden sm:block" />
              <span className="text-[var(--color-text-secondary)]"> time, leads, and revenue.</span>
            </h1>

            <p className="animate-hero-in mx-auto mt-6 max-w-xl text-base leading-7 text-[var(--color-text-secondary)] md:text-[17px] lg:mx-0">
              ELION audits your operations, identifies hidden bottlenecks, and builds automation systems around the problems your business actually has.
            </p>

            <div className="animate-hero-in mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row lg:items-start lg:justify-start">
              <Link href="/audit" className="public-primary group w-full px-7 py-3.5 text-base sm:w-auto">
                Start AI Assessment
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link href="/#how" className="public-secondary w-full px-7 py-3.5 text-base sm:w-auto">
                <PlayCircle className="h-4 w-4" />
                See How It Works
              </Link>
            </div>

            <div className="animate-hero-in mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-[var(--color-text-muted)] lg:justify-start">
              <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-[var(--color-success)]" />Audit first, not guesswork</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />You own what we build</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-[var(--color-text-muted)]" />Built for Nigerian businesses</span>
            </div>

            <p className="animate-hero-in mt-5 text-xs text-[var(--color-text-muted)] lg:text-left">No credit card. No commitment. Evidence-based findings.</p>
          </div>

          <div className="hidden lg:block">
            <OpsConsole />
          </div>
        </div>

        <div className="mt-16 flex flex-col items-center gap-2" aria-hidden>
          <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-muted)]/70">Scroll to see the method</span>
          <span className="h-8 w-px bg-[var(--color-border-light)]" />
        </div>
      </div>
    </section>
  );
}
