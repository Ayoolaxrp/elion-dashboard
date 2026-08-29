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
    features: [
      { text: "1 automation workflow", included: true },
      { text: "WhatsApp OR email integration", included: true },
      { text: "Basic lead capture and response", included: true },
      { text: "Dashboard access", included: true },
      { text: "14 days of post-launch support", included: true },
      { text: "Multiple channels", included: false },
      { text: "CRM integration", included: false },
      { text: "Custom workflows", included: false },
    ],
    cta: "Get Started",
    href: "#audit",
    popular: false,
  },
  {
    name: "Growth",
    price: "NGN 350,000",
    period: "one-time",
    description: "A complete revenue workflow. Lead capture through to booking and follow-up.",
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
    href: "#audit",
    popular: true,
  },
  {
    name: "Scale",
    price: "NGN 750,000",
    period: "one-time",
    description: "Multiple interconnected automation systems for established businesses.",
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
    href: "#audit",
    popular: false,
  },
  {
    name: "Custom",
    price: "Let's talk",
    period: "",
    description: "Enterprise-grade automation for large teams with complex requirements.",
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
    href: "#audit",
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
    <div className="min-h-screen bg-white">
      {/* Header */}
      <section className="border-b border-zinc-200">
        <div className="max-w-5xl mx-auto px-6 py-16 text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-8 h-8 rounded bg-zinc-900 flex items-center justify-center">
              <span className="text-white text-xs font-bold">E</span>
            </div>
            <span className="text-lg font-bold text-zinc-900 tracking-tight">ELION</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-zinc-900 tracking-tight mb-3">Pricing</h1>
          <p className="text-sm text-zinc-500 max-w-lg mx-auto">
            Transparent pricing. No hidden fees. You own everything we build.
          </p>
        </div>
      </section>

      {/* One-Time Setup */}
      <section className="border-b border-zinc-200">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <div className="mb-8">
            <h2 className="text-xl font-bold text-zinc-900 mb-1">One-time setup</h2>
            <p className="text-sm text-zinc-500">
              Pay once to design, build, configure, and deploy your automation. The automation is yours to keep.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {setupPlans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-lg p-5 border ${
                  plan.popular ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 bg-white"
                }`}
              >
                {plan.popular && (
                  <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-3">Most popular</div>
                )}
                <h3 className={`text-base font-bold mb-1 ${plan.popular ? "text-white" : "text-zinc-900"}`}>{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className={`text-2xl font-bold ${plan.popular ? "text-white" : "text-zinc-900"}`}>{plan.price}</span>
                  {plan.period && <span className={`text-xs ${plan.popular ? "text-zinc-400" : "text-zinc-500"}`}>{plan.period}</span>}
                </div>
                <p className={`text-xs leading-relaxed mb-4 ${plan.popular ? "text-zinc-400" : "text-zinc-500"}`}>{plan.description}</p>
                <div className="space-y-2 mb-5">
                  {plan.features.map((f, i) => (
                    <div key={i} className="flex items-center gap-2">
                      {f.included ? (
                        <Check className={`w-3.5 h-3.5 shrink-0 ${plan.popular ? "text-emerald-400" : "text-emerald-600"}`} />
                      ) : (
                        <X className={`w-3.5 h-3.5 shrink-0 ${plan.popular ? "text-zinc-600" : "text-zinc-300"}`} />
                      )}
                      <span className={`text-xs ${f.included ? (plan.popular ? "text-zinc-200" : "text-zinc-700") : (plan.popular ? "text-zinc-600" : "text-zinc-400")}`}>
                        {f.text}
                      </span>
                    </div>
                  ))}
                </div>
                <a
                  href={plan.href}
                  className={`block w-full text-center py-2.5 rounded text-sm font-semibold transition-colors ${
                    plan.popular
                      ? "bg-white text-zinc-900 hover:bg-zinc-100"
                      : "bg-zinc-900 text-white hover:bg-zinc-800"
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
      <section className="border-b border-zinc-200 bg-zinc-50">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <div className="mb-8">
            <h2 className="text-xl font-bold text-zinc-900 mb-1">Monthly support</h2>
            <p className="text-sm text-zinc-500">
              Optional. For businesses that want ongoing monitoring, maintenance, and improvements after launch.
            </p>
            <p className="text-xs text-zinc-400 mt-1">Requires an existing ELION automation implementation.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-4 max-w-3xl">
            {supportPlans.map((plan) => (
              <div key={plan.name} className="bg-white border border-zinc-200 rounded-lg p-5">
                <h3 className="text-base font-bold text-zinc-900 mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-2xl font-bold text-zinc-900">{plan.price}</span>
                  <span className="text-xs text-zinc-500">{plan.period}</span>
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed mb-4">{plan.description}</p>
                <div className="space-y-2 mb-4">
                  {plan.features.map((f, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="text-xs text-zinc-700">{f.text}</span>
                    </div>
                  ))}
                </div>
                {plan.note && <p className="text-[11px] text-zinc-400 italic">{plan.note}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Add-Ons */}
      <section className="border-b border-zinc-200">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <h2 className="text-xl font-bold text-zinc-900 mb-1">Add-ons</h2>
          <p className="text-sm text-zinc-500 mb-8">Additional services that can be added to any plan.</p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {addOns.map((addon) => (
              <div key={addon.name} className="border border-zinc-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-zinc-900 mb-1">{addon.name}</h3>
                <p className="text-lg font-bold text-zinc-900 mb-2">{addon.price}</p>
                <p className="text-xs text-zinc-500 leading-relaxed">{addon.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-b border-zinc-200 bg-zinc-50">
        <div className="max-w-2xl mx-auto px-6 py-16">
          <h2 className="text-xl font-bold text-zinc-900 text-center mb-8">Frequently asked questions</h2>
          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-white border border-zinc-200 rounded-lg">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left cursor-pointer"
                >
                  <span className="text-sm font-semibold text-zinc-900">{faq.q}</span>
                  {openFaq === i ? <ChevronUp className="w-4 h-4 text-zinc-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-zinc-400 shrink-0" />}
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4">
                    <p className="text-sm text-zinc-500 leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section>
        <div className="max-w-2xl mx-auto px-6 py-16 text-center">
          <h2 className="text-2xl font-bold text-zinc-900 mb-3">Ready to get started?</h2>
          <p className="text-sm text-zinc-500 mb-6">Run a free leak audit to see where your business is losing money.</p>
          <Link
            href="/audit"
            className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-900 text-white rounded font-semibold text-sm hover:bg-zinc-800 transition-colors"
          >
            Run Free Leak Audit <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
