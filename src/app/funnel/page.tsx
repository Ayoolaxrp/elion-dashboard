"use client";
import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { ArrowRight, ArrowLeft, CheckCircle2, ChevronDown } from "lucide-react";

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
  { title: "Lead Response", desc: "A lead arrives. Nobody responds quickly enough." },
  { title: "Follow-Up", desc: "Interested prospects disappear because nobody follows up consistently." },
  { title: "Booking", desc: "Conversations happen, but appointments are not captured systematically." },
  { title: "Operations", desc: "Your team spends hours doing work software should handle." },
];

const PROCESS = [
  { n: "01", title: "Diagnose", desc: "We identify where opportunities are being lost." },
  { n: "02", title: "Design", desc: "We map the workflow and determine what should be automated." },
  { n: "03", title: "Build", desc: "ELION implements the required systems and integrations." },
  { n: "04", title: "Operate", desc: "The automation handles the repetitive work while you retain ownership." },
];

export default function FunnelPage() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const cs = STEPS[step];
  const pct = ((step + 1) / STEPS.length) * 100;
  const pick = (opt: string) => { setAnswers({...answers, [step]: opt}); if (step < STEPS.length - 1) setStep(step + 1); };
  const sub = async () => { if (!name || !email) return; setSubmitting(true); try { await fetch("/api/request", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ name, email, phone, website: answers[4]||"", businessType: answers[0]||"", primaryProblem: answers[1]||"", enquiryChannels: answers[2]||"", teamSize: answers[3]||"", source: "funnel" }) }); } catch {} setSubmitting(false); setSubmitted(true); };

  const ip = "w-full px-5 py-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 focus:border-[var(--color-accent)] transition-all text-base";
  const bc = "flex items-center gap-2 px-5 py-3 rounded-xl border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)] transition-all text-sm cursor-pointer";
  const nc = "flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[var(--color-accent)] text-white font-semibold hover:bg-[var(--color-accent-hover)] transition-all text-sm cursor-pointer";

  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      <header className="sticky top-0 z-50 bg-[var(--color-surface)]/80 backdrop-blur-xl border-b border-[var(--color-border)]/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Image src="/brand/elion-e-icon.svg" alt="ELION" width={32} height={32} priority />
            <span className="font-bold text-[var(--color-text-primary)] tracking-tight" style={{fontFamily:"Space Grotesk,sans-serif"}}>ELION</span>
          </div>
          <div className="hidden sm:flex items-center gap-6 text-sm">
            <a href="#method" className="text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors">How It Works</a>
            <a href="#audit" className="text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors">Audit</a>
            <a href="/demo" className="text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors">Demo</a>
            <a href="/landing/pricing" className="text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors">Pricing</a>
            <a href="/landing/about" className="text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors">About</a>
          </div>
          <a href="#audit" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--color-accent)] text-white text-sm font-semibold hover:bg-[var(--color-accent-hover)] transition-all shadow-lg shadow-[var(--color-accent)]/20">Start Free Audit</a>
        </div>
      </header>

      {/* HERO */}
      <section className="pt-12 sm:pt-20 pb-12 sm:pb-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs font-semibold text-[var(--color-accent)] uppercase tracking-[0.2em] mb-6">AI Operations for Growing Businesses</p>
          <h1 className="text-4xl sm:text-6xl font-bold text-[var(--color-text-primary)] tracking-tight leading-[1.1] mb-8">Find the leaks in your business.<br className="hidden sm:block" /> Then automate them.</h1>
          <p className="text-lg sm:text-xl text-[var(--color-text-secondary)] max-w-2xl mx-auto mb-12 leading-relaxed">ELION analyzes where leads, follow-ups, bookings, and repetitive operations are breaking down — then builds the systems to fix them.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="#audit" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-[var(--color-accent)] text-white font-semibold hover:bg-[var(--color-accent-hover)] transition-all text-base shadow-lg shadow-[var(--color-accent)]/25">Run Your Free Business Audit <ArrowRight className="w-4 h-4" /></a>
            <a href="#method" className="inline-flex items-center gap-2 px-6 py-4 rounded-xl border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-raised)] transition-all text-sm">See How It Works</a>
          </div>
          <p className="text-xs text-[var(--color-text-muted)] mt-4">No credit card. Evidence-based findings. You own the system.</p>
        </div>
      </section>

      {/* THE PAIN */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 bg-[var(--color-surface-raised)]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)] text-center mb-4">Your business may be leaking revenue in places you cannot see.</h2>
          <p className="text-center text-[var(--color-text-secondary)] mb-12 max-w-xl mx-auto">These are not isolated problems. They are operational leaks.</p>
          <div className="grid sm:grid-cols-2 gap-4">
            {PAIN_POINTS.map((p,i)=>(
              <div key={i} className="p-6 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]/50 hover:border-[var(--color-border)] transition-all">
                <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-2">{p.title}</h3>
                <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW ELION FINDS THE LEAK */}
      <section id="method" className="py-12 sm:py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs font-semibold text-[var(--color-accent)] uppercase tracking-[0.2em] mb-4">How ELION finds the leak</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)] mb-12">ELION finds the leaks before we automate them.</h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-0 flex-wrap">
            {["Your Business","Free Audit","Find the Leaks","Design the System","Automate the Work","Measure the Result"].map((s,i)=>(
              <div key={i} className="flex items-center gap-3">
                <div className={cn("px-4 py-3 rounded-xl text-sm font-medium border",i===0?"bg-[var(--color-surface-raised)] border-[var(--color-border)] text-[var(--color-text-secondary)]":"bg-[var(--color-accent)]/10 border-[var(--color-accent)]/20 text-[var(--color-accent)]")}>{s}</div>
                {i<5&&<ArrowRight className="w-4 h-4 text-[var(--color-text-muted)]/30 hidden sm:block" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SAMPLE AUDIT */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 bg-[var(--color-surface-raised)]">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-semibold text-[var(--color-accent)] uppercase tracking-[0.2em] mb-4 text-center">See what ELION finds before you pay us.</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)] text-center mb-3">Give us your business website. ELION analyzes publicly available information and identifies operational gaps worth fixing.</h2>
          <p className="text-sm text-[var(--color-text-secondary)] text-center mb-10">Here is what a sample audit looks like.</p>
          <div className="rounded-xl border border-[var(--color-accent)]/20 bg-[var(--color-surface)] p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold text-[var(--color-accent)] bg-[var(--color-accent)]/10 uppercase tracking-wider">Illustrative Example</span>
            </div>
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-1">Lagos Real Estate Agency</h3>
            <p className="text-xs text-[var(--color-text-muted)] mb-6">Not a real client — this shows what the audit produces.</p>
            <div className="grid sm:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border)]/50">
                <p className="text-3xl font-bold text-[var(--color-text-primary)]">42</p>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">Automation Score</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border)]/50">
                <p className="text-3xl font-bold text-red-400">2</p>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">Critical Findings</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border)]/50">
                <p className="text-3xl font-bold text-amber-400">1</p>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">High Priority</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="p-4 rounded-lg bg-red-500/5 border border-red-500/15">
                <div className="flex items-center gap-2 mb-1"><span className="w-2 h-2 rounded-full bg-red-400" /><span className="text-xs font-semibold text-red-400 uppercase tracking-wider">Critical</span></div>
                <p className="text-sm font-medium text-[var(--color-text-primary)]">Lead Response Gap</p>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">Website visitors are directed to WhatsApp, but there is no automated qualification step before the conversation begins.</p>
              </div>
              <div className="p-4 rounded-lg bg-red-500/5 border border-red-500/15">
                <div className="flex items-center gap-2 mb-1"><span className="w-2 h-2 rounded-full bg-red-400" /><span className="text-xs font-semibold text-red-400 uppercase tracking-wider">Critical</span></div>
                <p className="text-sm font-medium text-[var(--color-text-primary)]">No Follow-Up System</p>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">There is no evidence of automated follow-up sequences for leads who do not convert on first contact.</p>
              </div>
              <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/15">
                <div className="flex items-center gap-2 mb-1"><span className="w-2 h-2 rounded-full bg-amber-400" /><span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">High</span></div>
                <p className="text-sm font-medium text-[var(--color-text-primary)]">Manual Booking Process</p>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">Property viewings require back-and-forth scheduling instead of automated booking.</p>
              </div>
            </div>
          </div>
          <div className="text-center mt-8">
            <a href="#audit" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--color-accent)] text-white font-semibold text-sm hover:bg-[var(--color-accent-hover)] transition-all shadow-lg shadow-[var(--color-accent)]/25">Run Your Free Audit <ArrowRight className="w-4 h-4" /></a>
          </div>
        </div>
      </section>

      {/* HOW WE FIX IT */}
      <section className="py-12 sm:py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-semibold text-[var(--color-accent)] uppercase tracking-[0.2em] mb-4 text-center">From finding the leak to fixing it</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)] text-center mb-12">You do not buy another dashboard. You get an operating system for the workflow that matters.</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {PROCESS.map((m)=>(
              <div key={m.n} className="relative p-5 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)]/50 hover:border-[var(--color-border)] transition-all">
                <span className="text-2xl font-bold text-[var(--color-accent)]/15 absolute top-3 right-4">{m.n}</span>
                <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-2">{m.title}</h3>
                <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* OWNERSHIP */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 bg-[var(--color-surface-raised)]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)] mb-6">Built for your business. Owned by you.</h2>
          <div className="grid sm:grid-cols-2 gap-3 text-left max-w-xl mx-auto mb-8">
            {["You own your systems","You own your workflows","You own your data","No artificial lock-in","Third-party costs are disclosed","We can maintain it or hand it over"].map((item,i)=>(
              <div key={i} className="flex items-center gap-2">
                <span className="text-[var(--color-success)] text-sm">&#10003;</span>
                <span className="text-sm text-[var(--color-text-secondary)]">{item}</span>
              </div>
            ))}
          </div>
          <a href="#audit" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-secondary)] font-semibold text-sm hover:bg-[var(--color-surface-elevated)] transition-all">See How ELION Works</a>
        </div>
      </section>

      {/* OUTCOMES */}
      <section className="py-12 sm:py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)] text-center mb-4">What happens when the automation is built for your business?</h2>
          <p className="text-center text-[var(--color-text-secondary)] mb-12 max-w-xl mx-auto">Your workflow is unique. That is why ELION starts with an audit.</p>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { title: "More consistency", desc: "Important leads do not depend on someone remembering what to do next." },
              { title: "Less repetitive work", desc: "Your team stops manually moving information between tools." },
              { title: "Better visibility", desc: "You can see what is happening instead of guessing." },
            ].map((item,i)=>(
              <div key={i} className="p-6 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)]/50">
                <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-2">{item.title}</h3>
                <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AUDIT FORM */}
      <section id="audit" className="py-12 sm:py-20 px-4 sm:px-6 bg-[var(--color-surface-raised)]">
        <div className="max-w-lg mx-auto">
          <p className="text-xs font-semibold text-[var(--color-accent)] uppercase tracking-[0.2em] mb-4 text-center">Free Business Automation Audit</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)] text-center mb-3">Find out what your business could automate.</h2>
          <p className="text-sm text-[var(--color-text-secondary)] text-center mb-6 sm:mb-10">We analyze publicly available information about your business and show you where opportunities may be getting lost.</p>
          {submitted ? (
            <div className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-accent)]/20 p-10 text-center">
              <CheckCircle2 className="w-14 h-14 text-[var(--color-accent)] mx-auto mb-5" />
              <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-3">Audit request received.</h3>
              <p className="text-sm text-[var(--color-text-secondary)] mb-2">Your business information has been submitted.</p>
              <p className="text-sm text-[var(--color-text-muted)]">We will review the information, identify the most relevant automation opportunities, and contact you to schedule a discovery call.</p>
            </div>
          ) : (
            <div className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]/50 p-6 sm:p-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-[var(--color-text-muted)]">Step {step + 1} of {STEPS.length}</span>
                <span className="text-xs text-[var(--color-text-muted)]">{cs.title}</span>
              </div>
              <div className="w-full h-1 bg-[var(--color-surface-raised)] rounded-full mb-6">
                <div className="h-full bg-[var(--color-accent)] rounded-full transition-all duration-500 ease-out" style={{width:pct+"%"}} />
              </div>
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4 sm:mb-6">{cs.question}</h3>
              {cs.isInput ? (
                <div className="space-y-4">
                  <input type="url" inputMode="url" autoComplete="url" placeholder="https://yourbusiness.com" aria-label="Your business website URL" value={answers[4]||""} onChange={e=>setAnswers({...answers,[4]:e.target.value})} className={ip} />
                  <div className="flex gap-3">
                    <button onClick={()=>setStep(step-1)} className={bc}><ArrowLeft className="w-4 h-4" />Back</button>
                    <button onClick={()=>setStep(step+1)} className={nc}>Continue <ArrowRight className="w-4 h-4" /></button>
                  </div>
                </div>
              ) : cs.isContact ? (
                <div className="space-y-4">
                  <p className="text-xs text-[var(--color-text-muted)] -mb-2">That is enough for us to understand the shape of the problem. Enter your details and we will identify the most relevant automation opportunities.</p>
                  <input type="text" inputMode="text" autoComplete="name" placeholder="Your name" aria-label="Your name" value={name} onChange={e=>setName(e.target.value)} className={ip} />
                  <input type="email" inputMode="email" autoComplete="email" placeholder="Email address" aria-label="Email address" value={email} onChange={e=>setEmail(e.target.value)} className={ip} />
                  <input type="tel" inputMode="tel" placeholder="Phone / WhatsApp (optional)" aria-label="Phone or WhatsApp number" value={phone} onChange={e=>setPhone(e.target.value)} className={ip} />
                  <div className="flex gap-3">
                    <button onClick={()=>setStep(step-1)} className={bc}><ArrowLeft className="w-4 h-4" />Back</button>
                    <button onClick={sub} disabled={!name||!email||submitting} className={nc+" disabled:opacity-40 disabled:cursor-not-allowed"}>{submitting?<><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Submitting...</>:<>Analyze My Business <ArrowRight className="w-4 h-4" /></>}</button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {cs.options?.map(opt=>(
                    <button key={opt} onClick={()=>pick(opt)} className={cn("w-full text-left px-5 py-4 rounded-xl border text-sm transition-all cursor-pointer min-h-[48px] ",answers[step]===opt?"bg-[var(--color-accent)]/10 border-[var(--color-accent)]/40 text-[var(--color-accent)]":"bg-[var(--color-surface-raised)] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-light)] hover:bg-[var(--color-surface-elevated)]")}>{opt}</button>
                  ))}
                  {step>0&&<button onClick={()=>setStep(step-1)} className="flex items-center gap-2 px-4 py-3 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors text-sm cursor-pointer mt-2 min-h-[44px]"><ArrowLeft className="w-3 h-3" />Back</button>}
                </div>
              )}
              <p className="text-xs text-[var(--color-text-muted)] text-center mt-4">Free analysis. No credit card required.</p>
            </div>
          )}
        </div>
      </section>

      {/* FAQ */}
      <section className="py-12 sm:py-20 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)] text-center mb-12">Frequently asked questions</h2>
          <div className="space-y-2">
            {FAQ_DATA.map((f,i)=>(
              <div key={i} className="border border-[var(--color-border)]/50 rounded-xl overflow-hidden transition-all">
                <button onClick={()=>setOpenFaq(openFaq===i?null:i)} className="w-full flex items-center justify-between px-6 py-5 text-left cursor-pointer hover:bg-[var(--color-surface-raised)] transition-all">
                  <span className="text-sm font-medium text-[var(--color-text-primary)] pr-4">{f.q}</span>
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all",openFaq===i?"bg-[var(--color-accent)]/10 rotate-180":"bg-[var(--color-surface-raised)]")}><ChevronDown className="w-4 h-4 text-[var(--color-text-muted)]" /></div>
                </button>
                {openFaq===i&&<div className="px-6 pb-5"><p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{f.a}</p></div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 bg-[var(--color-surface-raised)]">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)] mb-4">Find your leaks.</h2>
          <p className="text-sm text-[var(--color-text-secondary)] mb-8">Start with the free audit. No commitment.</p>
          <a href="#audit" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-[var(--color-accent)] text-white font-semibold hover:bg-[var(--color-accent-hover)] transition-all text-base shadow-lg shadow-[var(--color-accent)]/25">Run Your Free Audit <ArrowRight className="w-4 h-4" /></a>
        </div>
      </section>

      <footer className="border-t border-[var(--color-border)]/30 py-10 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-[var(--color-accent)] flex items-center justify-center"><span className="text-white text-[8px] font-bold">E</span></div>
            <span className="text-sm text-[var(--color-text-muted)] font-medium">ELION</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="/landing/privacy" className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors">Privacy</a>
            <a href="/landing/terms" className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors">Terms</a>
            <a href="/landing/support" className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
