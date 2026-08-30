"use client";
import Image from "next/image";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ArrowRight, ArrowLeft, CheckCircle2, Zap, RotateCcw, Calendar, ChevronDown, ChevronUp, Settings, Clock, Shield, ArrowDown } from "lucide-react";

const STEPS = [
  { title: "Business type", question: "What type of business do you run?", options: ["Service Business","E-commerce","Real Estate","Healthcare","Education","Professional Services","Hospitality","Other"] },
  { title: "Biggest problem", question: "What is your biggest operational challenge?", options: ["Leads not getting fast enough follow-up","Customers asking the same questions repeatedly","Booking handled manually","Customer info scattered across tools","Old leads never reactivated","Repetitive admin tasks","Other"] },
  { title: "Enquiry channels", question: "Where do most customer enquiries come from?", options: ["WhatsApp","Website","Instagram","Facebook","Email","Phone","Multiple channels","Other"] },
  { title: "Team size", question: "How large is the team handling these processes?", options: ["Just me","2-3 people","4-10 people","10+ people","Not sure"] },
  { title: "Website", question: "What is your business website?", isInput: true },
  { title: "Contact", question: "Where should we send your audit?", isContact: true },
];

const FAQ_DATA = [
  { q: "What exactly does ELION build?", a: "Custom automation workflows: lead response systems, follow-up sequences, appointment booking, revenue recovery, and operational data movement. Every system is built around your existing tools." },
  { q: "Do I need to replace my existing tools?", a: "No. ELION works around your existing stack. We connect WhatsApp, email, CRM, calendar, forms, and other tools you already use." },
  { q: "Do I need technical knowledge?", a: "No. You describe the problem and the outcome you want. ELION handles architecture, integrations, automation, testing, and deployment." },
  { q: "How long does implementation take?", a: "Once we understand your workflow, we move from diagnosis to implementation without unnecessary layers. We provide a timeline after the audit." },
  { q: "How much does implementation cost?", a: "Automation projects are scoped around your actual workflow. After the audit and discovery conversation, we provide a clear scope and price before work begins." },
  { q: "What happens after the audit?", a: "We review your information, identify the most relevant automation opportunities, and contact you to schedule a discovery call." },
  { q: "Do I need an account?", a: "No. The free audit requires no account. An account becomes relevant after implementation." },
  { q: "Who owns the automation?", a: "You do. Your workflows are documented. We avoid unnecessary platform lock-in." },
  { q: "What if an integration breaks?", a: "Optional ongoing support covers monitoring, maintenance, and fixes. We also document every workflow." },
  { q: "Are third-party software costs included?", a: "No. ELION builds the automation. Third-party tools are separate subscriptions you own and control." },
];

const METHOD = [
  { n: "01", title: "Diagnose", desc: "We identify where your current workflow breaks down." },
  { n: "02", title: "Design", desc: "We map the process and define what should be automated." },
  { n: "03", title: "Build", desc: "We connect your existing tools and build the workflow." },
  { n: "04", title: "Test", desc: "We verify the workflow before it touches production." },
  { n: "05", title: "Launch", desc: "The system goes live with your team." },
  { n: "06", title: "Improve", desc: "Optional ongoing support keeps the system maintained." },
];

const SYSTEMS = [
  { title: "Lead Response", icon: Zap, desc: "Capture + qualification + routing + response + CRM update", steps: ["Enquiry","Captured","Qualified","Responded","CRM updated","Team notified","Follow-up scheduled"] },
  { title: "Follow-Up", icon: Clock, desc: "Scheduled sequences + reminders + pipeline updates", steps: ["Lead enters","Sequence starts","WhatsApp/email sent","Response detected","Handoff to team","Pipeline updated"] },
  { title: "Booking", icon: Calendar, desc: "Qualification + availability + booking + reminders", steps: ["Enquiry","Qualification","Availability","Booked","Confirmed","Reminder","CRM updated"] },
  { title: "Revenue Recovery", icon: RotateCcw, desc: "Dormant customer identification + reactivation + tracking", steps: ["Dormant found","Eligibility check","Reactivation sent","Response detected","Follow-up","Team notified"] },
  { title: "Operations", icon: Settings, desc: "Data movement + notifications + approvals + reporting", steps: ["Trigger event","Data extracted","Transformed","Routed","Approved","Recorded"] },
];

