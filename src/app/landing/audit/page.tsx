"use client";

import { useState } from "react";
import { Zap, CheckCircle2, AlertTriangle, TrendingUp, ArrowRight, ShieldCheck } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { submitForm, type FormResult } from "@/lib/api";
import { ElionLogo } from "@/components/elion-logo";
import { SiteFooter } from "@/components/site-footer";

const spring = { type: "spring" as const, damping: 30, stiffness: 300, mass: 0.8 };

export default function AuditLanding() {
  const reduced = useReducedMotion();
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
    <div className="min-h-screen bg-[var(--color-surface)]">
      {/* Premium glass nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-nav">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="/" aria-label="ELION home">
            <ElionLogo size="md" />
          </a>
          <a href="#cta" className="hidden md:inline-flex px-5 py-2.5 rounded-xl bg-[var(--color-accent)] text-white text-sm font-semibold hover:bg-[var(--color-accent-hover)] transition-all shadow-lg shadow-[var(--color-accent)]/20 active:scale-[0.97]">
            Get Free Audit
          </a>
        </div>
      </nav>

      {/* Hero - same layout, premium treatment */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute top-16 left-1/2 -translate-x-1/2 w-[640px] h-[360px] rounded-full bg-[var(--color-accent)]/[0.07] blur-[130px] pointer-events-none" />
        <div className="relative max-w-4xl mx-auto text-center">
          <motion.div
            initial={reduced ? {} : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20 text-[var(--color-text-primary)] text-xs font-medium mb-6">
              <Zap className="w-3.5 h-3.5 text-[var(--color-accent)]" />Automation Leak Audit
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-[var(--color-text-primary)] tracking-tight leading-tight mb-6" style={{ letterSpacing: "-0.025em" }}>
              Find out where your business<br /><span className="bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-cyan)] bg-clip-text text-transparent">is leaking time and money.</span>
            </h1>
            <p className="text-lg md:text-xl text-[var(--color-text-muted)] max-w-2xl mx-auto leading-relaxed">
              We examine your customer journey and internal operations to identify the 3-5 processes costing you the most. Free, no obligation.
            </p>
          </motion.div>
        </div>
      </section>

      {/* What we audit - same layout */}
      <section className="py-20 px-6 bg-[var(--color-surface-raised)]/40 border-y border-[var(--color-border)]/30">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-semibold text-[var(--color-accent)] uppercase tracking-[0.2em] mb-4 text-center">What we audit</p>
          <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-text-primary)] text-center mb-12" style={{ letterSpacing: "-0.02em" }}>Where your business leaks</h2>
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
              <motion.div
                key={item}
                initial={reduced ? {} : { opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ type: "spring" as const, damping: 28, stiffness: 260 }}
                className="flex items-center gap-2 p-3 rounded-lg border border-[var(--color-border)]/50 bg-[var(--color-surface-raised)] hover:border-[var(--color-border-light)] transition-colors"
              >
                <CheckCircle2 className="w-4 h-4 text-[var(--color-success)] shrink-0" />
                <span className="text-sm text-[var(--color-text-secondary)]">{item}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Audit form - same layout, premium card */}
      <section id="cta" className="py-20 px-6 border-t border-[var(--color-border)]/40">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-xs font-semibold text-[var(--color-accent)] uppercase tracking-[0.2em] mb-4">Free Business Audit</p>
          <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-text-primary)] mb-4" style={{ letterSpacing: "-0.02em" }}>Get your free audit</h2>
          <p className="text-[var(--color-text-muted)] mb-8">Fill in your details and we will run the audit instantly. Results shown on screen.</p>
          <div className="rounded-2xl border border-[var(--color-border)]/60 bg-[var(--color-surface-raised)] p-8 max-w-md mx-auto shadow-2xl shadow-black/30">
            {result?.success && result.data ? (() => {
              const d = result.data as Record<string, unknown>;
              const score = String(d.score || 65);
              const company = String(d.company || form.company_name);
              const totalSavings = d.totalSavings;
              const leaks = Array.isArray(d.leaks) ? d.leaks as Array<Record<string, unknown>> : [];
              return (
              <motion.div initial={reduced ? {} : { opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={spring} className="space-y-6">
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/25 flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-[var(--color-text-primary)]">{score}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-white">Automation Readiness Score</h3>
                  <p className="text-sm text-[var(--color-text-muted)] mt-1">Based on {company}</p>
                </div>

                {totalSavings != null && (
                  <div className="text-center p-4 rounded-xl bg-[var(--color-success)]/10 border border-emerald-500/20">
                    <p className="text-sm text-[var(--color-success)] font-medium">Estimated Annual Savings</p>
                    <p className="text-2xl font-bold text-[var(--color-success)] mt-1">NGN {String(totalSavings)}</p>
                  </div>
                )}

                {leaks.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-white">Identified Leaks</h4>
                    {leaks.map((leak, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)]">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className={`w-4 h-4 ${String(leak.severity) === "critical" ? "text-[var(--color-error)]" : String(leak.severity) === "high" ? "text-[var(--color-warning)]" : "text-[var(--color-text-muted)]"}`} />
                          <span className="text-sm text-[var(--color-text-secondary)]">{String(leak.area)}</span>
                        </div>
                        <span className="text-xs text-[var(--color-text-muted)]">NGN {String(leak.estimatedSavings)}/yr</span>
                      </div>
                    ))}
                  </div>
                )}

                <button onClick={() => { setResult(null); setForm({ company_name: "", name: "", email: "", industry: "" }); }} className="w-full px-6 py-3 rounded-lg border border-[var(--color-border)] text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-raised)] transition-colors cursor-pointer">
                  Audit Another Company
                </button>
              </motion.div>
              );
            })() : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="text"
                  placeholder="Company name *"
                  value={form.company_name}
                  onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                  className={`w-full px-4 py-3 bg-[var(--color-surface)]/80 border rounded-lg text-sm text-white placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 focus:border-[var(--color-accent)] transition-colors ${errors.company_name ? "border-[var(--color-error)]/40" : "border-[var(--color-border)]"}`}
                />
                {errors.company_name && <p className="text-xs text-[var(--color-error)]">{errors.company_name}</p>}
                <input
                  type="text"
                  placeholder="Your name *"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={`w-full px-4 py-3 bg-[var(--color-surface)]/80 border rounded-lg text-sm text-white placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 focus:border-[var(--color-accent)] transition-colors ${errors.name ? "border-[var(--color-error)]/40" : "border-[var(--color-border)]"}`}
                />
                {errors.name && <p className="text-xs text-[var(--color-error)]">{errors.name}</p>}
                <input
                  type="email"
                  placeholder="Email *"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={`w-full px-4 py-3 bg-[var(--color-surface)]/80 border rounded-lg text-sm text-white placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 focus:border-[var(--color-accent)] transition-colors ${errors.email ? "border-[var(--color-error)]/40" : "border-[var(--color-border)]"}`}
                />
                {errors.email && <p className="text-xs text-[var(--color-error)]">{errors.email}</p>}
                <input
                  type="text"
                  placeholder="Industry (optional)"
                  value={form.industry}
                  onChange={(e) => setForm({ ...form, industry: e.target.value })}
                  className="w-full px-4 py-3 bg-[var(--color-surface)]/80 border border-[var(--color-border)] rounded-lg text-sm text-white placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 focus:border-[var(--color-accent)] transition-colors"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[var(--color-accent)] text-white font-medium text-sm hover:bg-[var(--color-accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.97] shadow-lg shadow-[var(--color-accent)]/20"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Running Audit...
                    </>
                  ) : (
                    <>Claim Free Audit <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
                <p className="flex items-center justify-center gap-1.5 text-[11px] text-[var(--color-text-muted)] pt-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  No credit card. No commitment. Evidence-based findings.
                </p>
              </form>
            )}
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}