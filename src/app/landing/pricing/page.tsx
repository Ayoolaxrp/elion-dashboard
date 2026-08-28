"use client";
import { CheckCircle, ArrowRight, Zap, Shield, Clock, Settings, MessageSquare, Mail, Calendar, TrendingUp, Users, Phone, Sparkles, Star, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const plans = [
  {
    name: "Starter",
    price: "100,000",
    monthlyPrice: "50,000",
    period: "one-time",
    description: "One workflow. Perfect for small businesses testing automation.",
    features: [
      { text: "1 automation workflow", included: true },
      { text: "Lead capture + instant response", included: true },
      { text: "WhatsApp OR Email integration", included: true },
      { text: "Basic reporting dashboard", included: true },
      { text: "14 days support", included: true },
      { text: "Up to 500 contacts", included: true },
      { text: "Multi-channel sequences", included: false },
      { text: "Revenue recovery", included: false },
      { text: "Booking engine", included: false },
    ],
    cta: "Start with Starter",
    popular: false,
    icon: <Zap className="w-5 h-5" />,
    tag: "Best for solopreneurs",
    gradient: "from-zinc-800/80 to-zinc-900/80",
  },
  {
    name: "Growth",
    price: "350,000",
    monthlyPrice: "120,000",
    period: "one-time",
    description: "Complete lead management system. Our core offer for most businesses.",
    features: [
      { text: "1 complete revenue workflow", included: true },
      { text: "Lead → qualify → respond → follow-up → book", included: true },
      { text: "Multi-step sequences (email + WhatsApp + SMS)", included: true },
      { text: "Revenue recovery campaigns", included: true },
      { text: "Appointment booking engine", included: true },
      { text: "Full analytics dashboard", included: true },
      { text: "60 days support", included: true },
      { text: "Up to 2,000 contacts", included: true },
      { text: "CSV import/export", included: true },
    ],
    cta: "Get Growth Plan",
    popular: true,
    icon: <Shield className="w-5 h-5" />,
    tag: "Most Popular",
    gradient: "from-primary/10 via-zinc-900/80 to-zinc-900/80",
  },
  {
    name: "Scale",
    price: "750,000",
    monthlyPrice: "200,000",
    period: "one-time",
    description: "Multiple interconnected workflows. Full automation suite for growing teams.",
    features: [
      { text: "All 6 automation systems", included: true },
      { text: "Custom workflow design", included: true },
      { text: "Team notifications (Slack / Email / WhatsApp)", included: true },
      { text: "Priority support (90 days)", included: true },
      { text: "Monthly optimization calls", included: true },
      { text: "API integrations", included: true },
      { text: "Up to 10,000 contacts", included: true },
      { text: "White-label options", included: false },
      { text: "Dedicated engineer", included: false },
    ],
    cta: "Get Scale Plan",
    popular: false,
    icon: <TrendingUp className="w-5 h-5" />,
    tag: "Best Value",
    gradient: "from-zinc-800/80 to-zinc-900/80",
  },
  {
    name: "Custom",
    price: "Let's Talk",
    monthlyPrice: "350,000+",
    period: "",
    description: "Tailored automation suite built for your specific business processes.",
    features: [
      { text: "Everything in Scale, plus:", included: true },
      { text: "Unlimited workflows & contacts", included: true },
      { text: "Custom API integrations (ERP, POS)", included: true },
      { text: "White-label options", included: true },
      { text: "Dedicated automation engineer", included: true },
      { text: "SLA guarantee (99.9% uptime)", included: true },
      { text: "On-site training for your team", included: true },
      { text: "Quarterly business reviews", included: true },
      { text: "24/7 priority support", included: true },
    ],
    cta: "Get a Custom Quote",
    popular: false,
    icon: <Settings className="w-5 h-5" />,
    tag: "Enterprise",
    gradient: "from-zinc-800/80 to-zinc-900/80",
  },
];

const addOns = [
  { icon: <MessageSquare className="w-5 h-5" />, name: "WhatsApp Business API", price: "NGN 50,000/mo", desc: "Official WhatsApp Business API setup, template messages, and delivery tracking" },
  { icon: <Mail className="w-5 h-5" />, name: "Email Automation", price: "NGN 25,000/mo", desc: "SMTP setup, email sequences, A/B testing, and deliverability management" },
  { icon: <Calendar className="w-5 h-5" />, name: "Booking Engine", price: "NGN 75,000", desc: "Google Calendar sync, auto-reminders, no-show recovery, buffer time" },
  { icon: <Users className="w-5 h-5" />, name: "CRM Integration", price: "NGN 100,000", desc: "HubSpot, Pipedrive, or custom CRM setup, bi-directional sync" },
  { icon: <Phone className="w-5 h-5" />, name: "Monthly Retainer", price: "NGN 150,000/mo", desc: "Ongoing optimization, new workflows, priority support, monthly calls" },
];

const faqs = [
  { q: "Do I own the automations?", a: "Yes. You pay once, you own the workflows forever. No recurring licensing fees. We host and maintain during the support period." },
  { q: "What if I need changes after launch?", a: "Every plan includes support days. After that, our Monthly Retainer (NGN 150,000/mo) covers ongoing changes, new workflows, and optimization." },
  { q: "How long does implementation take?", a: "Starter: 3-5 days. Growth: 1-2 weeks. Scale: 2-4 weeks. Custom: scoped during consultation." },
  { q: "Can I start small and upgrade later?", a: "Absolutely. Many clients start with Starter and upgrade to Growth or Scale once they see the results. We credit your initial investment." },
  { q: "Do you integrate with my existing tools?", a: "We integrate with WhatsApp, HubSpot, Pipedrive, Google Calendar, Slack, Mailchimp, SendGrid, and any tool with an API." },
  { q: "What happens if the automation breaks?", a: "During your support period, we fix any issues at no cost. We also monitor automations and proactively reach out if we detect problems." },
];

export default function PricingPage() {
  const [billing, setBilling] = useState<"onetime" | "monthly">("onetime");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="max-w-6xl mx-auto px-6 py-20">
      {/* Hero */}
      <div className="text-center mb-16 relative">
        {/* Decorative glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-6 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Pricing
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-5 tracking-tight leading-tight">
            Simple, Transparent<br />
            <span className="bg-gradient-to-r from-primary via-violet-400 to-primary bg-clip-text text-transparent">Pricing</span>
          </h1>
          <p className="text-zinc-400 max-w-xl mx-auto text-lg leading-relaxed">
            Start small, scale as you grow. You own the automations forever.
          </p>
        </div>

        {/* Billing toggle */}
        <div className="flex items-center justify-center gap-3 mt-10">
          <span className={`text-sm font-medium transition-colors ${billing === "onetime" ? "text-white" : "text-zinc-500"}`}>One-Time</span>
          <button onClick={() => setBilling(billing === "onetime" ? "monthly" : "onetime")} className="relative w-11 h-6 rounded-full bg-zinc-700 hover:bg-zinc-600 transition-colors cursor-pointer" aria-label="Toggle billing">
            <span className={`absolute top-[3px] left-[3px] w-[18px] h-[18px] rounded-full bg-white transition-transform duration-200 shadow-sm ${billing === "monthly" ? "translate-x-[20px]" : ""}`} />
          </button>
          <span className={`text-sm font-medium transition-colors ${billing === "monthly" ? "text-white" : "text-zinc-500"}`}>Monthly Retainer</span>
          {billing === "monthly" && <span className="text-[11px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-medium">Save up to 20%</span>}
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-20">
        {plans.map((plan) => (
          <div key={plan.name} className={`relative group rounded-2xl border transition-all duration-300 overflow-hidden ${plan.popular ? "border-primary/50 bg-gradient-to-b from-primary/10 via-card/80 to-card/80 ring-1 ring-primary/20 lg:scale-[1.03] z-10" : "border-zinc-800/80 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-900/60"}`}>
            {/* Popular glow */}
            {plan.popular && <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />}

            {/* Tag */}
            <div className="px-6 pt-6 pb-0">
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold uppercase tracking-wider mb-4 ${plan.popular ? "bg-primary/15 text-primary" : "bg-zinc-800 text-zinc-400"}`}>
                {plan.tag}
              </div>
            </div>

            <div className="px-6 pb-6">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${plan.popular ? "bg-primary/15 text-primary" : "bg-zinc-800 text-zinc-400 group-hover:text-primary group-hover:bg-primary/10 transition-colors"}`}>
                {plan.icon}
              </div>

              <h3 className="text-lg font-bold mb-2">{plan.name}</h3>

              {plan.price === "Let's Talk" ? (
                <div className="mb-3">
                  <span className="text-3xl font-bold tracking-tight">Custom</span>
                </div>
              ) : (
                <div className="mb-3 flex items-baseline gap-1.5">
                  <span className="text-xs text-zinc-500 font-medium">NGN</span>
                  <span className="text-3xl font-bold tracking-tight">
                    {billing === "monthly" && plan.monthlyPrice ? plan.monthlyPrice : plan.price}
                  </span>
                  <span className="text-xs text-zinc-500">
                    / {billing === "monthly" && plan.monthlyPrice ? "month" : plan.period}
                  </span>
                </div>
              )}

              <p className="text-sm text-zinc-400 mb-5 leading-relaxed">{plan.description}</p>

              {/* Feature list */}
              <ul className="space-y-2 mb-6">
                {plan.features.map((f) => (
                  <li key={f.text} className="flex items-start gap-2.5 text-[13px]">
                    {f.included ? (
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <span className="w-4 h-4 rounded-full border border-zinc-700 shrink-0 mt-0.5 flex items-center justify-center">
                        <span className="w-1.5 h-px bg-zinc-600" />
                      </span>
                    )}
                    <span className={f.included ? "text-zinc-300" : "text-zinc-600"}>{f.text}</span>
                  </li>
                ))}
              </ul>

              <Link href="/landing" className={`w-full py-3 rounded-xl font-semibold text-sm text-center block transition-all duration-200 ${plan.popular ? "bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20" : "bg-zinc-800 text-white hover:bg-zinc-700 hover:shadow-lg hover:shadow-black/20"}`}>
                {plan.cta}
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Add-ons */}
      <div className="mb-20">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold mb-2">Add-Ons & Services</h2>
          <p className="text-zinc-400">Enhance any plan with these optional services</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {addOns.map((addon) => (
            <div key={addon.name} className="group p-5 rounded-xl border border-zinc-800/80 bg-zinc-900/30 hover:border-zinc-700 hover:bg-zinc-900/50 transition-all duration-200 cursor-default">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-3 group-hover:bg-primary/15 transition-colors">{addon.icon}</div>
              <h4 className="text-sm font-semibold mb-1">{addon.name}</h4>
              <p className="text-primary text-sm font-bold mb-2">{addon.price}</p>
              <p className="text-[11px] text-zinc-500 leading-relaxed">{addon.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Comparison Table */}
      <div className="mb-20 overflow-x-auto">
        <h2 className="text-2xl font-bold text-center mb-8">Compare Plans</h2>
        <div className="min-w-[700px]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left py-4 px-4 text-zinc-400 font-medium">Feature</th>
                {plans.map((p) => (
                  <th key={p.name} className={`py-4 px-4 text-center font-semibold ${p.popular ? "text-primary" : "text-foreground"}`}>{p.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { feature: "Automation Workflows", starter: "1", growth: "1 full", scale: "All 6", custom: "Unlimited" },
                { feature: "Contact Limit", starter: "500", growth: "2,000", scale: "10,000", custom: "Unlimited" },
                { feature: "WhatsApp Integration", starter: "✓", growth: "✓", scale: "✓", custom: "✓" },
                { feature: "Email Automation", starter: "—", growth: "✓", scale: "✓", custom: "✓" },
                { feature: "Follow-Up Sequences", starter: "—", growth: "✓", scale: "✓", custom: "✓" },
                { feature: "Revenue Recovery", starter: "—", growth: "✓", scale: "✓", custom: "✓" },
                { feature: "Booking Engine", starter: "—", growth: "✓", scale: "✓", custom: "✓" },
                { feature: "Support Duration", starter: "14 days", growth: "60 days", scale: "90 days", custom: "Ongoing" },
                { feature: "Monthly Optimization", starter: "—", growth: "—", scale: "✓", custom: "✓" },
                { feature: "White-Label", starter: "—", growth: "—", scale: "—", custom: "✓" },
              ].map((row, i) => (
                <tr key={row.feature} className={`border-b border-zinc-800/50 ${i % 2 === 0 ? "bg-zinc-900/20" : ""}`}>
                  <td className="py-3 px-4 text-zinc-300 font-medium">{row.feature}</td>
                  <td className="py-3 px-4 text-center text-zinc-400">{row.starter}</td>
                  <td className="py-3 px-4 text-center text-zinc-300">{row.growth}</td>
                  <td className="py-3 px-4 text-center text-zinc-300">{row.scale}</td>
                  <td className="py-3 px-4 text-center text-zinc-300">{row.custom}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ROI */}
      <div className="relative p-8 md:p-12 rounded-2xl border border-primary/20 mb-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-zinc-900/80 to-zinc-900/80 pointer-events-none" />
        <div className="relative grid md:grid-cols-2 gap-8 items-center">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
              <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">ROI Guarantee</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-3">What&apos;s the ROI?</h2>
            <p className="text-zinc-400 leading-relaxed">A single business losing 50 leads per month to slow response times is losing NGN 5-10M per year. Our Starter plan pays for itself in the first week.</p>
            <div className="mt-6 grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-zinc-800/40 border border-zinc-700/50 text-center">
                <p className="text-xl font-bold text-primary">3-5x</p>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider mt-0.5">Average ROI</p>
              </div>
              <div className="p-3 rounded-xl bg-zinc-800/40 border border-zinc-700/50 text-center">
                <p className="text-xl font-bold text-primary">3s</p>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider mt-0.5">Response Time</p>
              </div>
              <div className="p-3 rounded-xl bg-zinc-800/40 border border-zinc-700/50 text-center">
                <p className="text-xl font-bold text-primary">40%</p>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider mt-0.5">More Conversions</p>
              </div>
            </div>
          </div>
          <div className="text-center md:text-right">
            <Link href="/landing/audit" className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-white rounded-xl font-semibold text-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 hover:shadow-primary/30">
              Get Your Free Audit <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="text-xs text-zinc-500 mt-3">See exactly where you&apos;re losing money</p>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-3xl mx-auto mb-16">
        <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={faq.q} className="rounded-xl border border-zinc-800/80 bg-zinc-900/30 overflow-hidden transition-all duration-200 hover:border-zinc-700">
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between p-5 text-left cursor-pointer">
                <span className="text-sm font-semibold pr-4">{faq.q}</span>
                {openFaq === i ? <ChevronUp className="w-4 h-4 text-zinc-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-zinc-500 shrink-0" />}
              </button>
              {openFaq === i && (
                <div className="px-5 pb-5 -mt-1">
                  <p className="text-sm text-zinc-400 leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="relative text-center p-10 rounded-2xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 pointer-events-none" />
        <div className="relative">
          <h3 className="text-xl md:text-2xl font-bold mb-2">Not sure which plan is right for you?</h3>
          <p className="text-zinc-400 mb-6">Book a free 15-minute call and we&apos;ll recommend the best plan for your business.</p>
          <Link href="/landing/audit" className="inline-flex items-center gap-2 px-8 py-3.5 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
            Book a Free Call <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
