"use client";

import { FormEvent, useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, Loader2, RotateCcw, ShieldCheck } from "lucide-react";

const SCENARIOS = {
  "Real Estate": {
    problem: "Enquiries arrive, but buyers wait too long for a useful reply.",
    customer: "Hello, I am interested in a property in Lagos.",
    response: "Great — I can help narrow that down. What area, property type, and budget range are you considering?",
    leak: "A high-intent property enquiry can wait while a team member searches for context and replies manually.",
    system: "WhatsApp Lead Response",
    workflow: ["Customer enquiry", "Approved response", "Qualification questions", "CRM handoff", "Human follow-up"],
  },
  Clinic: {
    problem: "Patients ask repeat questions and struggle to book at the right time.",
    customer: "Can I book an appointment for tomorrow afternoon?",
    response: "I can help check the available appointment options. What service do you need and what time works best?",
    leak: "A booking request can be lost between a message, a calendar, and the front desk.",
    system: "AI Receptionist + Booking",
    workflow: ["Patient message", "FAQ answer", "Service qualification", "Availability check", "Human escalation"],
  },
  Restaurant: {
    problem: "Customers message after closing hours and do not receive a timely booking response.",
    customer: "Can I reserve a table tonight?",
    response: "I can help with that. How many guests should I plan for, and what time would you prefer?",
    leak: "A booking request can go cold before staff return to the inbox.",
    system: "AI Receptionist + Booking",
    workflow: ["Customer message", "Approved reply", "Party-size question", "Booking request", "Team handoff"],
  },
  Hotel: {
    problem: "Guests ask about rooms and availability while the reservations team is occupied.",
    customer: "Do you have a room available this weekend?",
    response: "I can help start that enquiry. Which dates, room type, and number of guests should I check?",
    leak: "A reservation enquiry can lose momentum when availability checks depend on a manual reply.",
    system: "AI Sales Employee",
    workflow: ["Guest enquiry", "Approved answer", "Stay qualification", "Reservation handoff", "Follow-up"],
  },
  School: {
    problem: "Parents ask the same admissions questions and follow-up is inconsistent.",
    customer: "How do I apply for admission for my child?",
    response: "I can explain the next step. Which class or year group are you enquiring about, and when would you like to start?",
    leak: "An interested parent can leave before the admissions team has captured the details needed to follow up.",
    system: "AI Sales Employee",
    workflow: ["Parent enquiry", "Approved response", "Admissions questions", "Lead record", "Staff handoff"],
  },
} as const;

type Industry = keyof typeof SCENARIOS;
type Stage = "choose" | "problem" | "conversation" | "finding" | "capture" | "complete";
const INDUSTRIES = Object.keys(SCENARIOS) as Industry[];
const PROBLEM_OPTIONS = [
  "Customers wait too long for a reply",
  "Follow-up gets forgotten after the first enquiry",
  "Bookings require too much manual back-and-forth",
] as const;

function StageRail({ stage, onReset }: { stage: Stage; onReset: () => void }) {    const stages = ["Choose context", "Choose problem", "See conversation", "Find the leak", "Take action"];
    const current = stage === "choose" ? 0 : stage === "problem" ? 1 : stage === "conversation" ? 2 : stage === "finding" ? 3 : 4;

  return (
    <div className="mb-12 flex items-center justify-between gap-4 border-y border-[var(--color-border)]/60 py-4">
      <ol className="flex min-w-0 flex-1 items-center gap-2 text-xs text-[var(--color-text-muted)] sm:gap-3">
        {stages.map((label, index) => (
          <li key={label} className={`flex min-w-0 items-center gap-2 ${index <= current ? "text-[var(--color-text-primary)]" : ""}`}>
            <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold ${index < current ? "border-[var(--color-success)] bg-[var(--color-success)]/10 text-[var(--color-success)]" : index === current ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent-bright)]" : "border-[var(--color-border)]"}`}>{index < current ? "✓" : index + 1}</span>
            <span className="hidden truncate sm:inline">{label}</span>
            {index < stages.length - 1 && <span className="hidden text-[var(--color-border-light)] md:inline">/</span>}
          </li>
        ))}
      </ol>
      {stage !== "choose" && <button type="button" onClick={onReset} className="inline-flex shrink-0 items-center gap-1.5 text-xs font-medium text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-primary)]"><RotateCcw className="h-3.5 w-3.5" /> Reset</button>}
    </div>
  );
}

