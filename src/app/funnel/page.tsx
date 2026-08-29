"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { ArrowRight, ArrowLeft, CheckCircle2, Zap, RotateCcw, Calendar, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
const STEPS = [
  { title: "Business type", question: "What best describes your business?", options: ["Service Business","E-commerce","Real Estate","Healthcare","Education","Professional Services","Hospitality","Other"] },
  { title: "Biggest problem", question: "What is your biggest operational challenge?", options: ["Getting back to leads quickly","Following up with prospects","Booking appointments","Managing customer info","Reactivating old customers","Reducing admin work","Other"] },
  { title: "Channels", question: "Where do most enquiries come from?", options: ["WhatsApp","Website","Instagram","Facebook","Email","Phone","Multiple channels","Other"] },
  { title: "Team size", question: "How many people handle operations?", options: ["Just me","2-3 people","4-10 people","10+ people","Not sure"] },
  { title: "Website", question: "What is your business website?", isInput: true },
  { title: "Contact", question: "How should we reach you?", isContact: true },
];

const FAQ_DATA = [
  { q: "What does ELION implement?", a: "Custom automation: lead response, follow-up, booking, revenue recovery, operational automation." },
  { q: "Do I need to replace tools?", a: "No. We connect to what you already use." },
  { q: "Do I need to be technical?", a: "No. You describe the problem. We build the system." },
  { q: "How much does it cost?", a: "Project-based. After your audit we provide a clear quote." },
  { q: "What happens after the audit?", a: "Results identify opportunities. Book a discovery call." },
  { q: "Ongoing support?", a: "Yes. Optional monthly support for monitoring and improvements." },
  { q: "Who owns the automation?", a: "You do. Once deployed, it belongs to your business." },
];

