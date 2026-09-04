"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { ArrowRight, ArrowLeft, CheckCircle2, ChevronDown, PlayCircle } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { SiteFooter } from "@/components/site-footer";
import StageStory from "@/components/funnel/stage-story";
import DemoExperience from "@/components/demo-experience";
import TierCards from "@/components/pricing/tier-cards";

const STEPS = [
  { title: "Business type", question: "What type of business do you run?", options: ["Service Business","E-commerce","Real Estate","Healthcare","Education","Professional Services","Hospitality","Other"] },
  { title: "Biggest problem", question: "What is your biggest operational challenge?", options: ["Leads not getting fast enough follow-up","Customers asking the same questions repeatedly","Booking handled manually","Customer info scattered across tools","Old leads never reactivated","Repetitive admin tasks","Other"] },
  { title: "Enquiry channels", question: "Where do most customer enquiries come from?", options: ["WhatsApp","Website","Instagram","Facebook","Email","Phone","Multiple channels","Other"] },
  { title: "Team size", question: "How large is the team handling these processes?", options: ["Just me","2-3 people","4-10 people","10+ people","Not sure"] },
  { title: "Website", question: "What is your business website?", isInput: true },
  { title: "Contact", question: "Where should we send your audit?", isContact: true },
];

const FAQ_DATA = [
  { q: "Is the audit actually free?", a: "Yes. We analyze publicly available information about your business and deliver findings at no cost. No credit card required." },
  { q: "What happens after the audit?", a: "We review your information, identify the most relevant automation opportunities, and contact you to schedule a discovery call." },
  { q: "Do I need to change my existing software?", a: "No. ELION works around your existing stack. We connect WhatsApp, email, CRM, calendar, forms, and other tools you already use." },
  { q: "What tools can ELION integrate with?", a: "WhatsApp, email providers, CRMs (HubSpot, Pipedrive, Zoho), Google Calendar, booking tools, spreadsheets, and custom APIs." },
  { q: "Do I own the automation?", a: "Yes. Your workflows are documented and your systems are yours. We avoid unnecessary platform lock-in." },
  { q: "Are third-party software costs included?", a: "No. ELION builds the automation. Third-party tools are separate subscriptions you own and control." },
  { q: "How long does implementation take?", a: "Once we understand your workflow, we move from diagnosis to implementation without unnecessary layers. We provide a timeline after the audit." },
  { q: "Can you maintain the system after implementation?", a: "Optional ongoing support covers monitoring, maintenance, and improvements. Many clients choose this after seeing results." },
  { q: "What happens if I cancel?", a: "Your automation continues running. You own it. Optional support can be renewed or dropped at any time." },
  { q: "Is my business data secure?", a: "Yes. Data is handled through secure, industry-standard infrastructure. We do not sell or share your information." },
];

const PAIN_POINTS = [
  { title: "Lead Response", desc: "A lead arrives. Nobody responds quickly enough.", fix: "WhatsApp Lead Response" },
  { title: "Follow-Up", desc: "Interested prospects disappear because nobody follows up consistently.", fix: "Follow-Up System" },
  { title: "Booking", desc: "Conversations happen, but appointments are not captured systematically.", fix: "Booking Automation" },
  { title: "Operations", desc: "Your team spends hours doing work software should handle.", fix: "Operations Automation" },
];

