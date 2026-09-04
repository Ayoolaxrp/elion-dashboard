"use client";
import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronDown, ArrowRight, Check, Sparkles } from "lucide-react";
import Link from "next/link";
import TierCards from "@/components/pricing/tier-cards";

const addOns = [
  { name: "Booking Integration", price: "NGN 75,000", desc: "Calendar sync, automated reminders, and scheduling", oneOff: true },
  { name: "CRM Setup", price: "NGN 100,000", desc: "HubSpot, Pipedrive, or Zoho CRM configuration", oneOff: true },
];

const faqs = [
  { q: "What is the difference between one-time setup and monthly support?", a: "One-time setup is the design, build, and deployment of your automation. You pay once and the automation is yours. Monthly support covers ongoing monitoring, maintenance, and improvements after the automation is live." },
  { q: "Can I start with Starter and upgrade later?", a: "Yes. Many businesses start with a single workflow and expand as they see results. Your initial investment counts toward future upgrades." },
  { q: "What happens after my support period ends?", a: "Your automation continues running. You can renew support, upgrade to a higher support tier, or manage it yourself. There is no forced renewal." },
  { q: "Do you offer payment plans?", a: "For projects above NGN 500,000, we can arrange a 50/50 payment split. 50% upfront, 50% on delivery." },
  { q: "Why do WhatsApp and Email automations have a monthly fee?", a: "The one-time setup builds and launches the automation. The monthly management fee covers the ongoing operation, maintenance, and optimisation of that system after launch, and includes monitoring, adjustments, and support. It is not a second setup fee." },
  { q: "Are WhatsApp and Meta charges included in your fees?", a: "No. ELION fees cover the automation work we do. Providers such as Meta (WhatsApp Business API) and email-sending services bill separately for their own usage, and we confirm the exact rate before you commit." },
];

const thirdParty = [
  "WhatsApp Business API (charged by Meta per conversation)",
  "Email providers like SendGrid, Resend, or SMTP services",
  "CRM software (HubSpot, Pipedrive, Zoho) if applicable",
  "Calendar and scheduling tools",
  "Voice AI infrastructure (e.g. Vapi) for AI receptionist voice calls; billed separately by the provider",
  "AI model usage, which may incur additional third-party charges depending on configuration and volume",
];

const receives = [
  "Custom automation designed for your workflow",
  "Integration with your existing tools",
  "Deployment and testing",
  "Dashboard access to monitor performance",
  "Documentation and handover",
  "You own everything — no platform lock-in",
  "Optional ongoing support and optimization",
];

function Reveal({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 20 }}
      whileInView={reduced ? {} : { opacity: 1, y: 0 }}
      viewport={reduced ? undefined : { once: true, amount: 0.12 }}
      transition={reduced ? undefined : { duration: 0.5, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function SectionHeading({ kicker, title, sub, center }: { kicker: string; title: string; sub?: string; center?: boolean }) {
  return (
    <div className={center ? "text-center mx-auto" : ""}>
      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--color-accent)] mb-3">{kicker}</p>
      <h2 className="text-2xl md:text-[28px] font-bold text-[var(--color-text-primary)] tracking-tight" style={{ fontFamily: "Space Grotesk,sans-serif" }}>{title}</h2>
      {sub && <p className="text-sm text-[var(--color-text-muted)] mt-2 max-w-2xl">{sub}</p>}
    </div>
  );
}