const WFS = [
  { title: "Lead Response", icon: Zap, steps: ["Enquiry","Captured","Qualified","Instant response","CRM record","Team notified","Follow-up scheduled"] },
  { title: "Revenue Recovery", icon: RotateCcw, steps: ["Dormant found","Eligibility","Reactivation sent","Response detected","Follow-up","Team notified","Recorded"] },
  { title: "Booking", icon: Calendar, steps: ["Enquiry","Qualification","Availability","Booked","Reminder","Rescheduling","CRM updated"] },
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
  const pick = (opt: string) => { setAnswers({ ...answers, [step]: opt }); if (step < STEPS.length - 1) setStep(step + 1); };
  const sub = async () => { if (!name || !email) return; setSubmitting(true); try { await fetch("/api/request", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, phone, website: answers[4] || "", businessType: answers[0] || "", primaryProblem: answers[1] || "", enquiryChannels: answers[2] || "", teamSize: answers[3] || "", source: "funnel" }) }); } catch {} setSubmitting(false); setSubmitted(true); };
  const ip = "w-full px-4 py-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 focus:border-[var(--color-accent)] transition-colors";
  const bc = "flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)] transition-colors text-sm cursor-pointer";
  const nc = "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--color-accent)] text-white font-medium hover:bg-[var(--color-accent-hover)] transition-colors text-sm cursor-pointer";

  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      <header className="sticky top-0 z-50 bg-[var(--color-surface)]/80 backdrop-blur-md border-b border-[var(--color-border)]">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2"><div className="w-7 h-7 rounded bg-[var(--color-accent)] flex items-center justify-center shrink-0"><span className="text-white text-[10px] font-bold">E</span></div><span className="font-bold text-[var(--color-text-primary)] tracking-tight text-sm">ELION</span></div>
          <a href="#audit" className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-accent)] text-white text-sm font-medium hover:bg-[var(--color-accent-hover)] transition-colors">Run Free Audit</a>
        </div>
      </header>
      <section className="pt-16 sm:pt-24 pb-16 px-4"><div className="max-w-3xl mx-auto text-center">
        <p className="text-xs font-semibold text-[var(--color-accent)] uppercase tracking-wider mb-4">Business Automation Systems</p>
        <h1 className="text-3xl sm:text-5xl font-bold text-[var(--color-text-primary)] tracking-tight leading-tight mb-6">Where is your business losing leads, time, or opportunities?</h1>
        <p className="text-lg text-[var(--color-text-secondary)] max-w-2xl mx-auto mb-10">ELION analyzes your workflow, identifies automation opportunities, and shows what can be fixed.</p>
        <a href="#audit" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg bg-[var(--color-accent)] text-white font-semibold hover:bg-[var(--color-accent-hover)] transition-colors text-sm">Run Your Free Audit <ArrowRight className="w-4 h-4" /></a>
        <p className="text-xs text-[var(--color-text-muted)] mt-3">No credit card required</p>
      </div></section>
      <section className="py-16 px-4 bg-[var(--color-surface-raised)]"><div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-[var(--color-text-primary)] text-center mb-12">Sound familiar?</h2>
        <div className="grid sm:grid-cols-2 gap-6">
          {["Leads come in but follow-up is slow","Customers wait hours for a response","Team repeats same admin tasks","Customers disappear after first conversation","Information scattered across tools","Old customers stay inactive"].map((p,i)=>(
            <div key={i} className="flex items-start gap-3 p-4 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)]"><AlertTriangle className="w-5 h-5 text-[var(--color-warning)] shrink-0 mt-0.5" /><p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{p}</p></div>
          ))}
        </div>
      </div></section>
      <section className="py-16 px-4"><div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-[var(--color-text-primary)] text-center mb-4">ELION finds the bottlenecks, then builds the system.</h2>
        <p className="text-center text-[var(--color-text-secondary)] mb-12 max-w-xl mx-auto">We identify what is happening in your business, then recommend the right automation.</p>
        <div className="grid sm:grid-cols-4 gap-4">
          {[{s:"1",l:"Identify",d:"Analyze workflow"},{s:"2",l:"Map",d:"Map customer journey"},{s:"3",l:"Recommend",d:"Propose automation"},{s:"4",l:"Build",d:"Implement and launch"}].map(i2=>(
            <div key={i2.s} className="text-center p-5 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border)]"><div className="w-10 h-10 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)] flex items-center justify-center text-sm font-bold mx-auto mb-3">{i2.s}</div><h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">{i2.l}</h3><p className="text-xs text-[var(--color-text-muted)]">{i2.d}</p></div>
          ))}
        </div>
      </div></section>
      <section className="py-16 px-4 bg-[var(--color-surface-raised)]"><div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-[var(--color-text-primary)] text-center mb-12">What ELION builds</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {WFS.map(wf=>(
            <div key={wf.title} className="rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] p-6"><div className="flex items-center gap-2.5 mb-4"><div className="w-9 h-9 rounded-lg bg-[var(--color-accent)]/10 flex items-center justify-center"><wf.icon className="w-4 h-4 text-[var(--color-accent)]" /></div><h3 className="text-sm font-semibold text-[var(--color-text-primary)]">{wf.title}</h3></div><div className="space-y-2">{wf.steps.map((s,i)=>(<div key={i} className="flex items-center gap-2"><div className={cn("w-1.5 h-1.5 rounded-full shrink-0",i===0?"bg-[var(--color-accent)]":"bg-[var(--color-border-light)]")} /><span className="text-xs text-[var(--color-text-muted)]">{s}</span></div>))}</div></div>
          ))}
        </div>
      </div></section>
      <section id="audit" className="py-16 px-4"><div className="max-w-lg mx-auto">
        <h2 className="text-2xl font-bold text-[var(--color-text-primary)] text-center mb-2">Run Your Free Business Audit</h2>
        <p className="text-sm text-[var(--color-text-secondary)] text-center mb-8">Answer a few questions so we can analyze your business.</p>
        {submitted ? (
          <div className="rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border)] p-8 text-center"><CheckCircle2 className="w-12 h-12 text-[var(--color-success)] mx-auto mb-4" /><h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">Your audit request is in.</h3><p className="text-sm text-[var(--color-text-secondary)]">We will review your information and contact you within 24 hours.</p></div>
        ) : (
          <div className="rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border)] p-6">
            <div className="flex items-center justify-between mb-1"><span className="text-xs text-[var(--color-text-muted)]">{step+1}/{STEPS.length}</span><span className="text-xs text-[var(--color-text-muted)]">{cs.title}</span></div>
            <div className="w-full h-1 bg-[var(--color-surface)] rounded-full mb-6"><div className="h-full bg-[var(--color-accent)] rounded-full transition-all duration-300" style={{width:pct+"%"}} /></div>
            <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-5">{cs.question}</h3>
            {cs.isInput ? (
              <div className="space-y-4">
                <input type="url" placeholder="https://yourbusiness.com" value={answers[4]||""} onChange={e=>setAnswers({...answers,[4]:e.target.value})} className={ip} />
                <div className="flex gap-3"><button onClick={()=>setStep(step-1)} className={bc}><ArrowLeft className="w-4 h-4" />Back</button><button onClick={()=>setStep(step+1)} className={nc}>Continue<ArrowRight className="w-4 h-4" /></button></div>
              </div>
            ) : cs.isContact ? (
              <div className="space-y-4">
                <input type="text" placeholder="Your name" value={name} onChange={e=>setName(e.target.value)} className={ip} />
                <input type="email" placeholder="Email address" value={email} onChange={e=>setEmail(e.target.value)} className={ip} />
                <input type="tel" placeholder="Phone / WhatsApp (optional)" value={phone} onChange={e=>setPhone(e.target.value)} className={ip} />
                <div className="flex gap-3"><button onClick={()=>setStep(step-1)} className={bc}><ArrowLeft className="w-4 h-4" />Back</button><button onClick={sub} disabled={!name||!email||submitting} className={nc+" disabled:opacity-50 disabled:cursor-not-allowed"}>{submitting?<><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Analyzing...</>:<>Analyze My Business<ArrowRight className="w-4 h-4" /></>}</button></div>
              </div>
            ) : (
              <div className="space-y-2">
                {cs.options?.map(opt=>(<button key={opt} onClick={()=>pick(opt)} className={cn("w-full text-left px-4 py-3 rounded-lg border text-sm transition-colors cursor-pointer",answers[step]===opt?"bg-[var(--color-accent)]/10 border-[var(--color-accent)]/40 text-[var(--color-accent)]":"bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-light)] hover:bg-[var(--color-surface-elevated)]")}>{opt}</button>))}
                {step>0&&<button onClick={()=>setStep(step-1)} className="flex items-center gap-2 px-4 py-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors text-xs cursor-pointer mt-2"><ArrowLeft className="w-3 h-3" />Back</button>}
              </div>
            )}
          </div>
        )}
      </div></section>
      <section className="py-16 px-4 bg-[var(--color-surface-raised)]"><div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-[var(--color-text-primary)] text-center mb-8">Frequently asked questions</h2>
        <div className="space-y-2">
          {FAQ_DATA.map((f,i)=>(
            <div key={i} className="border border-[var(--color-border)] rounded-lg overflow-hidden"><button onClick={()=>setOpenFaq(openFaq===i?null:i)} className="w-full flex items-center justify-between px-5 py-4 text-left cursor-pointer"><span className="text-sm font-medium text-[var(--color-text-primary)] pr-4">{f.q}</span>{openFaq===i?<ChevronUp className="w-4 h-4 text-[var(--color-text-muted)] shrink-0" />:<ChevronDown className="w-4 h-4 text-[var(--color-text-muted)] shrink-0" />}</button>{openFaq===i&&<div className="px-5 pb-4"><p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{f.a}</p></div>}</div>
          ))}
        </div>
      </div></section>
      <section className="py-16 px-4"><div className="max-w-xl mx-auto text-center">
        <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-4">Find out what ELION can automate in your business.</h2>
        <p className="text-sm text-[var(--color-text-secondary)] mb-8">Run the free audit. See your leaks. Then decide.</p>
        <a href="#audit" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg bg-[var(--color-accent)] text-white font-semibold hover:bg-[var(--color-accent-hover)] transition-colors text-sm">Run Free Audit <ArrowRight className="w-4 h-4" /></a>
      </div></section>
      <footer className="border-t border-[var(--color-border)] py-8 px-4"><div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2"><div className="w-5 h-5 rounded bg-[var(--color-accent)] flex items-center justify-center"><span className="text-white text-[7px] font-bold">E</span></div><span className="text-xs text-[var(--color-text-muted)]">ELION</span></div>
        <div className="flex items-center gap-6"><a href="/landing/privacy" className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors">Privacy</a><a href="/landing/terms" className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors">Terms</a><a href="/landing/support" className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors">Contact</a></div>
      </div></footer>
    </div>
  );
}
