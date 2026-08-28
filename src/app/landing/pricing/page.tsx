"use client";
import { CheckCircle, ArrowRight, Zap, Shield, Clock } from "lucide-react";
import Link from "next/link";

const plans = [
  {
    name: "Starter",
    price: "NGN 500,000",
    period: "one-time",
    description: "One workflow. Perfect for testing automation.",
    features: [
      "1 automation workflow",
      "Lead capture → WhatsApp response → CRM",
      "Basic reporting dashboard",
      "30 days support",
      "WhatsApp integration",
    ],
    cta: "Start with Starter",
    popular: false,
    icon: <Zap className="w-6 h-6" />,
  },
  {
    name: "Growth",
    price: "NGN 1,500,000",
    period: "one-time",
    description: "One complete revenue workflow. Core offer.",
    features: [
      "Lead → qualification → WhatsApp → CRM → follow-up → booking → notifications",
      "Multi-step follow-up sequences",
      "Revenue recovery campaigns",
      "Appointment booking engine",
      "60 days support",
      "Full analytics dashboard",
    ],
    cta: "Get Growth Plan",
    popular: true,
    icon: <Shield className="w-6 h-6" />,
  },
  {
    name: "Operations",
    price: "NGN 3,500,000",
    period: "one-time",
    description: "Multiple interconnected workflows. Full automation suite.",
    features: [
      "Lead management + CRM + appointments + reporting + operations",
      "All 6 automation systems",
      "Custom workflow design",
      "Priority support (90 days)",
      "Monthly optimization calls",
      "API integrations",
      "White-label options",
    ],
    cta: "Get Operations Plan",
    popular: false,
    icon: <Clock className="w-6 h-6" />,
  },
];

export default function PricingPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-24">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Simple, Transparent Pricing</h1>
        <p className="text-zinc-400 max-w-2xl mx-auto">No hidden fees. No recurring charges. You own the automations forever. Monthly retainer available for ongoing optimization.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        {plans.map((plan) => (
          <div key={plan.name} className={`relative p-8 rounded-2xl border ${plan.popular ? "border-primary bg-primary/5 scale-105" : "border-zinc-800 bg-zinc-900/50"}`}>
            {plan.popular && <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-white text-xs font-semibold rounded-full">Most Popular</div>}
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">{plan.icon}</div>
            <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
            <div className="mb-4"><span className="text-3xl font-bold">{plan.price}</span><span className="text-sm text-zinc-500 ml-2">/ {plan.period}</span></div>
            <p className="text-sm text-zinc-400 mb-6">{plan.description}</p>
            <ul className="space-y-3 mb-8">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm"><CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />{f}</li>
              ))}
            </ul>
            <Link href="/landing" className={`w-full py-3 rounded-xl font-semibold text-center block transition-colors ${plan.popular ? "bg-primary text-white hover:bg-primary/90" : "bg-zinc-800 text-white hover:bg-zinc-700"}`}>
              {plan.cta}
            </Link>
          </div>
        ))}
      </div>

      <div className="text-center p-8 rounded-2xl bg-zinc-900/50 border border-zinc-800">
        <h3 className="text-xl font-bold mb-2">Need a custom solution?</h3>
        <p className="text-zinc-400 mb-4">We also offer monthly retainer packages for ongoing optimization and new workflow development.</p>
        <Link href="/landing" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors">
          Contact Us <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
