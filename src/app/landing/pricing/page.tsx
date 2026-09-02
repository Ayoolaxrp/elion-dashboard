"use client";
import { useState } from "react";
import { Check, X, ChevronDown, ChevronUp, ArrowRight } from "lucide-react";
import Link from "next/link";

const setupPlans = [
  {
    name: "Starter",
    price: "NGN 100,000",
    period: "one-time",
    description: "One automation workflow for small businesses getting started with automation.",
    built: "We build one focused workflow. For example, an automated lead response that captures enquiries from WhatsApp or your website and sends an instant reply.",
    features: [
      { text: "1 automation workflow", included: true },
      { text: "WhatsApp OR email integration", included: true },
      { text: "Basic lead capture and response", included: true },
      { text: "Dashboard access with live data", included: true },
      { text: "14 days of post-launch support", included: true },
      { text: "Multiple channels", included: false },
      { text: "CRM integration", included: false },
      { text: "Custom workflows", included: false },
    ],
    cta: "Get Started",
    href: "/funnel",
    popular: false,
  },
  {
    name: "Growth",
    price: "NGN 350,000",
    period: "one-time",
    description: "A complete revenue workflow. Lead capture through to booking and follow-up.",
    built: "We build a complete lead-to-booking system. Capture, qualify, respond instantly, follow up automatically, and book appointments. The full revenue loop.",
    features: [
      { text: "1 complete revenue workflow", included: true },
      { text: "WhatsApp + email integration", included: true },
      { text: "Lead capture, qualify, follow-up, booking", included: true },
      { text: "CRM integration", included: true },
      { text: "30 days of post-launch support", included: true },
      { text: "Dashboard with live data", included: true },
      { text: "Custom workflows", included: false },
      { text: "Multiple interconnected systems", included: false },
    ],
    cta: "Get Started",
    href: "/funnel",
    popular: true,
  },
  {
    name: "Scale",
    price: "NGN 750,000",
    period: "one-time",
    description: "Multiple interconnected automation systems for established businesses.",
    built: "We build every system your business needs. Lead response, follow-up, booking, revenue recovery, operations, and custom workflows. All connected, all in one dashboard.",
    features: [
      { text: "All 6 automation systems", included: true },
      { text: "Custom workflows built to spec", included: true },
      { text: "Full API integrations", included: true },
      { text: "CRM + email + WhatsApp + calendar", included: true },
      { text: "60 days of post-launch support", included: true },
      { text: "Priority support", included: true },
      { text: "Staff training", included: true },
      { text: "Documentation", included: true },
    ],
    cta: "Get Started",
    href: "/funnel",
    popular: false,
  },
  {
    name: "Custom",
    price: "Let's talk",
    period: "",
    description: "Enterprise-grade automation for large teams with complex requirements.",
    built: "We design a bespoke automation architecture for complex, multi-department operations. Dedicated engineer, custom SLA, and white-label options.",
    features: [
      { text: "Everything in Scale", included: true },
      { text: "Dedicated automation engineer", included: true },
      { text: "Custom SLA", included: true },
      { text: "White-label options", included: true },
      { text: "On-site training", included: true },
      { text: "Priority support", included: true },
      { text: "Quarterly business reviews", included: true },
      { text: "Scalable architecture", included: true },
    ],
    cta: "Contact Us",
    href: "/funnel",
    popular: false,
  },
];

const supportPlans = [
  {
    name: "Monthly Support",
    price: "NGN 50,000",
    period: "/month",
    description: "For businesses that want ongoing monitoring, maintenance, and improvements after their automation is live.",
    features: [
      { text: "System monitoring and uptime", included: true },
      { text: "Bug fixes and maintenance", included: true },
      { text: "Monthly performance report", included: true },
      { text: "Email support", included: true },
      { text: "Minor workflow adjustments", included: true },
    ],
    note: "Requires an existing ELION automation implementation.",
  },
  {
    name: "Growth Support",
    price: "NGN 150,000",
    period: "/month",
    description: "For businesses that want continuous improvement, new automation iterations, and strategic support.",
    features: [
      { text: "Everything in Monthly Support", included: true },
      { text: "New automation iterations", included: true },
      { text: "WhatsApp support", included: true },
      { text: "Strategy calls (2x/month)", included: true },
      { text: "A/B testing and optimisation", included: true },
      { text: "Priority response time", included: true },
    ],
    note: "Recommended for Growth and Scale plan clients.",
  },
];

const addOns = [
  { name: "WhatsApp Business API", price: "NGN 50,000/mo", desc: "Official WhatsApp Business API setup and management" },
  { name: "Email Automation", price: "NGN 25,000/mo", desc: "SMTP setup, email sequences, and deliverability management" },
  { name: "Booking Integration", price: "NGN 75,000", desc: "Calendar sync, automated reminders, and scheduling" },
  { name: "CRM Setup", price: "NGN 100,000", desc: "HubSpot, Pipedrive, or Zoho CRM configuration" },
];

