"use client";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight, Check, Minus, Sparkles, Search, SlidersHorizontal,
  Hammer, FlaskConical, Rocket, KeyRound, ShieldCheck,
} from "lucide-react";
import { ELION_TIERS, ELION_IMPLEMENTATION, ELION_SUPPORT_PLANS, type PricingTier } from "@/lib/pricing";
import { PaymentBlock } from "@/components/pricing/payment-block";

interface TierCardsProps {
  /** where the primary CTA goes (defaults to the audit) */
  ctaHref?: string;
  /** true to append the manual payment block under the tiers */
  showPayment?: boolean;
  /** true to show the full feature list; false = condensed (homepage) */
  detailed?: boolean;
  /** guidance callout shown under the grid, e.g. "Most clients start with Growth" */
  callout?: string;
  /** "Start with an audit" or "Get Started" — which CTA appears on each card */
  ctaLabel?: "audit" | "getStarted";
}

const STEP_ICONS: Record<string, { icon: typeof Search; color: string }> = {
  Discover: { icon: Search, color: "text-[var(--color-accent)]" },
  Configure: { icon: SlidersHorizontal, color: "text-[var(--color-accent)]" },
  Build: { icon: Hammer, color: "text-[var(--color-accent)]" },
  Test: { icon: FlaskConical, color: "text-[var(--color-accent)]" },
  Deploy: { icon: Rocket, color: "text-[var(--color-accent)]" },
  Handover: { icon: KeyRound, color: "text-[var(--color-success)]" },
};