const NAV_ANCHORS = [
  { label: "How It Works", href: "#how-it-works" },
  { label: "Findings", href: "#findings" },
  { label: "Systems", href: "#systems" },
  { label: "Demo", href: "#demo" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

// Pricing is the canonical 3-tier model from src/lib/pricing.ts (shared with
// the homepage and /landing/pricing), shown via <TierCards />.

const SPRING_STEP = { type: "spring" as const, damping: 30, stiffness: 300, mass: 0.8 };
const SPRING_FAQ = { type: "spring" as const, damping: 28, stiffness: 260, mass: 0.7 };

export default function FunnelPage() {
  const reduced = useReducedMotion();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = back
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [auditResult, setAuditResult] = useState<{ score: number; leaks: Array<{ id?: string; area: string; title?: string; severity: string; recommendation?: string }>; critical: number; high: number; company: string; recommendations: unknown } | null>(null);
  const cs = STEPS[step];
  const pct = ((step + 1) / STEPS.length) * 100;

  const pick = (opt: string) => {
    setAnswers({...answers, [step]: opt});
    setDirection(1);
    if (step < STEPS.length - 1) setStep(step + 1);
  };

  const goBack = () => {
    setDirection(-1);
    if (step > 0) setStep(step - 1);
  };

  const goForward = () => {
    setDirection(1);
    if (step < STEPS.length - 1) setStep(step + 1);
  };

  const validateEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const sub = async () => {
    const errors: Record<string, string> = {};
    if (!name.trim()) errors.name = "Name is required";
    if (!email.trim()) errors.email = "Email is required";
    else if (!validateEmail(email.trim())) errors.email = "Please enter a valid email address";
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }
    setFieldErrors({});
    setSubmitting(true);
    const sheet = answers[2]||"";
    try {
      // Fire the lead record so the enquiry enters the pipeline.
      await fetch("/api/request", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ name: name.trim(), email: email.trim(), phone, website: answers[4]||"", businessType: answers[0]||"", primaryProblem: answers[1]||"", enquiryChannels: sheet, teamSize: answers[3]||"", source: "funnel" }) }).catch(()=>{});
      // Run the real audit now — results return in seconds, not hours.
      const auditRes = await fetch("/api/audit", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ company_name: (answers[2]||"business") + (answers[0]?" — "+answers[0]:""), industry: answers[0]||"General", website: answers[4]||"", name: name.trim(), email: email.trim() }) });
      if (auditRes.ok) {
        const ar = await auditRes.json();
        setAuditResult({ score: ar.overallScore ?? 0, leaks: ar.leaks || [], critical: ar.criticalLeaks ?? 0, high: ar.highLeaks ?? 0, recommendations: ar.automationRecommendations || null, company: ar.company || "" });
      }
    } catch { /* audit display is best-effort; the lead is still recorded */ }
    setSubmitting(false); setSubmitted(true);
  };

  const ip = "w-full px-5 py-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 focus:border-[var(--color-accent)] transition-all text-base";
  const bc = "flex items-center gap-2 px-5 py-3 rounded-xl border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)] transition-all text-sm cursor-pointer active:scale-[0.97]";
  const nc = "flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[var(--color-accent)] text-white font-semibold hover:bg-[var(--color-accent-hover)] transition-all text-sm cursor-pointer active:scale-[0.97]";

  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      <a href="#audit" className="skip-to-content">Skip to audit</a>

      {/* Glass nav — anchor-based, self-contained */}
      <header className="sticky top-0 z-50 glass-nav">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity" aria-label="ELION home">
            <Image src="/brand/elion-e-icon.svg" alt="" width={32} height={32} priority />
            <span className="font-bold text-[var(--color-text-primary)] tracking-tight" style={{fontFamily:"Space Grotesk,sans-serif"}}>ELION</span>
          </Link>
          <nav className="hidden lg:flex items-center gap-6 text-sm" aria-label="Funnel sections">
            {NAV_ANCHORS.map((item) => (
              <a key={item.href} href={item.href} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors">
                {item.label}
              </a>
            ))}
          </nav>
          <div className="hidden sm:flex items-center gap-3">
            <a href="#demo" className="hidden md:inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] text-sm hover:bg-[var(--color-surface-elevated)] transition-all">
              <PlayCircle className="w-4 h-4" /> Demo
            </a>
            <a href="#audit" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--color-accent)] text-white text-sm font-semibold hover:bg-[var(--color-accent-hover)] transition-all shadow-lg shadow-[var(--color-accent)]/20 active:scale-[0.97]">Run Free Audit</a>
          </div>
          <a href="#audit" className="sm:hidden inline-flex items-center px-4 py-2 rounded-xl bg-[var(--color-accent)] text-white text-sm font-semibold">Audit</a>
        </div>
      </header>

      <main id="main">
      {/* 1. HERO - compact, leads straight into the audit */}
      <section className="pt-16 sm:pt-24 pb-12 sm:pb-16 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs font-semibold text-[var(--color-accent-bright)] uppercase tracking-[0.2em] mb-6">AI Operations for Growing Businesses</p>
          <h1 className="text-4xl sm:text-6xl font-bold text-[var(--color-text-primary)] tracking-tight leading-[1.08] mb-6" style={{letterSpacing:"-0.025em"}}>Find the leaks in your business.<br className="hidden sm:block" /> Then automate them.</h1>
          <p className="text-base sm:text-lg text-[var(--color-text-secondary)] max-w-2xl mx-auto leading-relaxed mb-3">Answer six quick questions. We analyze your business and show you exactly where leads, time, and revenue are leaking.</p>
          <p className="text-xs sm:text-sm text-[var(--color-text-muted)] max-w-xl mx-auto">Built for businesses where operational leakage is already expensive — not a generic automation marketplace.</p>
        </div>
      </section>

      {/* 2. AUDIT - immediately after hero */}
      <section id="audit" className="pb-16 sm:pb-20 px-4 sm:px-6 scroll-mt-16">
        <div className="max-w-lg mx-auto">
          <div className="rounded-2xl bg-[var(--color-surface-raised)] border border-[var(--color-border)]/50 p-6 sm:p-8 overflow-hidden shadow-2xl shadow-black/30">
            {submitted ? (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={SPRING_STEP} className="text-center py-4">
                <CheckCircle2 className="w-12 h-12 text-[var(--color-success)] mx-auto mb-4" />
                {auditResult ? (
                  <>
                    <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-3">Your audit is ready.</h2>
                    <p className="text-sm text-[var(--color-text-secondary)] mb-5">{auditResult.company ? `Here is what ELION found for ${auditResult.company}.` : "Here is what ELION found."}</p>
                    <div className="grid grid-cols-3 gap-3 mb-6">
                      <div className="p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]/50">
                        <p className="text-3xl font-bold text-[var(--color-text-primary)]">{auditResult.score}</p>
                        <p className="text-[10px] text-[var(--color-text-muted)] mt-1 uppercase tracking-wider">Automation score</p>
                      </div>
                      <div className="p-4 rounded-xl bg-[var(--color-surface)] border border-red-500/15">
                        <p className="text-3xl font-bold text-red-400">{auditResult.critical}</p>
                        <p className="text-[10px] text-[var(--color-text-muted)] mt-1 uppercase tracking-wider">Critical</p>
                      </div>
                      <div className="p-4 rounded-xl bg-[var(--color-surface)] border border-amber-500/15">
                        <p className="text-3xl font-bold text-amber-400">{auditResult.high}</p>
                        <p className="text-[10px] text-[var(--color-text-muted)] mt-1 uppercase tracking-wider">High priority</p>
                      </div>
                    </div>
                    <div className="space-y-2 mb-6 text-left">
                      {(auditResult.leaks || []).slice(0, 3).map((l) => (
                        <div key={l.id || l.area} className="p-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)]/50">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <p className="text-xs font-semibold text-[var(--color-text-primary)]">{l.title || l.area}</p>
                            <span className={`text-[10px] font-semibold uppercase tracking-wider ${l.severity === "critical" ? "text-red-400" : l.severity === "high" ? "text-amber-400" : "text-[var(--color-text-muted)]"}`}>{l.severity}</span>
                          </div>
                          {l.recommendation && <p className="text-[10px] text-[var(--color-accent-bright)] mt-1">→ {l.recommendation}</p>}
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-[var(--color-text-muted)] mb-4">Labeled with evidence levels — verified facts, supported signals, and clearly marked estimates. We will also reach out to schedule a discovery call.</p>
                    <a href="#pricing" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--color-accent)] text-white text-sm font-semibold hover:bg-[var(--color-accent-hover)] transition-all">Fix these leaks <ArrowRight className="w-3.5 h-3.5" /></a>
                  </>
                ) : (
                  <>
                    <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-3">Audit request received.</h2>
                    <p className="text-sm text-[var(--color-text-secondary)] mb-2">Your business information has been submitted.</p>
                    <p className="text-sm text-[var(--color-text-muted)]">We will review the information, identify the most relevant automation opportunities, and contact you to schedule a discovery call.</p>
                  </>
                )}
              </motion.div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-[var(--color-text-muted)]">Step {step + 1} of {STEPS.length}</span>
                  <span className="text-xs text-[var(--color-text-muted)]">{cs.title}</span>
                </div>
                <div className="w-full h-1 bg-[var(--color-surface)] rounded-full mb-6">
                  <motion.div className="h-full bg-[var(--color-accent)] rounded-full" animate={{ width: pct + "%" }} transition={SPRING_STEP} />
                </div>

                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={step}
                    initial={reduced ? { opacity: 0 } : { opacity: 0, x: direction * 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={reduced ? { opacity: 0 } : { opacity: 0, x: direction * -40 }}
                    transition={SPRING_STEP}
                  >
                    <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4 sm:mb-6">{cs.question}</h2>
                    {cs.isInput ? (
                      <div className="space-y-4">
                        <input type="url" inputMode="url" autoComplete="url" placeholder="https://yourbusiness.com" aria-label="Your business website URL" value={answers[4]||""} onChange={e=>setAnswers({...answers,[4]:e.target.value})} className={ip} />
                        <div className="flex gap-3">
                          <button onClick={goBack} className={bc}><ArrowLeft className="w-4 h-4" />Back</button>
                          <button onClick={goForward} className={nc}>Continue <ArrowRight className="w-4 h-4" /></button>
                        </div>
                      </div>
                    ) : cs.isContact ? (
                      <div className="space-y-4">
                        <p className="text-xs text-[var(--color-text-muted)] -mb-2">That is enough for us to understand the shape of the problem. Enter your details and we will identify the most relevant automation opportunities.</p>
                        <input type="text" inputMode="text" autoComplete="name" placeholder="Your name" aria-label="Your name" value={name} onChange={e=>{setName(e.target.value); setFieldErrors({...fieldErrors, name:""});}} className={ip + (fieldErrors.name ? " border-red-400" : "")} />
                        {fieldErrors.name && <p className="text-xs text-red-400 mt-1">{fieldErrors.name}</p>}
                        <input type="email" inputMode="email" autoComplete="email" placeholder="Email address" aria-label="Email address" value={email} onChange={e=>{setEmail(e.target.value); setFieldErrors({...fieldErrors, email:""});}} className={ip + (fieldErrors.email ? " border-red-400" : "")} />
                        {fieldErrors.email && <p className="text-xs text-red-400 mt-1">{fieldErrors.email}</p>}
                        <input type="tel" inputMode="tel" placeholder="Phone / WhatsApp (optional)" aria-label="Phone or WhatsApp number" value={phone} onChange={e=>setPhone(e.target.value)} className={ip} />
                        <div className="flex gap-3">
                          <button onClick={goBack} className={bc}><ArrowLeft className="w-4 h-4" />Back</button>
                          <button onClick={sub} disabled={!name||!email||submitting} className={nc+" disabled:opacity-40 disabled:cursor-not-allowed"}>{submitting?<><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Submitting...</>:<>Analyze My Business <ArrowRight className="w-4 h-4" /></>}</button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {cs.options?.map(opt=>(
                          <button key={opt} onClick={()=>pick(opt)} className={cn("w-full text-left px-5 py-4 rounded-xl border text-sm transition-all cursor-pointer min-h-[48px] active:scale-[0.97]",answers[step]===opt?"bg-[var(--color-accent)]/10 border-[var(--color-accent)]/40 text-[var(--color-accent)]":"bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-light)] hover:bg-[var(--color-surface-elevated)]")}>{opt}</button>
                        ))}
                        {step>0&&<button onClick={goBack} className="flex items-center gap-2 px-4 py-3 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors text-sm cursor-pointer mt-2 min-h-[44px] active:scale-[0.97]"><ArrowLeft className="w-3 h-3" />Back</button>}
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>

                {fieldErrors.submit && <p className="text-xs text-red-400 text-center mb-2">{fieldErrors.submit}</p>}
                <p className="text-xs text-[var(--color-text-muted)] text-center mt-4">Free analysis. No credit card required. Results in minutes — every finding is labeled with its evidence level. <a href="/privacy" className="text-[var(--color-accent)] underline underline-offset-2 hover:text-[var(--color-accent-bright)]">Privacy policy</a></p>
              </>
            )}
          </div>

          {/* Short trust strip */}
          <div className="mt-6 grid grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)]/40">
              <p className="text-[11px] font-semibold text-[var(--color-text-primary)]">What you receive</p>
              <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">Evidence-based findings</p>
            </div>
            <div className="p-3 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)]/40">
              <p className="text-[11px] font-semibold text-[var(--color-text-primary)]">When</p>
              <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">Results in minutes</p>
            </div>
            <div className="p-3 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)]/40">
              <p className="text-[11px] font-semibold text-[var(--color-text-primary)]">Next step</p>
              <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">We contact you with results</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SYSTEMS - leaks are not isolated problems; each has an ELION system */}
      <section id="systems" className="py-12 sm:py-16 px-4 sm:px-6 bg-[var(--color-surface-raised)] scroll-mt-16">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-semibold text-[var(--color-accent-bright)] uppercase tracking-[0.2em] mb-4 text-center">Systems, not band-aids</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)] text-center mb-4" style={{letterSpacing:"-0.02em"}}>These are not isolated problems. They are operational leaks.</h2>
          <p className="text-center text-[var(--color-text-secondary)] mb-10 max-w-xl mx-auto text-sm">Every business loses revenue through processes nobody notices, until someone measures them. Each leak maps to a system ELION installs.</p>
          <div className="grid sm:grid-cols-2 gap-4">
            {PAIN_POINTS.map((p,i)=>(
              <div key={i} className="p-6 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]/50 hover:border-[var(--color-border)] transition-all flex flex-col">
                <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-2">{p.title}</h3>
                <p className="text-sm text-[var(--color-text-muted)] leading-relaxed flex-1">{p.desc}</p>
                <p className="mt-4 pt-3 border-t border-[var(--color-border)]/50 text-xs"><span className="text-[var(--color-text-muted)]">What ELION installs — </span><span className="text-[var(--color-accent-bright)] font-semibold">{p.fix}</span></p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. HOW WE FIX IT - sticky five-stage story */}
      <section id="how-it-works" className="py-12 sm:py-20 px-4 sm:px-6 scroll-mt-16">
        <div className="max-w-6xl mx-auto">
          <p className="text-xs font-semibold text-[var(--color-accent-bright)] uppercase tracking-[0.2em] mb-4 text-center">From finding the leak to fixing it</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)] text-center mb-12 max-w-3xl mx-auto" style={{letterSpacing:"-0.02em"}}>You do not buy another dashboard. You get an operating system for the workflow that matters.</h2>
          <StageStory />
        </div>
      </section>

      {/* 5. AUDIT VALUE / SAMPLE FINDINGS */}
      <section id="findings" className="py-12 sm:py-20 px-4 sm:px-6 bg-[var(--color-surface-raised)] scroll-mt-16">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)] text-center mb-3" style={{letterSpacing:"-0.02em"}}>See what ELION finds before you pay us.</h2>
          <p className="text-sm text-[var(--color-text-secondary)] text-center mb-10">Here is what a sample audit looks like.</p>
          <div className="rounded-xl border-2 border-dashed border-[var(--color-accent)]/30 bg-[var(--color-accent)]/[0.03] p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="px-3 py-1 rounded-md text-[11px] font-bold text-[var(--color-accent-bright)] bg-[var(--color-accent)]/15 uppercase tracking-wider border border-[var(--color-accent)]/20">Illustrative Example - Not a real client</span>
            </div>
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-1">Lagos Real Estate Agency</h3>
            <p className="text-xs text-[var(--color-text-muted)] mb-6">This shows what the audit produces.</p>
            <div className="grid sm:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)]/50">
                <p className="text-3xl font-bold text-[var(--color-text-primary)]">42</p>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">Automation Score</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)]/50">
                <p className="text-3xl font-bold text-red-400">2</p>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">Critical Findings</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)]/50">
                <p className="text-3xl font-bold text-amber-400">1</p>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">High Priority</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="p-4 rounded-lg bg-red-500/5 border border-red-500/15">
                <div className="flex items-center gap-2 mb-1"><span className="w-2 h-2 rounded-full bg-red-400" /><span className="text-xs font-semibold text-red-400 uppercase tracking-wider">Critical</span></div>
                <p className="text-sm font-medium text-[var(--color-text-primary)]">Lead Response Gap</p>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">Website visitors are directed to WhatsApp, but there is no automated qualification step before the conversation begins.</p>
                <p className="text-[10px] text-[var(--color-accent-bright)] mt-2 uppercase tracking-wider font-semibold">→ WhatsApp Lead Response</p>
              </div>
              <div className="p-4 rounded-lg bg-red-500/5 border border-red-500/15">
                <div className="flex items-center gap-2 mb-1"><span className="w-2 h-2 rounded-full bg-red-400" /><span className="text-xs font-semibold text-red-400 uppercase tracking-wider">Critical</span></div>
                <p className="text-sm font-medium text-[var(--color-text-primary)]">No Follow-Up System</p>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">There is no evidence of automated follow-up sequences for leads who do not convert on first contact.</p>
                <p className="text-[10px] text-[var(--color-accent-bright)] mt-2 uppercase tracking-wider font-semibold">→ Follow-Up System</p>
              </div>
              <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/15">
                <div className="flex items-center gap-2 mb-1"><span className="w-2 h-2 rounded-full bg-amber-400" /><span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">High</span></div>
                <p className="text-sm font-medium text-[var(--color-text-primary)]">Manual Booking Process</p>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">Property viewings require back-and-forth scheduling instead of automated booking.</p>
                <p className="text-[10px] text-[var(--color-accent-bright)] mt-2 uppercase tracking-wider font-semibold">→ Booking Automation</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. DEMO - embedded inside the funnel, no context break */}
      <section id="demo" className="py-12 sm:py-20 px-4 sm:px-6 scroll-mt-16">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-semibold text-[var(--color-accent-bright)] uppercase tracking-[0.2em] mb-4 text-center">See the system working</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)] text-center mb-3" style={{letterSpacing:"-0.02em"}}>Every enquiry handled. Every step visible.</h2>
          <p className="text-sm text-[var(--color-text-secondary)] text-center mb-10 max-w-xl mx-auto">Watch how a lead moves through the full workflow — capture, qualification, response, booking, follow-up — right here.</p>
          <DemoExperience ctaHref="#audit" />
        </div>
      </section>

      {/* 7. PRICING - canonical 3-tier model shared with / and /landing/pricing */}
      <section id="pricing" className="py-12 sm:py-20 px-4 sm:px-6 bg-[var(--color-surface-raised)] scroll-mt-16">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-semibold text-[var(--color-accent-bright)] uppercase tracking-[0.2em] mb-4 text-center">Simple, upfront pricing</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)] text-center mb-3" style={{letterSpacing:"-0.02em"}}>The same three packages, everywhere.</h2>
          <p className="text-sm text-[var(--color-text-secondary)] text-center mb-10 max-w-xl mx-auto">Choose the level of automation your business needs. One-time implementation fee — you own everything we build. Third-party provider and usage charges are always shown separately.</p>
          <TierCards ctaHref="#audit" ctaLabel="audit" showPayment callout="Most businesses start with Growth — lead response, follow-up and booking in one pipeline. Not sure? The free audit shows you the gap first." />
        </div>
      </section>

      {/* 8. OWNERSHIP */}
      <section className="py-12 sm:py-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-semibold text-[var(--color-accent-bright)] uppercase tracking-[0.2em] mb-4">The ELION difference</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-[var(--color-text-primary)] mb-6" style={{letterSpacing:"-0.02em"}}>Built for your business.<br />Owned by you.</h2>
          <p className="text-base text-[var(--color-text-secondary)] mb-10 max-w-xl mx-auto leading-relaxed">Most automation agencies sell you access to a system they control. ELION builds the system, documents it, and hands you the keys.</p>
          <div className="grid sm:grid-cols-2 gap-4 text-left max-w-2xl mx-auto mb-10">
            {[
              { title: "You own your systems", desc: "Workflows are documented and yours to keep." },
              { title: "You own your workflows", desc: "No artificial lock-in. Move freely if you choose." },
              { title: "You own your data", desc: "Your leads, your records, your information." },
              { title: "No artificial lock-in", desc: "Optional support, not mandatory dependency." },
              { title: "Third-party costs are disclosed", desc: "No hidden software subscriptions." },
              { title: "We can maintain it or hand it over", desc: "Full support or full handoff. Your choice." },
            ].map((item,i)=>(
              <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)]/50">
                <span className="text-[var(--color-success)] text-lg mt-0.5 shrink-0">&#10003;</span>
                <div>
                  <span className="text-sm font-semibold text-[var(--color-text-primary)]">{item.title}</span>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <a href="#audit" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-[var(--color-accent)] text-white font-semibold text-sm hover:bg-[var(--color-accent-hover)] transition-all shadow-lg shadow-[var(--color-accent)]/25 active:scale-[0.97]">Start with the Free Audit <ArrowRight className="w-4 h-4" /></a>
        </div>
      </section>

      {/* 9. FAQ */}
      <section id="faq" className="py-12 sm:py-20 px-4 sm:px-6 bg-[var(--color-surface-raised)] scroll-mt-16">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)] text-center mb-12" style={{letterSpacing:"-0.02em"}}>Frequently asked questions</h2>
          <div className="space-y-2">
            {FAQ_DATA.map((f,i)=>(
              <div key={i} className="border border-[var(--color-border)]/50 rounded-xl overflow-hidden">
                <button onClick={()=>setOpenFaq(openFaq===i?null:i)} className="w-full flex items-center justify-between px-6 py-5 text-left cursor-pointer hover:bg-[var(--color-surface)] transition-colors active:scale-[0.99]" aria-expanded={openFaq===i}>
                  <span className="text-sm font-medium text-[var(--color-text-primary)] pr-4">{f.q}</span>
                  <motion.div
                    animate={reduced ? {} : { rotate: openFaq === i ? 180 : 0 }}
                    transition={SPRING_FAQ}
                    className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", openFaq===i ? "bg-[var(--color-accent)]/10" : "bg-[var(--color-surface)]")}
                  >
                    <ChevronDown className="w-4 h-4 text-[var(--color-text-muted)]" />
                  </motion.div>
                </button>
                <AnimatePresence initial={false}>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={SPRING_FAQ}
                      style={{ overflow: "hidden", transformOrigin: "top" }}
                    >
                      <div className="px-6 pb-5">
                        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{f.a}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 10. FINAL CTA */}
      <section className="py-12 sm:py-24 px-4 sm:px-6">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)] mb-4" style={{letterSpacing:"-0.02em"}}>Your next operational leak is probably already costing you money.</h2>
          <p className="text-sm text-[var(--color-text-secondary)] mb-8">Run the free audit. See what ELION finds — then decide.</p>
          <a href="#audit" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-[var(--color-accent)] text-white font-semibold hover:bg-[var(--color-accent-hover)] transition-all text-base shadow-lg shadow-[var(--color-accent)]/25 active:scale-[0.97]">Run Your Free Business Audit <ArrowRight className="w-4 h-4" /></a>
          <p className="text-xs text-[var(--color-text-muted)] mt-4"><a href="#demo" className="text-[var(--color-accent)] hover:text-[var(--color-accent-bright)] transition-colors">See the demo first</a> or <a href="/audit" className="text-[var(--color-accent)] hover:text-[var(--color-accent-bright)] transition-colors">try the full audit</a>.</p>
        </div>
      </section>
      </main>

      <SiteFooter />

      {/* Mobile sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-40 sm:hidden glass-cta px-4 py-3 safe-area-bottom">
        <a href="#audit" className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-[var(--color-accent)] text-white font-semibold text-sm shadow-lg shadow-[var(--color-accent)]/25 active:scale-[0.97]">Run Free Audit <ArrowRight className="w-4 h-4" /></a>
      </div>
    </div>
  );
}