const faqs = [
  { q: "What is the difference between one-time setup and monthly support?", a: "One-time setup is the design, build, and deployment of your automation. You pay once and the automation is yours. Monthly support covers ongoing monitoring, maintenance, and improvements after the automation is live." },
  { q: "Can I start with Starter and upgrade later?", a: "Yes. Many businesses start with a single workflow and expand as they see results. Your initial investment counts toward future upgrades." },
  { q: "What happens after my support period ends?", a: "Your automation continues running. You can renew support, upgrade to a higher support tier, or manage it yourself. There is no forced renewal." },
  { q: "Do you offer payment plans?", a: "For projects above NGN 500,000, we can arrange a 50/50 payment split. 50% upfront, 50% on delivery." },
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

      {/* One-Time Setup */}
      <section className="border-b border-[var(--color-border)]">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <div className="mb-8">
            <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-1">One-time setup</h2>
            <p className="text-sm text-[var(--color-text-muted)]">
              Pay once to design, build, configure, and deploy your automation. The automation is yours to keep.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {setupPlans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-lg p-5 border ${
                  plan.popular ? "border-[var(--color-accent)] bg-[var(--color-surface)] ring-1 ring-[var(--color-accent)]/30" : "border-[var(--color-border)] bg-[var(--color-surface-raised)]"
                }`}
              >
                {plan.popular && (
                  <div className="text-[10px] font-semibold text-[var(--color-accent)] uppercase tracking-wider mb-3">Most popular</div>
                )}
                <h3 className={`text-base font-bold mb-1 ${plan.popular ? "text-white" : "text-[var(--color-text-primary)]"}`}>{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className={`text-2xl font-bold ${plan.popular ? "text-white" : "text-[var(--color-text-primary)]"}`}>{plan.price}</span>
                  {plan.period && <span className={`text-xs ${plan.popular ? "text-[var(--color-text-muted)]" : "text-[var(--color-text-muted)]"}`}>{plan.period}</span>}
                </div>
                <p className={`text-xs leading-relaxed mb-3 ${plan.popular ? "text-[var(--color-text-muted)]" : "text-[var(--color-text-muted)]"}`}>{plan.description}</p>
                <div className={`rounded-lg p-3 mb-4 ${plan.popular ? "bg-[var(--color-accent)]/5 border border-[var(--color-accent)]/15" : "bg-[var(--color-surface)] border border-[var(--color-border)]/50"}`}>
                  <p className={`text-[11px] leading-relaxed ${plan.popular ? "text-[var(--color-text-secondary)]" : "text-[var(--color-text-muted)]"}`}>
                    {plan.built}
                  </p>
                </div>

                <div className="space-y-2 mb-5">
                  {plan.features.map((f, i) => (
                    <div key={i} className="flex items-center gap-2">
                      {f.included ? (
                        <Check className={`w-3.5 h-3.5 shrink-0 ${plan.popular ? "text-[var(--color-success)]" : "text-[var(--color-success)]"}`} />
                      ) : (
                        <X className={`w-3.5 h-3.5 shrink-0 ${plan.popular ? "text-[var(--color-text-secondary)]" : "text-[var(--color-text-muted)]"}`} />
                      )}
                      <span className={`text-xs ${f.included ? (plan.popular ? "text-[var(--color-text-primary)]" : "text-[var(--color-text-secondary)]") : (plan.popular ? "text-[var(--color-text-secondary)]" : "text-[var(--color-text-muted)]")}`}>
                        {f.text}
                      </span>
                    </div>
                  ))}
                </div>
                <a
                  href={plan.href}
                  className={`block w-full text-center py-2.5 rounded text-sm font-semibold transition-colors ${
                    plan.popular
                      ? "bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)]"
                      : "bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-elevated)]"
                  }`}
                >
                  {plan.cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Monthly Support */}
      <section className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <div className="mb-8">
            <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-1">Monthly support</h2>
            <p className="text-sm text-[var(--color-text-muted)]">
              Optional. For businesses that want ongoing monitoring, maintenance, and improvements after launch.
            </p>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">Requires an existing ELION automation implementation.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-4 max-w-3xl">
            {supportPlans.map((plan) => (
              <div key={plan.name} className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-lg p-5">
                <h3 className="text-base font-bold text-[var(--color-text-primary)] mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-2xl font-bold text-[var(--color-text-primary)]">{plan.price}</span>
                  <span className="text-xs text-[var(--color-text-muted)]">{plan.period}</span>
                </div>
                <p className="text-xs text-[var(--color-text-muted)] leading-relaxed mb-4">{plan.description}</p>
                <div className="space-y-2 mb-4">
                  {plan.features.map((f, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-[var(--color-success)] shrink-0" />
                      <span className="text-xs text-[var(--color-text-secondary)]">{f.text}</span>
                    </div>
                  ))}
                </div>
                {plan.note && <p className="text-[11px] text-[var(--color-text-muted)] italic">{plan.note}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Add-Ons */}
      <section className="border-b border-[var(--color-border)]">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-1">Add-ons</h2>
          <p className="text-sm text-[var(--color-text-muted)] mb-8">Additional services that can be added to any plan.</p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {addOns.map((addon) => (
              <div key={addon.name} className="border border-[var(--color-border)] rounded-lg p-4">
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">{addon.name}</h3>
                <p className="text-lg font-bold text-[var(--color-text-primary)] mb-2">{addon.price}</p>
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
                "Hosting for custom endpoints if needed",
              ].map((item) => (
                <div key={item} className="flex items-start gap-2">
                  <span className="text-[var(--color-text-muted)] mt-0.5">-</span>
                  <span className="text-xs text-[var(--color-text-muted)]">{item}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-[var(--color-text-muted)] mt-3">
              We will always clarify which costs are ELION implementation fees and which are third-party service charges before you commit.
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
