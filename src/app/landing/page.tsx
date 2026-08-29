"use client";
import { useState } from "react";
import { CheckCircle, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import { submitForm } from "@/lib/api";

const steps = [
  { num: "01", title: "Map your processes", desc: "We create a visual map of all your systems, manual tasks, and apps." },
  { num: "02", title: "Find automation opportunities", desc: "We audit your workflows to pinpoint opportunities with the highest ROI." },
  { num: "03", title: "Build and test", desc: "We use custom code, AI tools, n8n, Make.com and your existing tech stack." },
  { num: "04", title: "Manage and iterate", desc: "Every business grows. We continuously optimise and add new automations." },
];

const systems = [
  { title: "Lead Response", desc: "Capture, qualify, and respond to every lead within seconds across all channels." },
  { title: "Follow-Up Engine", desc: "Multi-step follow-up sequences across email, WhatsApp, and SMS, automatically." },
  { title: "Revenue Recovery", desc: "Reactivate dormant leads and old customers sitting in your database." },
  { title: "Booking Engine", desc: "Turn enquiries into booked appointments without the back-and-forth." },
  { title: "Operations Automation", desc: "Remove repetitive work. Data entry, reports, notifications, onboarding." },
];

const guarantees = [
  { title: "Results within weeks", desc: "Most clients see measurable improvement within the first two weeks of implementation." },
  { title: "You own everything", desc: "No recurring licensing. No platform lock-in. The automations are yours." },
];

const faqs = [
  { q: "How quickly will I see results?", a: "Most clients see measurable improvement within 2 weeks. Lead response times drop from hours to seconds on day one." },
  { q: "Do I need to change my existing tools?", a: "No. We integrate with what you already use. WhatsApp, HubSpot, Google Calendar, Slack, and any tool with an API." },
  { q: "What if I am not technical?", a: "You do not need to be. We handle everything. Setup, integration, testing, and training. You just use the dashboard." },
  { q: "How much does it cost?", a: "Starting from NGN 100,000 for a single workflow implementation. See pricing for full details." },
  { q: "What is the difference between setup and monthly support?", a: "One-time setup is the design, build, and deployment of your automation. Monthly support covers monitoring, maintenance, and improvements after launch." },
];

export default function LandingPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", industry: "" });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleSubmit = async () => {
    if (!form.name || !form.email) return;
    setLoading(true);
    await submitForm("/webhook/leak-audit", { ...form, company_name: form.name });
    setSubmitted(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="border-b border-zinc-200">
        <div className="max-w-5xl mx-auto px-6 py-16 md:py-24 text-center">
          <div className="flex items-center justify-center gap-2.5 mb-6">
            <div className="w-9 h-9 rounded bg-blue-600 flex items-center justify-center">
              <span className="text-white text-sm font-bold">E</span>
            </div>
            <span className="text-xl font-bold text-zinc-900 tracking-tight">ELION</span>
          </div>

          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">Business Automation Systems</p>

          <h1 className="text-3xl md:text-5xl font-bold text-zinc-900 tracking-tight mb-4 leading-tight">
            Find the leaks in your business.<br />Then automate them.
          </h1>

          <p className="text-base md:text-lg text-zinc-500 max-w-2xl mx-auto mb-8 leading-relaxed">
            ELION identifies where your business is losing time, leads, money, or operational efficiency.
            Then we build automation systems to fix it.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
            <a
              href="#audit"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-blue-600 text-white rounded font-semibold text-sm hover:bg-blue-700 transition-colors"
            >
              Run Your Free Leak Audit
            </a>
            <Link
              href="/demo"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white text-zinc-700 border border-zinc-200 rounded font-semibold text-sm hover:bg-zinc-50 transition-colors"
            >
              See How It Works
            </Link>
          </div>

          <p className="text-xs text-zinc-400">No credit card required. Free audit takes 2 minutes.</p>
        </div>
      </section>

      {/* The Problem */}
      <section className="border-b border-zinc-200">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <h2 className="text-2xl font-bold text-zinc-900 text-center mb-4">The problem</h2>
          <p className="text-sm text-zinc-500 text-center mb-10 max-w-lg mx-auto">
            Businesses lose money every day through operational leaks they cannot see.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { problem: "A lead fills out your form at 2am", result: "Nobody responds until 10am. By then, they have already contacted your competitor." },
              { problem: "A customer enquires but does not buy", result: "Nobody follows up. The lead goes cold. You spend money generating new ones instead." },
              { problem: "Your team spends hours on data entry", result: "Copying information between systems. Updating spreadsheets. Manually sending reports." },
              { problem: "You have 2,000 contacts in your database", result: "Nobody contacts them. No reactivation campaigns. Revenue left on the table." },
            ].map((item, i) => (
              <div key={i} className="border border-zinc-200 rounded-lg p-5">
                <p className="text-sm font-semibold text-zinc-900 mb-2">{item.problem}</p>
                <p className="text-sm text-zinc-500 leading-relaxed">{item.result}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What ELION Does */}
      <section className="border-b border-zinc-200 bg-zinc-50">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <h2 className="text-2xl font-bold text-zinc-900 text-center mb-4">What ELION does</h2>
          <p className="text-sm text-zinc-500 text-center mb-10 max-w-lg mx-auto">
            We identify the leak. Then we build the automation to fix it.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {systems.map((sys, i) => (
              <div key={i} className="bg-white border border-zinc-200 rounded-lg p-5">
                <h3 className="text-sm font-semibold text-zinc-900 mb-1">{sys.title}</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">{sys.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-b border-zinc-200">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <h2 className="text-2xl font-bold text-zinc-900 text-center mb-10">How it works</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {steps.map((step) => (
              <div key={step.num} className="text-center">
                <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center text-sm font-bold text-zinc-600 mx-auto mb-3">
                  {step.num}
                </div>
                <h3 className="text-sm font-semibold text-zinc-900 mb-1">{step.title}</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Guarantees */}
      <section className="border-b border-zinc-200 bg-zinc-50">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <h2 className="text-2xl font-bold text-zinc-900 text-center mb-10">Our guarantees</h2>
          <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto">
            {guarantees.map((g, i) => (
              <div key={i} className="flex items-start gap-3 bg-white border border-zinc-200 rounded-lg p-5">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                  <CheckCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900 mb-1">{g.title}</h3>
                  <p className="text-xs text-zinc-500 leading-relaxed">{g.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Audit Form */}
      <section id="audit" className="border-b border-zinc-200">
        <div className="max-w-2xl mx-auto px-6 py-16">
          <h2 className="text-2xl font-bold text-zinc-900 text-center mb-2">Run a free leak audit</h2>
          <p className="text-sm text-zinc-500 text-center mb-8">
            We will analyse your business and identify where you are losing leads, time, and money.
          </p>

          {submitted ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6 text-center">
              <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-zinc-900 mb-1">Audit request submitted</h3>
              <p className="text-sm text-zinc-500">We will be in touch within 24 hours with your results.</p>
            </div>
          ) : (
            <div className="bg-white border border-zinc-200 rounded-lg p-6">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-zinc-600 block mb-1">Your name</label>
                  <input
                    type="text"
                    placeholder="Full name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-zinc-200 rounded text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-600 block mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="you@company.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-zinc-200 rounded text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-600 block mb-1">Phone (optional)</label>
                  <input
                    type="tel"
                    placeholder="+234 800 000 0000"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-zinc-200 rounded text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-600 block mb-1">Industry</label>
                  <select
                    value={form.industry}
                    onChange={(e) => setForm({ ...form, industry: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-zinc-200 rounded text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 appearance-none cursor-pointer"
                  >
                    <option value="">Select industry</option>
                    <option value="Real Estate">Real Estate</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Education">Education</option>
                    <option value="E-Commerce">E-Commerce</option>
                    <option value="Professional Services">Professional Services</option>
                    <option value="Financial Services">Financial Services</option>
                    <option value="Recruitment">Recruitment</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={loading || !form.name || !form.email}
                  className="w-full py-3 bg-zinc-900 text-white rounded font-semibold text-sm hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  {loading ? "Submitting..." : "Run Free Audit"}
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* FAQ */}
      <section className="border-b border-zinc-200 bg-zinc-50">
        <div className="max-w-2xl mx-auto px-6 py-16">
          <h2 className="text-2xl font-bold text-zinc-900 text-center mb-8">Frequently asked questions</h2>
          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-white border border-zinc-200 rounded-lg">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left cursor-pointer"
                >
                  <span className="text-sm font-semibold text-zinc-900">{faq.q}</span>
                  {openFaq === i ? (
                    <ChevronUp className="w-4 h-4 text-zinc-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-zinc-400 shrink-0" />
                  )}
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

      {/* Final CTA */}
      <section>
        <div className="max-w-2xl mx-auto px-6 py-16 text-center">
          <h2 className="text-2xl font-bold text-zinc-900 mb-3">Ready to fix your operational leaks?</h2>
          <p className="text-sm text-zinc-500 mb-6">
            Every day you wait, you are losing leads, time, and revenue. Start with a free audit.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="#audit"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-zinc-900 text-white rounded font-semibold text-sm hover:bg-blue-700 transition-colors"
            >
              Run Free Leak Audit
            </a>
            <Link
              href="/landing/pricing"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-zinc-700 border border-zinc-200 rounded font-semibold text-sm hover:bg-zinc-50 transition-colors"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
