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
type Stage = "choose" | "conversation" | "finding" | "capture" | "complete";

const INDUSTRIES = Object.keys(SCENARIOS) as Industry[];

export default function DemoExperience({ ctaHref = "/audit" }: { ctaHref?: string }) {
  const [industry, setIndustry] = useState<Industry | null>(null);
  const [stage, setStage] = useState<Stage>("choose");
  const [form, setForm] = useState({ name: "", email: "", companyName: "", challenge: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const scenario = useMemo(() => (industry ? SCENARIOS[industry] : null), [industry]);

  const selectIndustry = (value: Industry) => {
    setIndustry(value);
    setStage("conversation");
    setError("");
  };

  const reset = () => {
    setIndustry(null);
    setStage("choose");
    setForm({ name: "", email: "", companyName: "", challenge: "" });
    setError("");
  };

  const submitLead = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!industry) return;
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
          primaryProblem: form.challenge.trim() || scenario?.problem,
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
    <div>
      <div className="mb-8 rounded-2xl border border-[var(--color-accent)]/25 bg-[var(--color-accent)]/[0.06] p-5 md:p-6">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-accent-bright)]" />
          <div>
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">Interactive simulation</p>
            <p className="mt-1 text-sm leading-relaxed text-[var(--color-text-secondary)]">Choose a business context and see how a configured ELION system could handle one example enquiry. This is sample content: no messages are sent and no customer result is being claimed.</p>
          </div>
        </div>
      </div>

      <div className="mb-10 max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-accent-bright)]">See the diagnosis</p>
        <h1 className="mt-4 text-4xl font-bold tracking-[-0.03em] text-[var(--color-text-primary)] md:text-6xl">What happens when a customer does not have to wait?</h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-[var(--color-text-secondary)] md:text-lg">Experience the path from customer message to operational finding, recommended system, and human handoff.</p>
      </div>

      <div className="mb-8 flex items-center justify-between gap-4 border-b border-[var(--color-border)]/60 pb-4">
        <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-text-muted)]">
          {["Choose context", "See conversation", "Find the leak", "Get a recommendation"].map((label, index) => (
            <span key={label} className={"inline-flex items-center gap-2 " + ((stage !== "choose" && index === 0) || (stage === "finding" && index <= 2) || (stage === "capture" && index <= 3) || stage === "complete" ? "text-[var(--color-text-primary)]" : "") }>
              <span className="flex h-5 w-5 items-center justify-center rounded-full border border-[var(--color-border)] text-[10px]">{index + 1}</span>
              <span className="hidden sm:inline">{label}</span>
              {index < 3 && <span className="hidden text-[var(--color-border-light)] sm:inline">/</span>}
            </span>
          ))}
        </div>
        {stage !== "choose" && <button type="button" onClick={reset} className="inline-flex shrink-0 items-center gap-1.5 text-xs font-medium text-[var(--color-text-muted)] hover:text-white"><RotateCcw className="h-3.5 w-3.5" /> Reset</button>}
      </div>

      {stage === "choose" && (
        <section aria-labelledby="industry-heading">
          <h2 id="industry-heading" className="text-xl font-semibold text-[var(--color-text-primary)]">Which business should we simulate?</h2>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">The scenario changes with your industry. The operating principle stays the same: understand the leak before recommending the fix.</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {INDUSTRIES.map((value) => <button key={value} type="button" onClick={() => selectIndustry(value)} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-5 text-left text-sm font-semibold text-[var(--color-text-primary)] transition-colors hover:border-[var(--color-accent)]/50 hover:bg-[var(--color-accent)]/[0.06]">{value}<span className="mt-2 block text-xs font-normal text-[var(--color-text-muted)]">Try this scenario <ArrowRight className="ml-1 inline h-3 w-3" /></span></button>)}
          </div>
        </section>
      )}

      {scenario && stage === "conversation" && (
        <section aria-labelledby="conversation-heading" className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
          <div className="rounded-2xl border border-[var(--color-border)]/60 bg-[var(--color-surface-raised)] p-6 md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-accent-bright)]">{industry} · Sample conversation</p>
            <h2 id="conversation-heading" className="mt-3 text-2xl font-bold text-[var(--color-text-primary)]">A customer sends a message.</h2>
            <div className="mt-8 space-y-4">
              <div className="max-w-[90%] rounded-2xl rounded-bl-sm border border-[var(--color-border)] bg-[var(--color-surface)] p-4"><p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Customer · illustrative</p><p className="mt-2 text-sm leading-relaxed text-[var(--color-text-primary)]">{scenario.customer}</p></div>
              <div className="ml-auto max-w-[90%] rounded-2xl rounded-br-sm border border-[var(--color-accent)]/25 bg-[var(--color-accent)]/[0.08] p-4"><p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-accent-bright)]">ELION system · simulated</p><p className="mt-2 text-sm leading-relaxed text-[var(--color-text-primary)]">{scenario.response}</p></div>
            </div>
            <button type="button" onClick={() => setStage("finding")} className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-accent-hover)]">Show the operational finding <ArrowRight className="h-4 w-4" /></button>
          </div>
          <div className="rounded-2xl border border-[var(--color-border)]/60 p-6 md:p-8"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">What this demonstrates</p><ul className="mt-5 space-y-4">{scenario.workflow.map((step, index) => <li key={step} className="flex items-center gap-3 text-sm text-[var(--color-text-secondary)]"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[var(--color-accent)]/25 bg-[var(--color-accent)]/[0.06] text-xs font-bold text-[var(--color-accent-bright)]">{index + 1}</span>{step}</li>)}</ul></div>
        </section>
      )}

      {scenario && stage === "finding" && (
        <section className="space-y-6" aria-labelledby="finding-heading">
          <div className="rounded-2xl border border-[var(--color-warning)]/25 bg-[var(--color-warning)]/[0.05] p-6 md:p-8"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-warning)]">Operational leak · illustrative</p><h2 id="finding-heading" className="mt-3 text-2xl font-bold text-[var(--color-text-primary)]">{scenario.problem}</h2><p className="mt-4 max-w-3xl text-sm leading-relaxed text-[var(--color-text-secondary)]">{scenario.leak}</p></div>
          <div className="grid gap-6 md:grid-cols-2"><div className="rounded-2xl border border-[var(--color-border)]/60 bg-[var(--color-surface-raised)] p-6"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">Recommended system</p><h3 className="mt-3 text-xl font-bold text-[var(--color-accent-bright)]">{scenario.system}</h3><p className="mt-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">A scoped recommendation based on this example problem. A real recommendation would follow an audit of the business and its available evidence.</p></div><div className="rounded-2xl border border-[var(--color-border)]/60 bg-[var(--color-surface-raised)] p-6"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">The handoff</p><div className="mt-4 flex flex-wrap items-center gap-2">{scenario.workflow.map((step, index) => <span key={step} className="inline-flex items-center gap-2 text-xs text-[var(--color-text-secondary)]"><span className="rounded-md border border-[var(--color-border)] px-2 py-1">{step}</span>{index < scenario.workflow.length - 1 && <ArrowRight className="h-3 w-3 text-[var(--color-text-muted)]" />}</span>)}</div></div></div>
          <button type="button" onClick={() => setStage("capture")} className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-accent-hover)]">See how this could fit your business <ArrowRight className="h-4 w-4" /></button>
        </section>
      )}

      {scenario && stage === "capture" && (
        <section className="max-w-2xl" aria-labelledby="capture-heading">
          <div className="mb-6"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-accent-bright)]">Continue the conversation</p><h2 id="capture-heading" className="mt-3 text-2xl font-bold text-[var(--color-text-primary)]">Want this investigated for your business?</h2><p className="mt-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">Share your details and the ELION team can review your context. This sends a request to the existing ELION lead workflow; it does not start an automation or send a message on your behalf.</p></div>
          <form onSubmit={submitLead} className="space-y-4 rounded-2xl border border-[var(--color-border)]/60 bg-[var(--color-surface-raised)] p-6 md:p-8">
            <label className="block"><span className="mb-1.5 block text-xs font-medium text-[var(--color-text-secondary)]">Your name</span><input required maxLength={100} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-3 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)]" placeholder="Your name" /></label>
            <label className="block"><span className="mb-1.5 block text-xs font-medium text-[var(--color-text-secondary)]">Business email</span><input required type="email" maxLength={200} value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-3 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)]" placeholder="you@business.com" /></label>
            <label className="block"><span className="mb-1.5 block text-xs font-medium text-[var(--color-text-secondary)]">Company</span><input required maxLength={200} value={form.companyName} onChange={(event) => setForm({ ...form, companyName: event.target.value })} className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-3 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)]" placeholder="Your company" /></label>
            <label className="block"><span className="mb-1.5 block text-xs font-medium text-[var(--color-text-secondary)]">What is the biggest challenge right now? <span className="font-normal text-[var(--color-text-muted)]">(optional)</span></span><textarea rows={3} maxLength={500} value={form.challenge} onChange={(event) => setForm({ ...form, challenge: event.target.value })} className="w-full resize-none rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-3 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)]" placeholder={scenario.problem} /></label>
            {error && <p role="alert" className="rounded-lg border border-[var(--color-error)]/25 bg-[var(--color-error)]/10 p-3 text-sm text-[var(--color-error)]">{error}</p>}
            <button type="submit" disabled={submitting} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-accent)] px-5 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-accent-hover)] disabled:cursor-not-allowed disabled:opacity-50">{submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}{submitting ? "Sending request..." : "Ask ELION to review my business"}</button>
            <p className="text-center text-[11px] text-[var(--color-text-muted)]">No commitment. We review your information before recommending anything.</p>
          </form>
        </section>
      )}

      {scenario && stage === "complete" && (
        <section className="max-w-2xl rounded-2xl border border-[var(--color-success)]/25 bg-[var(--color-success)]/[0.06] p-7 text-center md:p-10" aria-live="polite"><CheckCircle2 className="mx-auto h-10 w-10 text-[var(--color-success)]" /><h2 className="mt-4 text-2xl font-bold text-[var(--color-text-primary)]">Request received</h2><p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[var(--color-text-secondary)]">The ELION team can now review your business context and follow up. The simulation is complete; no real customer interaction was triggered.</p><div className="mt-6 flex flex-wrap justify-center gap-3"><a href={ctaHref} className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-white hover:bg-[var(--color-accent-hover)]">Run the full business audit <ArrowRight className="h-4 w-4" /></a><button type="button" onClick={reset} className="rounded-xl border border-[var(--color-border)] px-5 py-3 text-sm font-medium text-[var(--color-text-secondary)] hover:text-white">Try another scenario</button></div></section>
      )}
    </div>
  );
}
