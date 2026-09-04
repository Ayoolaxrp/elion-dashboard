"use client";
import { useState } from "react";
import { ChevronDown, ChevronUp, ArrowRight } from "lucide-react";
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

export default function PricingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-[var(--color-surface-raised)]">
      {/* Header */}
      <section className="border-b border-[var(--color-border)]">
        <div className="max-w-5xl mx-auto px-6 py-16 text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-8 h-8 rounded bg-[var(--color-surface)] flex items-center justify-center">
              <span className="text-white text-xs font-bold">E</span>
            </div>
            <span className="text-lg font-bold text-[var(--color-text-primary)] tracking-tight">ELION</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-[var(--color-text-primary)] tracking-tight mb-3">Pricing</h1>
          <p className="text-sm text-[var(--color-text-muted)] max-w-lg mx-auto">
            Transparent pricing. No hidden fees. You own everything we build.
          </p>

          {/* Not sure? nudge */}
          <div className="mt-8 inline-flex flex-col sm:flex-row items-center gap-3 px-5 py-3 rounded-xl bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20">
            <span className="text-sm text-[var(--color-text-secondary)]">
              Not sure which plan? <span className="text-[var(--color-text-primary)] font-medium">Start with the free audit</span>, we will recommend the right tier based on your business.
            </span>
            <a href="/audit" className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--color-accent)] text-white text-xs font-semibold hover:bg-[var(--color-accent-hover)] transition-colors">
              Free Audit <ArrowRight className="w-3 h-3" />
            </a>
          </div>
        </div>
      </section>

      {/* One-Time Setup + Optional Support + Payment (canonical model) */}
      <section className="border-b border-[var(--color-border)]">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <div className="mb-10">
            <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-1">One-time implementation</h2>
            <p className="text-sm text-[var(--color-text-muted)]">
              Pay once to design, build, configure, and deploy. The automation is yours to keep — no hidden renewals.
            </p>
          </div>
          <TierCards ctaHref="/audit" ctaLabel="audit" showPayment callout="Most businesses start with Growth — lead response, follow-up and booking in one pipeline." />
        </div>
      </section>

      {/* Add-Ons */}
      <section className="border-b border-[var(--color-border)]">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-1">One-off add-ons</h2>
          <p className="text-sm text-[var(--color-text-muted)] mb-8">Single integrations that can be added to any setup.</p>

          <div className="grid md:grid-cols-2 gap-4 max-w-3xl">
            {addOns.map((addon) => (
              <div key={addon.name} className="border border-[var(--color-border)] rounded-xl p-5 bg-[var(--color-surface-raised)]">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">{addon.name}</h3>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold text-[var(--color-text-primary)] tracking-tight">{addon.price}</p>
                    <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider">one-time</p>
                  </div>
                </div>
                <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">{addon.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* Third-Party Costs Transparency */}
      <section className="border-b border-[var(--color-border)]">
        <div className="max-w-5xl mx-auto px-6 py-12">
          <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-lg p-6">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">About third-party costs</h3>
            <p className="text-xs text-[var(--color-text-muted)] leading-relaxed mb-3">
              ELION implementation fees cover the design, build, configuration, and deployment of your automation systems.
              Some automations connect to third-party services that have their own pricing:
            </p>
            <div className="grid md:grid-cols-2 gap-2">
              {[
                "WhatsApp Business API (charged by Meta per conversation)",
                "Email providers like SendGrid, Resend, or SMTP services",
                "CRM software (HubSpot, Pipedrive, Zoho) if applicable",
                "Calendar and scheduling tools",
                "Voice AI infrastructure (e.g. Vapi) for AI receptionist voice calls; billed separately by the provider",
                "AI model usage, which may incur additional third-party charges depending on configuration and volume",
              ].map((item) => (
                <div key={item} className="flex items-start gap-2">
                  <span className="text-[var(--color-text-muted)] mt-0.5">-</span>
                  <span className="text-xs text-[var(--color-text-muted)]">{item}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-[var(--color-text-muted)] mt-3">
              Voice AI infrastructure and usage charges are billed separately where applicable, and AI model usage may incur
              additional third-party charges depending on configuration and volume. ELION implementation and management fees never
              include provider charges. We will always clarify which costs are ELION fees and which are third-party service
              charges before you commit.
            </p>
          </div>
        </div>
      </section>
      {/* FAQ */}
      <section className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="max-w-2xl mx-auto px-6 py-16">
          <h2 className="text-xl font-bold text-[var(--color-text-primary)] text-center mb-8">Frequently asked questions</h2>
          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-lg">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left cursor-pointer"
                >
                  <span className="text-sm font-semibold text-[var(--color-text-primary)]">{faq.q}</span>
                  {openFaq === i ? <ChevronUp className="w-4 h-4 text-[var(--color-text-muted)] shrink-0" /> : <ChevronDown className="w-4 h-4 text-[var(--color-text-muted)] shrink-0" />}
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4">
                    <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* Ownership & What You Receive */}
      <section className="border-b border-[var(--color-border)]">
        <div className="max-w-5xl mx-auto px-6 py-12">
          <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-lg p-6">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">What you receive</h3>
            <div className="grid md:grid-cols-2 gap-3">
              {[
                "Custom automation designed for your workflow",
                "Integration with your existing tools",
                "Deployment and testing",
                "Dashboard access to monitor performance",
                "Documentation and handover",
                "You own everything - no platform lock-in",
                "Optional ongoing support and optimization",
              ].map((item) => (
                <div key={item} className="flex items-start gap-2">
                  <span className="text-[var(--color-success)] mt-0.5 text-xs">✓</span>
                  <span className="text-xs text-[var(--color-text-muted)]">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      {/* CTA */}
      <section>
        <div className="max-w-2xl mx-auto px-6 py-16 text-center">
          <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-3">Ready to get started?</h2>
          <p className="text-sm text-[var(--color-text-muted)] mb-6">Run a free leak audit to see where your business is losing money.</p>
          <Link
            href="/audit"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--color-accent)] text-white rounded-lg font-semibold text-sm hover:bg-[var(--color-accent-hover)] transition-colors"
          >
            Run Free Leak Audit <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