export default function PricingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const reduced = useReducedMotion();

  return (
    <div className="min-h-screen bg-[var(--color-surface-raised)]">
      {/* Header */}
      <section className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(79,124,255,0.08),transparent_55%)]" />
        <div className="relative max-w-4xl mx-auto px-6 pt-20 pb-16 md:pt-24 md:pb-20 text-center">
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 18 }}
            whileInView={reduced ? {} : { opacity: 1, y: 0 }}
            viewport={reduced ? undefined : { once: true }}
            transition={reduced ? undefined : { duration: 0.5, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--color-accent)]/25 bg-[var(--color-accent)]/[0.06] mb-8">
              <Sparkles className="w-3.5 h-3.5 text-[var(--color-accent)]" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">Transparent · No hidden fees · You own everything</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-[var(--color-text-primary)] tracking-tight" style={{ fontFamily: "Space Grotesk,sans-serif" }}>
              Pricing
            </h1>
            <p className="text-base text-[var(--color-text-muted)] mt-4 max-w-xl mx-auto leading-relaxed">
              One transparent implementation fee. Optional ongoing support. What we build is yours to keep.
            </p>
          </motion.div>
        </div>
      </section>

      {/* One-time implementation */}
      <section className="border-t border-[var(--color-border)]/60">
        <div className="max-w-6xl mx-auto px-6 py-16 md:py-24">
          <Reveal>
            <SectionHeading
              kicker="One-time implementation"
              title="Choose the level of automation your operation needs"
              sub="Pay once to design, build, configure, and deploy. The automation is yours to keep — no hidden renewals."
              center
            />
          </Reveal>
          <div className="mt-12">
            <TierCards ctaHref="/audit" ctaLabel="audit" showPayment callout="Most businesses start with Growth — lead response, follow-up and booking in one pipeline." />
          </div>
        </div>
      </section>

      {/* Add-ons */}
      <section className="border-t border-[var(--color-border)]/60">
        <div className="max-w-6xl mx-auto px-6 py-16 md:py-24">
          <Reveal>
            <SectionHeading kicker="Add-ons" title="Single integrations, added to any setup" center />
          </Reveal>
          <div className="mt-12 grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {addOns.map((addon, i) => (
              <Reveal key={addon.name} delay={i * 0.08}>
                <div className="h-full border border-[var(--color-border)] rounded-2xl p-7 bg-[var(--color-surface-raised)] hover:border-[var(--color-accent)]/25 transition-all">
                  <div className="flex items-start justify-between gap-6 mb-3 flex-wrap">
                    <h3 className="text-base font-semibold text-[var(--color-text-primary)]">{addon.name}</h3>
                    <div className="text-right shrink-0">
                      <p className="text-xl font-bold text-[var(--color-text-primary)] tracking-tight" style={{ fontFamily: "Space Grotesk,sans-serif" }}>{addon.price}</p>
                      <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider mt-0.5">one-time</p>
                    </div>
                  </div>
                  <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">{addon.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Third-party costs */}
      <section className="border-t border-[var(--color-border)]/60">
        <div className="max-w-4xl mx-auto px-6 py-16 md:py-24">
          <Reveal>
            <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)]/60 p-8 md:p-10">
              <div className="max-w-2xl">
                <SectionHeading kicker="Clarity" title="About third-party costs" sub="ELION implementation fees cover the design, build, configuration, and deployment of your automation systems. Some automations connect to third-party services that have their own pricing:" />
              </div>
              <div className="mt-8 grid sm:grid-cols-2 gap-x-10 gap-y-3">
                {thirdParty.map((item) => (
                  <div key={item} className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)]/70 mt-2 shrink-0" />
                    <span className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{item}</span>
                  </div>
                ))}
              </div>
              <p className="text-sm text-[var(--color-text-muted)] mt-8 leading-relaxed max-w-2xl">
                We always clarify which costs are ELION fees and which are third-party service charges before you commit.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* What you receive */}
      <section className="border-t border-[var(--color-border)]/60">
        <div className="max-w-4xl mx-auto px-6 py-16 md:py-24">
          <Reveal>
            <div className="text-center mb-10">
              <SectionHeading kicker="Ownership" title="What you receive" sub="Every implementation is delivered as a system you own — built around how your business actually operates." center />
            </div>
            <div className="grid sm:grid-cols-2 gap-x-10 gap-y-4 max-w-2xl mx-auto">
              {receives.map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-[var(--color-success)]/12 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-[var(--color-success)]" />
                  </span>
                  <span className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{item}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-[var(--color-border)]/60 bg-[var(--color-surface)]">
        <div className="max-w-2xl mx-auto px-6 py-16 md:py-24">
          <SectionHeading kicker="FAQ" title="Frequently asked questions" center />
          <div className="mt-10 space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  aria-expanded={openFaq === i}
                  className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left cursor-pointer hover:bg-[var(--color-accent)]/[0.02] transition-colors"
                >
                  <span className="text-sm font-semibold text-[var(--color-text-primary)]">{faq.q}</span>
                  <span className={"shrink-0 transition-transform duration-300 " + (openFaq === i ? "rotate-180" : "")}>
                    <ChevronDown className="w-4 h-4 text-[var(--color-text-muted)]" />
                  </span>
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-6">
                    <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(79,124,255,0.09),transparent_55%)]" />
        <div className="relative max-w-2xl mx-auto px-6 py-20 md:py-28 text-center">
          <Reveal>
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-text-primary)] tracking-tight mb-4" style={{ fontFamily: "Space Grotesk,sans-serif" }}>
              Not sure which tier fits?
            </h2>
            <p className="text-base text-[var(--color-text-muted)] mb-8 leading-relaxed max-w-lg mx-auto">
              Run a free audit. We will find the leaks and recommend the exact system your business needs — no guesswork.
            </p>
            <Link
              href="/audit"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[var(--color-accent)] text-white rounded-xl font-semibold text-sm hover:bg-[var(--color-accent-hover)] shadow-lg shadow-[var(--color-accent)]/20 transition-all"
            >
              Run Free Business Audit <ArrowRight className="w-4 h-4" />
            </Link>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
