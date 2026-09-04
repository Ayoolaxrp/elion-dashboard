"use client";
import Link from "next/link";
import { ArrowRight, Check, Minus, Sparkles } from "lucide-react";
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

function TierCard({ tier, ctaHref, detailed, ctaLabel }: { tier: PricingTier; ctaHref: string; detailed: boolean; ctaLabel: "audit" | "getStarted" }) {
  const bullet = (f: { text: string; included: boolean }) =>
    f.included ? <Check className="w-3.5 h-3.5 text-[var(--color-accent)] shrink-0 mt-0.5" /> : <Minus className="w-3.5 h-3.5 text-[var(--color-text-muted)]/50 shrink-0 mt-0.5" />;

  return (
    <div className={`relative flex flex-col rounded-2xl border p-6 sm:p-7 transition-all ${tier.popular ? "border-[var(--color-accent)]/50 bg-[var(--color-accent)]/[0.04] shadow-xl shadow-[var(--color-accent)]/10" : "border-[var(--color-border)] bg-[var(--color-surface-raised)] hover:border-[var(--color-accent)]/30"}`}>
      {tier.popular && (
        <span className="absolute -top-3 left-6 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--color-accent)] text-white text-[10px] font-bold uppercase tracking-wider">
          <Sparkles className="w-3 h-3" /> Most popular
        </span>
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
    </div>
  );
}

export default function TierCards({ ctaHref = "/audit", showPayment = false, detailed = true, callout, ctaLabel = "audit" }: TierCardsProps) {
  return (
    <div>
      <div className="grid md:grid-cols-3 gap-5">
        {ELION_TIERS.map((t) => (
          <TierCard key={t.id} tier={t} ctaHref={ctaHref} detailed={detailed} ctaLabel={ctaLabel} />
        ))}
      </div>

      {/* Implementation pipeline */}
      <div className="mt-10 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)] mb-4 text-center">Every ELION implementation includes</p>
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          {ELION_IMPLEMENTATION.map((step, i) => (
            <div key={step} className="flex items-center gap-2 sm:gap-3">
              <span className="px-3 py-1.5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-xs font-semibold text-[var(--color-text-primary)]">
                {step}
              </span>
              {i < ELION_IMPLEMENTATION.length - 1 && <ArrowRight className="w-3 h-3 text-[var(--color-text-muted)]" />}
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-[var(--color-text-muted)] mt-4">
          One-time implementation fee — you own everything we build. No hidden renewal.
        </p>
      </div>

      {callout && (
        <p className="text-center text-sm text-[var(--color-text-secondary)] mt-8">
          <span className="font-semibold text-[var(--color-text-primary)]">{callout}</span>
        </p>
      )}

      {/* Optional ongoing support */}
      <div className="mt-10">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)] mb-4 text-center">Optional ongoing support</p>
        <div className="grid md:grid-cols-2 gap-5 max-w-3xl mx-auto">
          {ELION_SUPPORT_PLANS.map((s) => (
            <div key={s.name} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-6">
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
            </div>
          ))}
        </div>
      </div>

      {showPayment && (
        <div className="mt-10 max-w-2xl mx-auto">
          <PaymentBlock />
        </div>
      )}
    </div>
  );
}