const BEFORE = ["Manual follow-up","Scattered information","Repeated data entry","Forgotten leads","Manual booking","No reactivation"];
const AFTER = ["Structured lead response","Connected systems","Automated data movement","Follow-up workflows","Automated booking","Reactivation workflows"];

export default function FunnelPage() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeSystem, setActiveSystem] = useState(0);
  const cs = STEPS[step];
  const pct = ((step + 1) / STEPS.length) * 100;
  const pick = (opt: string) => { setAnswers({...answers, [step]: opt}); if (step < STEPS.length - 1) setStep(step + 1); };
  const sub = async () => { if (!name || !email) return; setSubmitting(true); try { await fetch("/api/request", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ name, email, phone, website: answers[4]||"", businessType: answers[0]||"", primaryProblem: answers[1]||"", enquiryChannels: answers[2]||"", teamSize: answers[3]||"", source: "funnel" }) }); } catch {} setSubmitting(false); setSubmitted(true); };

  const ip = "w-full px-5 py-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 focus:border-[var(--color-accent)] transition-all text-base";
  const bc = "flex items-center gap-2 px-5 py-3 rounded-xl border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)] transition-all text-sm cursor-pointer";
  const nc = "flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[var(--color-accent)] text-white font-semibold hover:bg-[var(--color-accent-hover)] transition-all text-sm cursor-pointer";

  return (
    <div className="min-h-screen bg-[var(--color-surface)]">      <header className="sticky top-0 z-50 bg-[var(--color-surface)]/80 backdrop-blur-xl border-b border-[var(--color-border)]/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5"><Image src="/brand/elion-e-icon.svg" alt="ELION" width={32} height={32} priority /><span className="font-bold text-[var(--color-text-primary)] tracking-tight" style={{fontFamily:"Space Grotesk,sans-serif"}}>ELION</span></div>
          <a href="#audit" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--color-accent)] text-white text-sm font-semibold hover:bg-[var(--color-accent-hover)] transition-all shadow-lg shadow-[var(--color-accent)]/20">Start Free Audit</a>
        </div>
      </header>
      <section className="pt-20 sm:pt-32 pb-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs font-semibold text-[var(--color-accent)] uppercase tracking-[0.2em] mb-6">Business Automation Systems</p>
          <h1 className="text-4xl sm:text-6xl font-bold text-[var(--color-text-primary)] tracking-tight leading-[1.1] mb-8">Find the leaks in your business. Then automate them.</h1>
          <p className="text-lg sm:text-xl text-[var(--color-text-secondary)] max-w-2xl mx-auto mb-12 leading-relaxed">Find the work your business should not be doing manually. Then let ELION build the system to fix it.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="#audit" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-[var(--color-accent)] text-white font-semibold hover:bg-[var(--color-accent-hover)] transition-all text-base shadow-lg shadow-[var(--color-accent)]/25">Run Your Free Business Audit <ArrowRight className="w-4 h-4" /></a>
            <a href="#method" className="inline-flex items-center gap-2 px-6 py-4 rounded-xl border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-raised)] transition-all text-sm">See How It Works</a>
          </div>
          <p className="text-xs text-[var(--color-text-muted)] mt-4">No credit card required. No account needed.</p>
        </div>
      </section>
      <section className="py-20 px-4 sm:px-6 bg-[var(--color-surface-raised)]">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-semibold text-[var(--color-accent)] uppercase tracking-[0.2em] mb-4 text-center">This is for you if</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)] text-center mb-12">Sound familiar?</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {["Leads are coming in but follow-up depends on staff remembering","Customers repeatedly ask the same questions","Bookings are handled manually with back-and-forth","Customer information lives across WhatsApp, email and spreadsheets","Teams repeatedly copy information between systems","Old leads and customers are never systematically reactivated"].map((p,i)=>(
              <div key={i} className="flex items-start gap-3 p-5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]/50 hover:border-[var(--color-border)] transition-all">
                <div className="w-5 h-5 rounded-full bg-[var(--color-accent)]/10 flex items-center justify-center shrink-0 mt-0.5"><ArrowRight className="w-3 h-3 text-[var(--color-accent)]" /></div>
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)] text-center mb-4">Before and after ELION</h2>
          <p className="text-center text-[var(--color-text-secondary)] mb-12">What changes when the right system is in place.</p>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)]/50 p-6">
              <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-[0.15em] mb-4">Before ELION</p>
              <div className="space-y-3">{BEFORE.map((b,i)=>(<div key={i} className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-[var(--color-text-muted)]/30" /><span className="text-sm text-[var(--color-text-muted)] line-through decoration-[var(--color-text-muted)]/30">{b}</span></div>))}</div>
            </div>
            <div className="rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-accent)]/20 p-6">
              <p className="text-xs font-semibold text-[var(--color-accent)] uppercase tracking-[0.15em] mb-4">After ELION</p>
              <div className="space-y-3">{AFTER.map((a,i)=>(<div key={i} className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)]" /><span className="text-sm text-[var(--color-text-primary)]">{a}</span></div>))}</div>
            </div>
          </div>
        </div>
      </section>      <section id="method" className="py-20 px-4 sm:px-6 bg-[var(--color-surface-raised)]">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-semibold text-[var(--color-accent)] uppercase tracking-[0.2em] mb-4 text-center">The ELION Method</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)] text-center mb-4">Better diagnosis. Faster implementation.</h2>
          <p className="text-center text-[var(--color-text-secondary)] mb-16 max-w-xl mx-auto">We do not hand you a template. We identify the problem, design the system, and build it around your business.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
            {METHOD.map((m,i)=>(
              <div key={m.n} className="relative p-6 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]/50 hover:border-[var(--color-border)] transition-all group">
                <span className="text-3xl font-bold text-[var(--color-accent)]/15 group-hover:text-[var(--color-accent)]/30 transition-all absolute top-4 right-5">{m.n}</span>
                <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-2 relative">{m.title}</h3>
                <p className="text-sm text-[var(--color-text-muted)] leading-relaxed relative">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-semibold text-[var(--color-accent)] uppercase tracking-[0.2em] mb-4 text-center">What we actually build</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)] text-center mb-4">Automation systems, not just tools.</h2>
          <p className="text-center text-[var(--color-text-secondary)] mb-12 max-w-xl mx-auto">Each system is designed around your specific workflow and connected to the tools you already use.</p>
          <div className="flex flex-wrap gap-2 justify-center mb-10">
            {SYSTEMS.map((s,i)=>(
              <button key={i} onClick={()=>setActiveSystem(i)} className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer",activeSystem===i?"bg-[var(--color-accent)] text-white shadow-lg shadow-[var(--color-accent)]/20":"bg-[var(--color-surface-raised)] border border-[var(--color-border)]/50 text-[var(--color-text-secondary)] hover:border-[var(--color-border)]")}>
                <s.icon className="w-4 h-4 inline mr-1.5" />{s.title}
              </button>
            ))}
          </div>
          <div className="rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)]/50 p-6 sm:p-8">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">{SYSTEMS[activeSystem].title}</h3>
            <p className="text-sm text-[var(--color-text-secondary)] mb-6">{SYSTEMS[activeSystem].desc}</p>
            <div className="flex flex-wrap items-center gap-2">
              {SYSTEMS[activeSystem].steps.map((s,i)=>(
                <div key={i} className="flex items-center gap-2">
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0",i===0?"bg-[var(--color-accent)] text-white":"bg-[var(--color-surface)] border border-[var(--color-border)]/50 text-[var(--color-text-muted)]")}>{i+1}</div>
                  <span className="text-sm text-[var(--color-text-secondary)] hidden sm:inline">{s}</span>
                  {i<SYSTEMS[activeSystem].steps.length-1&&<ArrowRight className="w-3 h-3 text-[var(--color-text-muted)]/30 mx-1 hidden sm:block" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      <section className="py-20 px-4 sm:px-6 bg-[var(--color-surface-raised)]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)] text-center mb-4">Why ELION</h2>
          <p className="text-center text-[var(--color-text-secondary)] mb-12 max-w-xl mx-auto">We are not competing on price. We are competing on diagnosis, system design, and speed.</p>
          <div className="grid sm:grid-cols-2 gap-4">
            {[{"t":"Better diagnosis","d":"We identify the actual operational problem before building anything."},{"t":"Clearer systems","d":"Every workflow is documented, structured, and designed for your specific business."},{"t":"Fast implementation","d":"Once we understand your workflow, we move from diagnosis to build without unnecessary layers."},{"t":"Existing tools first","d":"We connect what you already use. No forced platform migration."},{"t":"Client ownership","d":"You own the automation. Your workflows are documented. No lock-in."},{"t":"Optional support","d":"After launch, ongoing maintenance and improvement is available if you want it."}].map((item,i)=>(
              <div key={i} className="p-5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]/50">
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1.5">{item.t}</h3>
                <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">{item.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
<section className="py-20 px-4 sm:px-6 bg-[var(--color-surface-raised)]"><div className="max-w-3xl mx-auto text-center"><h2 className="text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)] mb-6">Clear pricing. No surprises.</h2><p className="text-lg text-[var(--color-text-secondary)] leading-relaxed">Automation projects are scoped around your actual workflow. After the audit and discovery conversation, we recommend the implementation that fits the problem with a clear scope and price before work begins.</p></div></section>

      {/* What You Receive */}
      <section className="py-12 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-semibold text-[var(--color-accent)] uppercase tracking-[0.2em] mb-4 text-center">What You Receive</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            {[
              { title: "Leak findings", desc: "Where your business is losing leads, time, or money based on your actual digital presence" },
              { title: "Automation map", desc: "Specific workflows that could be automated, ranked by business impact" },
              { title: "Next steps", desc: "A clear recommendation for what to implement and the estimated scope" },
            ].map((item) => (
              <div key={item.title} className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-lg p-5">
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">{item.title}</h3>
                <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section id="audit" className="py-20 px-4 sm:px-6"><div className="max-w-lg mx-auto"><p className="text-xs font-semibold text-[var(--color-accent)] uppercase tracking-[0.2em] mb-4 text-center">Free Business Automation Audit</p><h2 className="text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)] text-center mb-3">Find out what your business could automate.</h2><p className="text-sm text-[var(--color-text-secondary)] text-center mb-10">Answer a few questions. We use them to identify where automation may make sense.</p>{submitted ? (<div className="rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-accent)]/20 p-10 text-center"><CheckCircle2 className="w-14 h-14 text-[var(--color-accent)] mx-auto mb-5" /><h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-3">Audit request received.</h3><p className="text-sm text-[var(--color-text-secondary)] mb-2">Your business information has been submitted.</p><p className="text-sm text-[var(--color-text-muted)]">We will review the information, identify the most relevant automation opportunities, and contact you to schedule a discovery call.</p></div>) : (<div className="rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)]/50 p-6 sm:p-8"><div className="flex items-center justify-between mb-2"><span className="text-xs text-[var(--color-text-muted)]">Step {step + 1} of {STEPS.length}</span><span className="text-xs text-[var(--color-text-muted)]">{cs.title}</span></div><div className="w-full h-1 bg-[var(--color-surface)] rounded-full mb-8"><div className="h-full bg-[var(--color-accent)] rounded-full transition-all duration-500 ease-out" style={{width:pct+"%"}} /></div><h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-6">{cs.question}</h3>{cs.isInput ? (<div className="space-y-4"><input type="url" placeholder="https://yourbusiness.com" aria-label="Your website URL" value={answers[4]||""} onChange={e=>setAnswers({...answers,[4]:e.target.value})} className={ip} /><div className="flex gap-3"><button onClick={()=>setStep(step-1)} className={bc}><ArrowLeft className="w-4 h-4" />Back</button><button onClick={()=>setStep(step+1)} className={nc}>Continue <ArrowRight className="w-4 h-4" /></button></div></div>) : cs.isContact ? (<div className="space-y-4"><p className="text-xs text-[var(--color-text-muted)] -mb-2">That is enough for us to understand the shape of the problem. Enter your details and we will identify the most relevant automation opportunities.</p><input type="text" placeholder="Your name" aria-label="Your name" value={name} onChange={e=>setName(e.target.value)} className={ip} /><input type="email" placeholder="Email address" aria-label="Email address" value={email} onChange={e=>setEmail(e.target.value)} className={ip} /><input type="tel" placeholder="Phone / WhatsApp (optional)" aria-label="Phone or WhatsApp number" value={phone} onChange={e=>setPhone(e.target.value)} className={ip} /><div className="flex gap-3"><button onClick={()=>setStep(step-1)} className={bc}><ArrowLeft className="w-4 h-4" />Back</button><button onClick={sub} disabled={!name||!email||submitting} className={nc+" disabled:opacity-40 disabled:cursor-not-allowed"}>{submitting?<><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Submitting...</>:<>Submit Audit Request <ArrowRight className="w-4 h-4" /></>}</button></div></div>) : (<div className="space-y-2">{cs.options?.map(opt=>(<button key={opt} onClick={()=>pick(opt)} className={cn("w-full text-left px-5 py-4 rounded-xl border text-sm transition-all cursor-pointer hover:scale-[1.01]",answers[step]===opt?"bg-[var(--color-accent)]/10 border-[var(--color-accent)]/40 text-[var(--color-accent)]":"bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-light)] hover:bg-[var(--color-surface-elevated)]")}>{opt}</button>))}{step>0&&<button onClick={()=>setStep(step-1)} className="flex items-center gap-2 px-4 py-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors text-xs cursor-pointer mt-2"><ArrowLeft className="w-3 h-3" />Back</button>}</div>)}</div>)}</div></section>
<section className="py-20 px-4 sm:px-6 bg-[var(--color-surface-raised)]"><div className="max-w-2xl mx-auto"><h2 className="text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)] text-center mb-12">Frequently asked questions</h2><div className="space-y-2">{/* FAQ item 1 */}
{/* FAQ item 2 */}
{/* FAQ item 3 */}
{/* FAQ item 4 */}
{/* FAQ item 5 */}
{/* FAQ item 6 */}
{/* FAQ item 7 */}
{/* FAQ item 8 */}
{/* FAQ item 9 */}
{/* FAQ item 10 */}
            {FAQ_DATA.map((f,i)=>(
              <div key={i} className="border border-[var(--color-border)]/50 rounded-xl overflow-hidden transition-all">
                <button onClick={()=>setOpenFaq(openFaq===i?null:i)} className="w-full flex items-center justify-between px-6 py-5 text-left cursor-pointer hover:bg-[var(--color-surface)] transition-all">
                  <span className="text-sm font-medium text-[var(--color-text-primary)] pr-4">{f.q}</span>
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all",openFaq===i?"bg-[var(--color-accent)]/10 rotate-180":"bg-[var(--color-surface)]")}><ChevronDown className="w-4 h-4 text-[var(--color-text-muted)]" /></div>
                </button>
                {openFaq===i&&<div className="px-6 pb-5"><p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{f.a}</p></div>}
              </div>
            ))}
          </div></div></section>
<section className="py-20 px-4 sm:px-6"><div className="max-w-xl mx-auto text-center"><h2 className="text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)] mb-4">Find out what your business could automate.</h2><p className="text-sm text-[var(--color-text-secondary)] mb-8">Start with the free audit. No commitment.</p><a href="#audit" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-[var(--color-accent)] text-white font-semibold hover:bg-[var(--color-accent-hover)] transition-all text-base shadow-lg shadow-[var(--color-accent)]/25">Run Free Business Audit <ArrowRight className="w-4 h-4" /></a></div></section>
<footer className="border-t border-[var(--color-border)]/30 py-10 px-4 sm:px-6"><div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4"><div className="flex items-center gap-2.5"><div className="w-6 h-6 rounded-md bg-[var(--color-accent)] flex items-center justify-center"><span className="text-white text-[8px] font-bold">E</span></div><span className="text-sm text-[var(--color-text-muted)] font-medium">ELION</span></div><div className="flex items-center gap-6"><a href="/landing/privacy" className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors">Privacy</a><a href="/landing/terms" className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors">Terms</a><a href="/landing/support" className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors">Contact</a></div></div></footer>
    </div>
  );
}
