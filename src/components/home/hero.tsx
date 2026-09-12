"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, PlayCircle } from "lucide-react";
import { EnvBackdrop, EnvRingMotif } from "@/components/home/env";
import { useSafeReduced } from "@/components/home/use-safe-reduced";

/* ------------------------------------------------------------------ */
/* Layer 02 : abstract operational network (nodes + connections).      */
/* Decorative only: aria-hidden, paints as a single SVG.               */
/* ------------------------------------------------------------------ */
function NetworkField() {
  return (
    <svg
      className="absolute inset-0 w-full h-full"
      viewBox="0 0 1200 640"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      aria-hidden
    >
      {/* connection paths */}
      <path d="M120 520 C 260 420, 340 470, 470 380" stroke="rgba(124,155,255,0.16)" strokeWidth="1" />
      <path d="M470 380 C 600 300, 640 330, 760 250" stroke="rgba(124,155,255,0.13)" strokeWidth="1" />
      <path d="M760 250 C 860 190, 940 210, 1060 150" stroke="rgba(0,212,255,0.16)" strokeWidth="1" />
      <path d="M300 560 C 520 540, 700 470, 900 430" stroke="rgba(124,155,255,0.09)" strokeWidth="1" />
      <path d="M880 120 C 760 170, 700 250, 470 380" stroke="rgba(124,155,255,0.08)" strokeWidth="1" strokeDasharray="3 6" />

      {/* nodes */}
      <circle cx="120" cy="520" r="4" fill="rgba(124,155,255,0.5)" />
      <circle cx="470" cy="380" r="5" fill="rgba(124,155,255,0.65)" />
      <circle cx="760" cy="250" r="4" fill="rgba(0,212,255,0.6)" />
      <circle cx="1060" cy="150" r="5" fill="rgba(124,155,255,0.55)" />
      <circle cx="900" cy="430" r="3" fill="rgba(0,212,255,0.4)" />
      <circle cx="300" cy="560" r="3" fill="rgba(124,155,255,0.35)" />
      <circle cx="880" cy="120" r="3" fill="rgba(124,155,255,0.3)" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Layer 03 , the product layer: a compact ELION Operations console.   */
/* ------------------------------------------------------------------ */
function OpsConsole() {
  const observations = [
    { label: "Observed leak", value: "Enquiries wait for a manual reply", tone: "text-[var(--color-warning)]" },
    { label: "Recommended system", value: "Lead Response", tone: "text-[var(--color-accent-bright)]" },
    { label: "Next step", value: "Confirm the opportunity in an audit", tone: "text-[var(--color-success)]" },
  ];

  return (
    <div className="relative pl-4 md:pl-8">
      <div aria-hidden className="absolute left-0 top-6 bottom-6 w-px bg-gradient-to-b from-[var(--color-accent)]/70 via-[var(--color-border-light)] to-transparent" />
      <div className="mb-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--color-text-muted)]">Illustrative diagnosis</p>
        <p className="mt-3 text-2xl font-semibold leading-tight tracking-tight text-[var(--color-text-primary)]">A clearer next action.</p>
        <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">ELION turns an observable business problem into a scoped system recommendation.</p>
      </div>
      <div className="divide-y divide-[var(--color-border)]/60 border-y border-[var(--color-border)]/60">
        {observations.map((observation) => (
          <div key={observation.label} className="py-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">{observation.label}</p>
            <p className={`mt-1.5 text-sm font-medium ${observation.tone}`}>{observation.value}</p>
          </div>
        ))}
      </div>
      <p className="mt-5 text-[11px] text-[var(--color-text-muted)]">Example only · real findings follow an audit</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Hero : layered environment that separates as the visitor scrolls.   */
/* Entrance is CSS-keyframed (first paint, no JS) so LCP stays fast.   */
/* ------------------------------------------------------------------ */
export function Hero() {
  const ref = useRef<HTMLElement | null>(null);
  const reduced = useSafeReduced();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  // Layer movement rates (px per 100vh of hero scroll).
  const yBg = useTransform(scrollYProgress, [0, 1], [0, -46]); // Layer 01 : deep background
  const yNet = useTransform(scrollYProgress, [0, 1], [0, -150]); // Layer 02 : infrastructure
  const oNet = useTransform(scrollYProgress, [0.3, 0.9], [1, 0]);
  const yConsole = useTransform(scrollYProgress, [0, 1], [0, -250]); // Layer 03 : product
  const sConsole = useTransform(scrollYProgress, [0, 1], [1, 0.92]);
  const oConsole = useTransform(scrollYProgress, [0.12, 0.78], [1, 0]);
  const yMotif = useTransform(scrollYProgress, [0, 1], [0, -360]); // Layer 04 : foreground
  const oMotif = useTransform(scrollYProgress, [0, 0.45], [1, 0]);
  const yText = useTransform(scrollYProgress, [0, 0.42], [0, -140]);
  const oText = useTransform(scrollYProgress, [0, 0.42], [1, 0]);

  return (
    <section ref={ref} className="relative overflow-hidden pt-32 md:pt-40 pb-16 md:pb-24 px-6">
      {/* Layer 01 : deep background */}
      {reduced ? (
        <EnvBackdrop />
      ) : (
        <motion.div style={{ y: yBg }} className="absolute inset-0">
          <EnvBackdrop />
        </motion.div>
      )}

      {/* Layer 02 : infrastructure */}
      {!reduced && (
        <motion.div style={{ y: yNet, opacity: oNet }} className="absolute inset-0">
          <NetworkField />
        </motion.div>
      )}

      {/* Layer 04 : foreground depth accents */}
      {!reduced && (
        <motion.div style={{ y: yMotif, opacity: oMotif }} className="absolute inset-0">
          <EnvRingMotif className="right-[4%] top-24 w-56 h-56 hidden md:block" />
          <span className="absolute left-[6%] top-[38%] w-1 h-1 rounded-full bg-[var(--color-accent-cyan)]/60 hidden md:block" />
          <span className="absolute left-[12%] bottom-[18%] w-1.5 h-1.5 rounded-full bg-[var(--color-accent)]/40 hidden lg:block" />
        </motion.div>
      )}

      <div className="relative max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-20 items-center">
          {/* Copy */}
          <motion.div style={reduced ? undefined : { y: yText, opacity: oText }} className="text-center lg:text-left">
            <div className="animate-hero-in">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-node-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-accent)]" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[var(--color-accent)]" />
                </span>
                <span className="text-xs font-medium text-[var(--color-accent-bright)]">
                  AI Operations for Growing Businesses
                </span>
              </span>
            </div>

            <h1 className="animate-hero-slide mt-8 text-[2.75rem] leading-[1.04] sm:text-6xl md:text-7xl font-bold text-[var(--color-text-primary)] tracking-[-0.03em]">
              Find where your business is leaking
              <br className="hidden sm:block" />
              <span className="bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-cyan)] bg-clip-text text-transparent">
                time, leads, and revenue.
              </span>
            </h1>

            <p
              className="animate-hero-in mt-6 text-base md:text-lg text-[var(--color-text-secondary)] max-w-xl mx-auto lg:mx-0 leading-relaxed"
              style={{ animationDelay: "120ms" }}
            >
              ELION audits your operations, identifies hidden bottlenecks, and builds automation systems around the problems your business actually has.
            </p>

            <div className="animate-hero-in mt-9 flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-4" style={{ animationDelay: "200ms" }}>
              <Link
                href="/audit"
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--color-accent)] text-white font-semibold hover:bg-[var(--color-accent-hover)] transition-all shadow-lg shadow-[var(--color-accent)]/20 active:scale-[0.97] px-7 py-3.5 text-base"
              >
                Run Your Free Business Audit
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/#how"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-light)] hover:text-white transition-all active:scale-[0.97] px-7 py-3.5 text-base"
              >
                <PlayCircle className="w-4 h-4" />
                See How It Works
              </Link>
            </div>

            <div
              className="animate-hero-in mt-6 flex flex-wrap items-center justify-center lg:justify-start gap-3 text-xs text-[var(--color-text-muted)]"
              style={{ animationDelay: "240ms" }}
            >
              <span className="inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)]" />
                Audit first, not guesswork
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)]" />
                You own what we build
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-text-muted)]" />
                Nigeria-first, built for how local businesses actually operate
              </span>
            </div>

            <p
              className="animate-hero-in mt-7 text-xs text-[var(--color-text-muted)] text-center lg:text-left"
              style={{ animationDelay: "280ms" }}
            >
              No credit card. No commitment. Evidence-based findings.
            </p>
          </motion.div>

          {/* Layer 03 : product layer (desktop) */}
          {!reduced ? (
            <motion.div
              style={{ y: yConsole, scale: sConsole, opacity: oConsole }}
              className="hidden lg:block animate-fade-in"
            >
              <OpsConsole />
            </motion.div>
          ) : (
            <div className="hidden lg:block">
              <OpsConsole />
            </div>
          )}
        </div>

        {/* Scroll cue */}
        <div className="mt-14 flex flex-col items-center gap-2 lg:mt-10" aria-hidden>
          <span className="text-[10px] uppercase tracking-[0.25em] text-[var(--color-text-muted)]/70">
            Scroll
          </span>
          <motion.span
            animate={reduced ? undefined : { y: [0, 6, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            className="w-px h-8 bg-gradient-to-b from-[var(--color-accent)]/70 to-transparent block"
          />
        </div>
      </div>
    </section>
  );
}