export default function DemoExperience({ ctaHref = "/audit" }: { ctaHref?: string }) {
  const [industry, setIndustry] = useState<Industry | null>(null);
  const [selectedProblem, setSelectedProblem] = useState<string>("");
  const [stage, setStage] = useState<Stage>("choose");
  const [form, setForm] = useState({ name: "", email: "", companyName: "", challenge: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const scenario = useMemo(() => (industry ? SCENARIOS[industry] : null), [industry]);

  const reset = () => {
    setIndustry(null);
    setSelectedProblem("");
    setStage("choose");
    setForm({ name: "", email: "", companyName: "", challenge: "" });
    setError("");
  };

  const submitLead = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!industry || !scenario) return;
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          companyName: form.companyName.trim(),
          businessType: industry,
          primaryProblem: form.challenge.trim() || selectedProblem || scenario.problem,
          enquiryChannels: "demo",
          source: "interactive_demo",
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "We could not save your request.");
      setStage("complete");
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "We could not save your request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-12 flex items-start gap-3 border-l-2 border-[var(--color-accent)]/60 pl-5">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-accent-bright)]" />
        <div>
          <p className="text-sm font-semibold text-[var(--color-text-primary)]">Interactive simulation</p>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[var(--color-text-secondary)]">Choose a business context and watch one example move from enquiry to recommendation. This is sample content: no messages are sent and no customer result is being claimed.</p>
        </div>
      </div>

      <div className="mb-12 max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-accent-bright)]">See the diagnosis</p>
        <h1 className="mt-4 text-4xl font-bold leading-[1.05] tracking-[-0.04em] text-[var(--color-text-primary)] md:text-6xl">Watch an ELION employee handle the first reply.</h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-[var(--color-text-secondary)] md:text-lg">The value is not the reply alone. It is what happens next: qualification, a clear handoff, and a system designed around the leak.</p>
      </div>

      <StageRail stage={stage} onReset={reset} />

      {stage === "choose" && (
        <section aria-labelledby="industry-heading">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">01 · Choose a context</p>
          <h2 id="industry-heading" className="mt-3 text-2xl font-semibold tracking-tight text-[var(--color-text-primary)] md:text-3xl">Which business should we simulate?</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--color-text-muted)]">The scenario changes with your industry. The operating principle stays the same: understand the leak before recommending the fix.</p>
          <div className="mt-8 grid gap-px overflow-hidden border border-[var(--color-border)]/70 bg-[var(--color-border)]/70 sm:grid-cols-2 lg:grid-cols-5">
            {INDUSTRIES.map((value) => (
              <button key={value} type="button" onClick={() => { setIndustry(value); setStage("problem"); setError(""); }} className="group bg-[var(--color-surface)] p-5 text-left transition-colors hover:bg-[var(--color-surface-raised)]">
                <span className="text-sm font-semibold text-[var(--color-text-primary)]">{value}</span>
                <span className="mt-3 flex items-center gap-1 text-xs text-[var(--color-text-muted)] transition-colors group-hover:text-[var(--color-accent-bright)]">Choose a problem <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" /></span>
              </button>
            ))}
          </div>
        </section>
      )}

      {industry && stage === "problem" && (
        <section aria-labelledby="problem-heading">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-accent-bright)]">01 · {industry} scenario</p>
          <h2 id="problem-heading" className="mt-3 text-2xl font-semibold tracking-tight text-[var(--color-text-primary)] md:text-3xl">What should the employee help with?</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--color-text-muted)]">Choose the business problem you want to explore. This simulation stays illustrative; a real recommendation follows an audit.</p>
          <div className="mt-8 max-w-2xl divide-y divide-[var(--color-border)]/60 border-y border-[var(--color-border)]/60">
            {PROBLEM_OPTIONS.map((problem) => (
              <button key={problem} type="button" onClick={() => { setSelectedProblem(problem); setStage("conversation"); }} className="group flex w-full items-center justify-between gap-4 py-5 text-left transition-colors hover:text-[var(--color-accent-bright)]">
                <span className="text-base font-medium text-[var(--color-text-primary)] group-hover:text-[var(--color-accent-bright)]">{problem}</span><ArrowRight className="h-4 w-4 shrink-0 text-[var(--color-text-muted)] transition-transform group-hover:translate-x-1" />
              </button>
            ))}
          </div>
        </section>
      )}

      {scenario && stage === "conversation" && (
        <section aria-labelledby="conversation-heading" className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-accent-bright)]">02 · {industry} scenario</p>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">Exploring: <span className="text-[var(--color-text-secondary)]">{selectedProblem || scenario.problem}</span></p>
            <h2 id="conversation-heading" className="mt-3 text-2xl font-semibold tracking-tight text-[var(--color-text-primary)] md:text-3xl">A customer sends a message.</h2>
            <div className="mt-8 space-y-5 border-y border-[var(--color-border)]/60 py-6">
              <div className="max-w-[88%]"><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">Customer · illustrative</p><p className="mt-2 text-lg leading-relaxed text-[var(--color-text-primary)]">“{scenario.customer}”</p></div>
              <div className="ml-auto max-w-[88%] border-l-2 border-[var(--color-accent)] pl-4"><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-accent-bright)]">ELION employee · simulated</p><p className="mt-2 text-lg leading-relaxed text-[var(--color-text-primary)]">“{scenario.response}”</p></div>
            </div>
            <button type="button" onClick={() => setStage("finding")} className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-accent-hover)]">Show the operational finding <ArrowRight className="h-4 w-4" /></button>
          </div>
          <aside className="border-t border-[var(--color-border)]/60 pt-6 lg:border-l lg:border-t-0 lg:pl-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">What the employee does</p>
            <ol className="mt-5 space-y-4">{scenario.workflow.map((step, index) => <li key={step} className="flex items-start gap-3 text-sm text-[var(--color-text-secondary)]"><span className="text-xs font-bold text-[var(--color-accent-bright)]">0{index + 1}</span><span>{step}</span></li>)}</ol>
          </aside>
        </section>
      )}

      {scenario && stage === "finding" && (
        <section aria-labelledby="finding-heading">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-warning)]">03 · Operational leak</p>
          <div className="mt-4 grid gap-10 lg:grid-cols-[1fr_0.8fr] lg:items-start">
            <div><h2 id="finding-heading" className="text-3xl font-semibold leading-tight tracking-tight text-[var(--color-text-primary)] md:text-4xl">{selectedProblem || scenario.problem}</h2><p className="mt-5 max-w-2xl text-base leading-relaxed text-[var(--color-text-secondary)]">{scenario.leak}</p></div>
            <div className="border-l-2 border-[var(--color-accent)] pl-5"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">Recommended system</p><h3 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--color-accent-bright)]">{scenario.system}</h3><p className="mt-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">This is a scoped recommendation for the example. A real recommendation follows an audit of the business and its available evidence.</p></div>
          </div>
          <div className="mt-10 border-y border-[var(--color-border)]/60 py-5"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">The handoff</p><div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">{scenario.workflow.map((step, index) => <span key={step} className="inline-flex items-center gap-2 text-xs text-[var(--color-text-secondary)]"><span>{step}</span>{index < scenario.workflow.length - 1 && <ArrowRight className="h-3 w-3 text-[var(--color-text-muted)]" />}</span>)}</div></div>
          <button type="button" onClick={() => setStage("capture")} className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-accent-hover)]">See how this could fit your business <ArrowRight className="h-4 w-4" /></button>
        </section>
      )}

      {scenario && stage === "capture" && (
        <section className="max-w-2xl" aria-labelledby="capture-heading">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-accent-bright)]">04 · Take action</p>
          <h2 id="capture-heading" className="mt-3 text-3xl font-semibold tracking-tight text-[var(--color-text-primary)]">Want this investigated for your business?</h2>
          <p className="mt-4 text-sm leading-relaxed text-[var(--color-text-secondary)]">Share your details and the ELION team can review your context. This uses the existing request workflow; it does not start an automation or send a message on your behalf.</p>
          <form onSubmit={submitLead} className="mt-8 space-y-5 border-y border-[var(--color-border)]/60 py-7">
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block"><span className="mb-2 block text-xs font-medium text-[var(--color-text-secondary)]">Your name</span><input id="demo-name" required maxLength={100} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="w-full border-b border-[var(--color-border-light)] bg-transparent px-0 py-3 text-sm text-[var(--color-text-primary)] outline-none transition-colors focus:border-[var(--color-accent)]" placeholder="Your name" /></label>
              <label className="block"><span className="mb-2 block text-xs font-medium text-[var(--color-text-secondary)]">Business email</span><input id="demo-email" required type="email" maxLength={200} value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="w-full border-b border-[var(--color-border-light)] bg-transparent px-0 py-3 text-sm text-[var(--color-text-primary)] outline-none transition-colors focus:border-[var(--color-accent)]" placeholder="you@business.com" /></label>
            </div>
            <label className="block"><span className="mb-2 block text-xs font-medium text-[var(--color-text-secondary)]">Company</span><input id="demo-company" required maxLength={200} value={form.companyName} onChange={(event) => setForm({ ...form, companyName: event.target.value })} className="w-full border-b border-[var(--color-border-light)] bg-transparent px-0 py-3 text-sm text-[var(--color-text-primary)] outline-none transition-colors focus:border-[var(--color-accent)]" placeholder="Your company" /></label>
            <label className="block"><span className="mb-2 block text-xs font-medium text-[var(--color-text-secondary)]">Biggest challenge <span className="font-normal text-[var(--color-text-muted)]">(optional)</span></span><textarea id="demo-challenge" rows={3} maxLength={500} value={form.challenge} onChange={(event) => setForm({ ...form, challenge: event.target.value })} className="w-full resize-none border-b border-[var(--color-border-light)] bg-transparent px-0 py-3 text-sm text-[var(--color-text-primary)] outline-none transition-colors focus:border-[var(--color-accent)]" placeholder={selectedProblem || scenario.problem} /></label>
            {error && <p role="alert" className="border-l-2 border-[var(--color-error)] pl-3 text-sm text-[var(--color-error)]">{error}</p>}
            <button type="submit" disabled={submitting} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-accent)] px-5 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-accent-hover)] disabled:cursor-not-allowed disabled:opacity-50">{submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}{submitting ? "Sending request..." : "Ask ELION to review my business"}</button>
            <p className="text-center text-[11px] text-[var(--color-text-muted)]">No commitment. We review your information before recommending anything.</p>
          </form>
        </section>
      )}

      {scenario && stage === "complete" && (
        <section className="max-w-2xl border-l-2 border-[var(--color-success)] pl-6" aria-live="polite"><CheckCircle2 className="h-8 w-8 text-[var(--color-success)]" /><h2 className="mt-5 text-3xl font-semibold tracking-tight text-[var(--color-text-primary)]">Request received.</h2><p className="mt-4 max-w-md text-sm leading-relaxed text-[var(--color-text-secondary)]">The ELION team can now review your business context and follow up. The simulation is complete; no real customer interaction was triggered.</p><div className="mt-7 flex flex-wrap gap-3"><a href={ctaHref} className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-white hover:bg-[var(--color-accent-hover)]">Run the full business audit <ArrowRight className="h-4 w-4" /></a><button type="button" onClick={reset} className="rounded-xl border border-[var(--color-border)] px-5 py-3 text-sm font-medium text-[var(--color-text-secondary)] hover:text-white">Try another scenario</button></div></section>
      )}
    </div>
  );
}
