"use client";
import { useState } from "react";
import { Check, X, ChevronDown, ChevronUp, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Reveal } from "@/components/reveal";

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
    href: "/audit",
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
    href: "/audit",
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
    href: "/audit",
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
    href: "/audit",
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

// Managed channel automations: one-time setup + ongoing monthly management.
// The monthly fee covers operation, maintenance and optimisation - it is NOT a second setup fee.
const channelPlans = [
  {
    name: "WhatsApp Business Automation",
    tagline: "Turn WhatsApp into a revenue channel that never sleeps.",
    setup: "NGN 50,000",
    monthly: "NGN 25,000 / month",
    features: [
      "Official WhatsApp Business API integration",
      "Automated lead capture and instant responses",
      "Qualification and routing workflow",
      "Follow-up sequences on WhatsApp",
      "Monitoring and monthly optimisation",
    ],
    note: "Meta charges separately per conversation. We will confirm the exact rate before launch.",
    popular: true,
  },
  {
    name: "Email Automation",
    tagline: "Consistent email follow-up without anyone having to remember.",
    setup: "NGN 25,000",
    monthly: "NGN 15,000 / month",
    features: [
      "Email automation setup and sequences",
      "Lead capture and instant autoresponders",
      "Scheduled follow-up campaigns",
      "Deliverability management",
      "Monitoring and monthly optimisation",
    ],
    note: "Email-sending provider (e.g. Resend or SMTP) bills separately. We will confirm the rate before launch.",
    popular: false,
  },
];

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

      {/* One-Time Setup */}
      <section className="border-b border-[var(--color-border)]">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <div className="mb-8">
            <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-1">One-time setup</h2>
            <p className="text-sm text-[var(--color-text-muted)]">
              Pay once to design, build, configure, and deploy your automation. The automation is yours to keep.
            </p>
          </div>

          <Reveal className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
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
          </Reveal>
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

          <Reveal delay={60} className="grid md:grid-cols-2 gap-4 max-w-3xl">
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
          </Reveal>
        </div>
      </section>

      {/* Managed channel automations */}
      <section className="border-b border-[var(--color-border)]">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <div className="mb-8">
            <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-1">Managed channel automations</h2>
            <p className="text-sm text-[var(--color-text-muted)] max-w-2xl leading-relaxed">
              Two pricing parts, clearly separated: a one-time setup fee to build and launch, and a monthly
              management fee to operate, maintain and optimise it. The monthly fee is not a second setup charge.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            {channelPlans.map((plan, i) => (
              <Reveal key={plan.name} delay={i * 80}>
                <div className={`h-full rounded-2xl border p-6 md:p-7 flex flex-col ${
                  plan.popular
                    ? "border-[var(--color-accent)] bg-[var(--color-surface-raised)] ring-1 ring-[var(--color-accent)]/30"
                    : "border-[var(--color-border)] bg-[var(--color-surface-raised)]"
                }`}>
                  {plan.popular && (
                    <div className="text-[10px] font-semibold text-[var(--color-accent-bright)] uppercase tracking-wider mb-3">Most requested</div>
                  )}
                  <h3 className="text-lg font-bold text-[var(--color-text-primary)] tracking-tight mb-1">{plan.name}</h3>
                  <p className="text-sm text-[var(--color-text-secondary)] mb-6">{plan.tagline}</p>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="rounded-xl border border-[var(--color-border)]/60 bg-[var(--color-surface)] p-4">
                      <p className="text-xs text-[var(--color-text-muted)] mb-1">Setup</p>
                      <p className="text-2xl font-bold text-[var(--color-text-primary)] tracking-tight">{plan.setup}</p>
                      <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">one-time</p>
                    </div>
                    <div className={`rounded-xl border p-4 ${
                      plan.popular ? "border-[var(--color-accent)]/30 bg-[var(--color-accent)]/[0.06]" : "border-[var(--color-border)]/60 bg-[var(--color-surface)]"
                    }`}>
                      <p className="text-xs text-[var(--color-text-muted)] mb-1">Management</p>
                      <p className={`text-2xl font-bold tracking-tight ${plan.popular ? "text-[var(--color-accent-bright)]" : "text-[var(--color-text-primary)]"}`}>{plan.monthly}</p>
                      <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">ongoing</p>
                    </div>
                  </div>

                  <ul className="space-y-2.5 mb-5">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-[var(--color-success)] shrink-0 mt-0.5" />
                        <span className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{f}</span>
                      </li>
                    ))}
                  </ul>

                  <p className="text-[11px] text-[var(--color-text-muted)] italic leading-relaxed mb-5">{plan.note}</p>

                  <a
                    href="/audit"
                    className={`mt-auto block w-full text-center py-3 rounded-xl text-sm font-semibold transition-colors ${
                      plan.popular
                        ? "bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)]"
                        : "bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-elevated)]"
                    }`}
                  >
                    Run Your Free Audit
                  </a>
                </div>
              </Reveal>
            ))}
          </div>
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
