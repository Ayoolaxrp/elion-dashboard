"use client";

import { useState } from "react";
import { Zap, CheckCircle2, AlertTriangle, TrendingUp } from "lucide-react";
import { submitForm, type FormResult } from "@/lib/api";

export default function AuditLanding() {
  const [form, setForm] = useState({ company_name: "", name: "", email: "", industry: "" });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<FormResult | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.company_name.trim()) e.company_name = "Company name is required";
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setErrors({});
    const res = await submitForm("/webhook/leak-audit", {
      company_name: form.company_name,
      name: form.name,
      email: form.email,
      industry: form.industry || "General",
    });
    setResult(res);
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-white">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-zinc-200 border-b border-zinc-200">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center"><Zap className="w-4 h-4 text-white" /></div>
            <span className="text-lg font-bold text-white">ELION</span>
          </div>
          <a href="#cta" className="hidden md:inline-flex px-4 py-2 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-indigo-500 transition-colors">Get Free Audit</a>
        </div>
      </nav>

      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-zinc-900 text-xs font-medium mb-6">
            <Zap className="w-3.5 h-3.5" />Automation Leak Audit
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight leading-tight mb-6">
            Find out where your business<br /><span className="text-zinc-900">is leaking time and money.</span>
          </h1>
          <p className="text-lg md:text-xl text-zinc-500 max-w-2xl mx-auto">
            We examine your customer journey and internal operations to identify the 3-5 processes costing you the most. Free, no obligation.
          </p>
        </div>
      </section>

      <section className="py-20 px-6 bg-zinc-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">What we audit</h2>
          <div className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto">
            {[
              "Where leads are being lost",
              "Where response time is hurting conversion",
              "Repetitive admin tasks",
              "Manual data entry processes",
              "Follow-up gaps",
              "Appointment bottlenecks",
              "Customer reactivation opportunities",
              "Reporting bottlenecks",
              "Processes suitable for AI automation",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2 p-3 rounded-lg border border-zinc-200 bg-white">
                <CheckCircle2 className="w-4 h-4 text-zinc-900 shrink-0" />
                <span className="text-sm text-zinc-700">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="cta" className="py-20 px-6 border-t border-zinc-200">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Get your free audit</h2>
          <p className="text-zinc-500 mb-8">Fill in your details and we will run the audit instantly. Results shown on screen.</p>
          <div className="rounded-2xl border border-zinc-200/60 bg-white p-8 max-w-md mx-auto">
            {result?.success && result.data ? (() => {
              const d = result.data as Record<string, unknown>;
              const score = String(d.score || 65);
              const company = String(d.company || form.company_name);
              const totalSavings = d.totalSavings;
              const leaks = Array.isArray(d.leaks) ? d.leaks as Array<Record<string, unknown>> : [];
              return (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-zinc-900">{score}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-white">Automation Readiness Score</h3>
                  <p className="text-sm text-zinc-500 mt-1">Based on {company}</p>
                </div>

                {totalSavings != null && (
                  <div className="text-center p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <p className="text-sm text-emerald-600 font-medium">Estimated Annual Savings</p>
                    <p className="text-2xl font-bold text-emerald-600 mt-1">NGN {String(totalSavings)}</p>
                  </div>
                )}

                {leaks.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-white">Identified Leaks</h4>
                    {leaks.map((leak, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 border border-zinc-200">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className={`w-4 h-4 ${String(leak.severity) === "critical" ? "text-red-400" : String(leak.severity) === "high" ? "text-amber-700" : "text-zinc-500"}`} />
                          <span className="text-sm text-zinc-700">{String(leak.area)}</span>
                        </div>
                        <span className="text-xs text-zinc-500">NGN {String(leak.estimatedSavings)}/yr</span>
                      </div>
                    ))}
                  </div>
                )}

                <button onClick={() => { setResult(null); setForm({ company_name: "", name: "", email: "", industry: "" }); }} className="w-full px-6 py-3 rounded-lg border border-zinc-700 text-sm text-zinc-700 hover:bg-zinc-800 transition-colors">
                  Audit Another Company
                </button>
              </div>
              );
            })() : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="text"
                  placeholder="Company name *"
                  value={form.company_name}
                  onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                  className={`w-full px-4 py-3 bg-zinc-800/50 border rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors ${errors.company_name ? "border-red-500/50" : "border-zinc-700/50"}`}
                />
                {errors.company_name && <p className="text-xs text-red-400">{errors.company_name}</p>}
                <input
                  type="text"
                  placeholder="Your name *"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={`w-full px-4 py-3 bg-zinc-800/50 border rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors ${errors.name ? "border-red-500/50" : "border-zinc-700/50"}`}
                />
                {errors.name && <p className="text-xs text-red-400">{errors.name}</p>}
                <input
                  type="email"
                  placeholder="Email *"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={`w-full px-4 py-3 bg-zinc-800/50 border rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors ${errors.email ? "border-red-500/50" : "border-zinc-700/50"}`}
                />
                {errors.email && <p className="text-xs text-red-400">{errors.email}</p>}
                <input
                  type="text"
                  placeholder="Industry (optional)"
                  value={form.industry}
                  onChange={(e) => setForm({ ...form, industry: e.target.value })}
                  className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-zinc-900 text-white font-medium text-sm hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Running Audit...
                    </>
                  ) : (
                    "Claim Free Audit"
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      <footer className="py-8 px-6 border-t border-zinc-200">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <span className="text-sm font-semibold text-white">ELION</span>
          <p className="text-xs text-zinc-500">&copy; 2026 ELION. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
