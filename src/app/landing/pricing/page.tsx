"use client";
import { CheckCircle, ArrowRight, Zap, Shield, Clock, Settings, MessageSquare, Mail, Calendar, TrendingUp, Users, Phone } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const plans = [
  {
    name: "Starter",
    price: "100,000",
    period: "one-time",
    description: "One workflow. Perfect for small businesses testing automation.",
    features: [
      "1 automation workflow",
      "Lead capture + instant response (WhatsApp or Email)",
      "Basic reporting dashboard",
      "14 days support",
      "WhatsApp OR Email integration",
      "Up to 500 contacts",
    ],
    cta: "Start with Starter",
    popular: false,
    icon: <Zap className="w-6 h-6" />,
    highlight: "Best for solopreneurs",
  },
  {
    name: "Growth",
    price: "350,000",
    period: "one-time",
    description: "Complete lead management system. Our core offer for most businesses.",
    features: [
      "Lead capture → qualification → WhatsApp → CRM → follow-up → booking",
      "Multi-step follow-up sequences (email + WhatsApp + SMS)",
      "Revenue recovery for dormant contacts",
      "Appointment booking engine with reminders",
      "Full analytics dashboard",
      "60 days support",
      "Up to 2,000 contacts",
      "CSV import/export",
    ],
    cta: "Get Growth Plan",
    popular: true,
    icon: <Shield className="w-6 h-6" />,
    highlight: "Most Popular",
  },
  {
    name: "Scale",
    price: "750,000",
    period: "one-time",
    description: "Multiple interconnected workflows. Full automation suite for growing teams.",
    features: [
      "All 6 automation systems included",
      "Lead Response + Follow-Up + Recovery + Booking + Operations",
      "Custom workflow design",
      "Team notifications (Slack / Email / WhatsApp)",
      "Priority support (90 days)",
      "Monthly optimization calls",
      "API integrations",
      "Up to 10,000 contacts",
    ],
    cta: "Get Scale Plan",
    popular: false,
    icon: <TrendingUp className="w-6 h-6" />,
    highlight: "Best value",
  },
  {
    name: "Custom",
    price: "Let's Talk",
    period: "",
    description: "Tailored automation suite built for your specific business processes.",
    features: [
      "Everything in Scale, plus:",
      "Unlimited workflows & contacts",
      "Custom API integrations (ERP, POS, custom software)",
      "White-label options",
      "Dedicated automation engineer",
      "SLA guarantee (99.9% uptime)",
      "On-site training for your team",
      "Quarterly business reviews",
    ],
    cta: "Get a Custom Quote",
    popular: false,
    icon: <Settings className="w-6 h-6" />,
    highlight: "Enterprise",
  },
];

const addOns = [
  { icon: <MessageSquare className="w-5 h-5" />, name: "WhatsApp Business API", price: "NGN 50,000/mo", desc: "Official WhatsApp Business API setup and management" },
  { icon: <Mail className="w-5 h-5" />, name: "Email Automation", price: "NGN 25,000/mo", desc: "SMTP setup, email sequences, and deliverability management" },
  { icon: <Calendar className="w-5 h-5" />, name: "Booking Engine", price: "NGN 75,000", desc: "Google Calendar sync, auto-reminders, no-show recovery" },
  { icon: <Users className="w-5 h-5" />, name: "CRM Integration", price: "NGN 100,000", desc: "HubSpot, Pipedrive, or custom CRM setup and sync" },
  { icon: <Phone className="w-5 h-5" />, name: "Monthly Retainer", price: "NGN 150,000/mo", desc: "Ongoing optimization, new workflows, priority support" },
];