function TierCard({ tier, ctaHref, detailed, ctaLabel, reduced, index }: { tier: PricingTier; ctaHref: string; detailed: boolean; ctaLabel: "audit" | "getStarted"; reduced: boolean | null; index: number }) {
  const bullet = (f: { text: string; included: boolean }) =>
    f.included ? <Check className="w-3.5 h-3.5 text-[var(--color-accent)] shrink-0 mt-0.5" /> : <Minus className="w-3.5 h-3.5 text-[var(--color-text-muted)]/50 shrink-0 mt-0.5" />;

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 22 }}
      whileInView={reduced ? {} : { opacity: 1, y: 0 }}
      viewport={reduced ? undefined : { once: true, amount: 0.12 }}
      transition={reduced ? undefined : { duration: 0.5, delay: index * 0.08, ease: "easeOut" }}
      className={`relative flex flex-col rounded-2xl border p-6 sm:p-7 transition-all ${tier.popular ? "border-[var(--color-accent)]/50 bg-[var(--color-accent)]/[0.04] shadow-xl shadow-[var(--color-accent)]/10" : "border-[var(--color-border)] bg-[var(--color-surface-raised)] hover:border-[var(--color-accent)]/30"}`}
    >
      {tier.popular && (
        <motion.span
          initial={reduced ? false : { opacity: 0, scale: 0.8 }}
          whileInView={reduced ? {} : { opacity: 1, scale: 1 }}
          viewport={reduced ? undefined : { once: true }}
          transition={reduced ? undefined : { delay: 0.15 + index * 0.08, type: "spring" as const, stiffness: 320, damping: 22 }}
          className="absolute -top-3 left-6 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--color-accent)] text-white text-[10px] font-bold uppercase tracking-wider"
        >
          <Sparkles className="w-3 h-3" /> Most popular
        </motion.span>
      )}
      <h3 className="text-lg font-bold text-[var(--color-text-primary)]">{tier.name}</h3>
      <p className="text-xs text-[var(--color-text-muted)] mt-1">{tier.bestFor}</p>
      <div className="mt-4 flex items-end gap-1.5">
        <span className={`text-3xl font-bold tracking-tight ${tier.popular ? "text-[var(--color-accent-bright)]" : "text-[var(--color-text-primary)]"}`} style={{ fontFamily: "Space Grotesk,sans-serif" }}>
          {tier.price}
        </span>
        <span className="text-[10px] text-[var(--color-text-muted)] pb-1 uppercase tracking-wider">{tier.period}</span>
      </div>
      <p className="text-xs text-[var(--color-text-secondary)] mt-2 leading-relaxed">{tier.description}</p>

      <ul className={`mt-5 space-y-2 text-xs text-[var(--color-text-secondary)] ${detailed ? "" : "hidden"}`}>
        {tier.features.map((f, i) => (
          <li key={i} className={`flex items-start gap-2 ${f.included ? "" : "opacity-50"}`}>
            {bullet(f)}
            <span>{f.text}</span>
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-6">
        <Link
          href={ctaHref}
          className={`inline-flex w-full items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${tier.popular ? "bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)]" : "border border-[var(--color-border)] text-[var(--color-text-primary)] hover:border-[var(--color-accent)]/40"}`}
        >
          {ctaLabel === "audit" ? "Start with the Free Audit" : "Get Started"} <ArrowRight className="w-3.5 h-3.5" />
        </Link>
        <p className="text-center text-[10px] text-[var(--color-text-muted)] mt-2">{tier.supportDays}</p>
      </div>
    </motion.div>
  );
}

export default function TierCards({ ctaHref = "/audit", showPayment = false, detailed = true, callout, ctaLabel = "audit" }: TierCardsProps) {
  const reduced = useReducedMotion();

  return (
    <div>
      <div className="grid md:grid-cols-3 gap-5">
        {ELION_TIERS.map((t, i) => (
          <TierCard key={t.id} tier={t} ctaHref={ctaHref} detailed={detailed} ctaLabel={ctaLabel} reduced={reduced} index={i} />
        ))}
      </div>

      {/* Implementation pipeline — animated, one-time reveal */}
      <motion.div
        initial={reduced ? false : { opacity: 0, y: 18 }}
        whileInView={reduced ? {} : { opacity: 1, y: 0 }}
        viewport={reduced ? undefined : { once: true, amount: 0.25 }}
        transition={reduced ? undefined : { duration: 0.5, ease: "easeOut" }}
        className="mt-10 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-6 sm:p-8 overflow-hidden"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)] mb-5 text-center">
          Every ELION implementation includes
        </p>
        <div className="flex flex-wrap items-center justify-center gap-y-3">
          {ELION_IMPLEMENTATION.map((step, i) => {
            const meta = STEP_ICONS[step] || { icon: Check, color: "text-[var(--color-accent)]" };
            const StepIcon = meta.icon;
            return (
              <span key={step} className="flex items-center">
                {i > 0 && (
                  <motion.span
                    initial={reduced ? false : { opacity: 0, scaleX: 0 }}
                    whileInView={reduced ? {} : { opacity: 1, scaleX: 1 }}
                    viewport={reduced ? undefined : { once: true }}
                    transition={reduced ? undefined : { delay: 0.12 + i * 0.1, duration: 0.3 }}
                    className="hidden sm:flex w-6 lg:w-8 h-px bg-gradient-to-r from-[var(--color-border)] via-[var(--color-accent)]/50 to-[var(--color-border)] mx-0.5 origin-left"
                    aria-hidden="true"
                  />
                )}
                <motion.span
                  initial={reduced ? false : { opacity: 0, y: 10, scale: 0.94 }}
                  whileInView={reduced ? {} : { opacity: 1, y: 0, scale: 1 }}
                  viewport={reduced ? undefined : { once: true, amount: 0.4 }}
                  transition={reduced ? undefined : { delay: i * 0.1, duration: 0.4, ease: "easeOut" }}
                  whileHover={reduced ? undefined : { y: -2 }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-[11px] sm:text-xs font-semibold text-[var(--color-text-primary)]"
                >
                  <StepIcon className={`w-3.5 h-3.5 ${meta.color}`} />
                  {step}
                </motion.span>
              </span>
            );
          })}
        </div>
        <motion.p
          initial={reduced ? false : { opacity: 0 }}
          whileInView={reduced ? {} : { opacity: 1 }}
          viewport={reduced ? undefined : { once: true }}
          transition={reduced ? undefined : { delay: 0.75, duration: 0.4 }}
          className="text-center text-xs text-[var(--color-text-muted)] mt-5 flex items-center justify-center gap-1.5 flex-wrap"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-[var(--color-success)] shrink-0" />
          One-time implementation fee — you own everything we build. No hidden renewal.
        </motion.p>
      </motion.div>

      {callout && (
        <motion.p
          initial={reduced ? false : { opacity: 0, y: 8 }}
          whileInView={reduced ? {} : { opacity: 1, y: 0 }}
          viewport={reduced ? undefined : { once: true }}
          transition={reduced ? undefined : { delay: 0.1, duration: 0.4 }}
          className="text-center text-sm text-[var(--color-text-secondary)] mt-8"
        >
          <span className="font-semibold text-[var(--color-text-primary)]">{callout}</span>
        </motion.p>
      )}

      {/* Optional ongoing support */}
      <div className="mt-10">
        <motion.p
          initial={reduced ? false : { opacity: 0 }}
          whileInView={reduced ? {} : { opacity: 1 }}
          viewport={reduced ? undefined : { once: true, amount: 0.6 }}
          transition={reduced ? undefined : { duration: 0.4 }}
          className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)] mb-4 text-center"
        >
          Optional ongoing support
        </motion.p>
        <div className="grid md:grid-cols-2 gap-5 max-w-3xl mx-auto">
          {ELION_SUPPORT_PLANS.map((s, i) => (
            <motion.div
              key={s.name}
              initial={reduced ? false : { opacity: 0, y: 16 }}
              whileInView={reduced ? {} : { opacity: 1, y: 0 }}
              viewport={reduced ? undefined : { once: true, amount: 0.15 }}
              transition={reduced ? undefined : { duration: 0.45, delay: i * 0.1, ease: "easeOut" }}
              className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-6"
            >
              <div className="flex items-end gap-1.5">
                <span className="text-2xl font-bold text-[var(--color-text-primary)]">{s.price}</span>
                <span className="text-[10px] text-[var(--color-text-muted)] pb-1 uppercase tracking-wider">{s.period}</span>
              </div>
              <h4 className="text-sm font-bold text-[var(--color-text-primary)] mt-2">{s.name}</h4>
              <p className="text-xs text-[var(--color-text-secondary)] mt-1 leading-relaxed">{s.description}</p>
              <ul className="mt-4 space-y-1.5 text-xs text-[var(--color-text-secondary)]">
                {s.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-[var(--color-accent)] shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              {s.note && <p className="text-[10px] text-[var(--color-text-muted)] italic mt-3">{s.note}</p>}
            </motion.div>
          ))}
        </div>
      </div>

      {showPayment && (
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 16 }}
          whileInView={reduced ? {} : { opacity: 1, y: 0 }}
          viewport={reduced ? undefined : { once: true, amount: 0.15 }}
          transition={reduced ? undefined : { duration: 0.45, ease: "easeOut" }}
          className="mt-10 max-w-2xl mx-auto"
        >
          <PaymentBlock />
        </motion.div>
      )}
    </div>
  );
}