export default function PricingPage() {
  const [billing, setBilling] = useState<"onetime" | "monthly">("onetime");

  return (
    <div className="max-w-6xl mx-auto px-6 py-24">
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
          <Zap className="w-4 h-4" /> Pricing
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">Simple, Transparent Pricing</h1>
        <p className="text-zinc-400 max-w-2xl mx-auto text-lg">Start small, scale as you grow. You own the automations forever. Monthly retainer available for ongoing support.</p>

        {/* Billing toggle */}
        <div className="flex items-center justify-center gap-4 mt-8">
          <span className={`text-sm font-medium ${billing === "onetime" ? "text-white" : "text-zinc-500"}`}>One-Time</span>
          <button onClick={() => setBilling(billing === "onetime" ? "monthly" : "onetime")} className="relative w-12 h-6 rounded-full bg-zinc-700 transition-colors cursor-pointer">
            <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${billing === "monthly" ? "translate-x-6" : ""}`} />
          </button>
          <span className={`text-sm font-medium ${billing === "monthly" ? "text-white" : "text-zinc-500"}`}>Monthly Retainer</span>
          {billing === "monthly" && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Save up to 20%</span>}
        </div>
      </div>

      {/* Plans */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
        {plans.map((plan) => (
          <div key={plan.name} className={`relative p-6 rounded-2xl border transition-all duration-300 ${plan.popular ? "border-primary bg-primary/5 ring-1 ring-primary/20 scale-[1.02]" : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700"}`}>
            {plan.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-white text-xs font-semibold rounded-full">Most Popular</div>}
            {!plan.popular && plan.highlight && <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-zinc-800 text-zinc-300 text-xs font-medium rounded-full">{plan.highlight}</div>}

            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">{plan.icon}</div>
            <h3 className="text-lg font-bold mb-1">{plan.name}</h3>

            {plan.price === "Let's Talk" ? (
              <div className="mb-3"><span className="text-2xl font-bold">Custom</span></div>
            ) : (
              <div className="mb-3">
                <span className="text-2xl font-bold">NGN {plan.price}</span>
                {plan.period && <span className="text-xs text-zinc-500 ml-1">/ {plan.period}</span>}
              </div>
            )}

            <p className="text-sm text-zinc-400 mb-5 leading-relaxed">{plan.description}</p>

            <ul className="space-y-2.5 mb-6">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm">
                  <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span className="text-zinc-300">{f}</span>
                </li>
              ))}
            </ul>

            <Link href="/landing" className={`w-full py-2.5 rounded-xl font-semibold text-sm text-center block transition-colors ${plan.popular ? "bg-primary text-white hover:bg-primary/90" : "bg-zinc-800 text-white hover:bg-zinc-700"}`}>
              {plan.cta}
            </Link>
          </div>
        ))}
      </div>

      {/* Add-ons */}
      <div className="mb-20">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold mb-2">Add-Ons & Services</h2>
          <p className="text-zinc-400">Enhance any plan with these optional services</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {addOns.map((addon) => (
            <div key={addon.name} className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 transition-all duration-200">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-3">{addon.icon}</div>
              <h4 className="text-sm font-semibold mb-1">{addon.name}</h4>
              <p className="text-primary text-sm font-bold mb-2">{addon.price}</p>
              <p className="text-xs text-zinc-500 leading-relaxed">{addon.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ROI section */}
      <div className="p-8 md:p-12 rounded-2xl bg-gradient-to-br from-primary/10 via-zinc-900/50 to-zinc-900/50 border border-primary/20 mb-16">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-2xl font-bold mb-3">What&apos;s the ROI?</h2>
            <p className="text-zinc-400 leading-relaxed">A single business losing 50 leads per month to slow response times is losing NGN 5-10M per year. Our Starter plan pays for itself in the first week.</p>
            <div className="mt-6 flex flex-wrap gap-4">
              <div className="px-4 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700">
                <p className="text-2xl font-bold text-primary">3-5x</p>
                <p className="text-xs text-zinc-500">Average ROI</p>
              </div>
              <div className="px-4 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700">
                <p className="text-2xl font-bold text-primary">3s</p>
                <p className="text-xs text-zinc-500">Lead response time</p>
              </div>
              <div className="px-4 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700">
                <p className="text-2xl font-bold text-primary">40%</p>
                <p className="text-xs text-zinc-500">More conversions</p>
              </div>
            </div>
          </div>
          <div className="text-center md:text-right">
            <Link href="/landing/audit" className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-white rounded-xl font-semibold text-lg hover:bg-primary/90 transition-colors">
              Get Your Free Audit <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="text-xs text-zinc-500 mt-3">See exactly where you&apos;re losing money</p>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-3xl mx-auto mb-16">
        <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {[
            { q: "Do I own the automations?", a: "Yes. You pay once, you own the workflows forever. No recurring licensing fees." },
            { q: "What if I need changes after launch?", a: "Every plan includes support days. After that, our Monthly Retainer (NGN 150,000/mo) covers ongoing changes and optimization." },
            { q: "How long does implementation take?", a: "Starter: 3-5 days. Growth: 1-2 weeks. Scale: 2-4 weeks. Custom: scoped during consultation." },
            { q: "Can I start small and upgrade later?", a: "Absolutely. Many clients start with Starter and upgrade to Growth or Scale once they see the results." },
            { q: "Do you integrate with my existing tools?", a: "We integrate with WhatsApp, HubSpot, Pipedrive, Google Calendar, Slack, and any tool with an API." },
          ].map((faq) => (
            <div key={faq.q} className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/30">
              <h4 className="text-sm font-semibold mb-2">{faq.q}</h4>
              <p className="text-sm text-zinc-400 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="text-center p-8 rounded-2xl bg-zinc-900/50 border border-zinc-800">
        <h3 className="text-xl font-bold mb-2">Not sure which plan is right for you?</h3>
        <p className="text-zinc-400 mb-4">Book a free 15-minute call and we&apos;ll recommend the best plan for your business.</p>
        <Link href="/landing/audit" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors">
          Book a Free Call <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
