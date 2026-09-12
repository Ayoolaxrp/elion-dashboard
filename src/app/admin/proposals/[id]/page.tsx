"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CheckCircle, Loader2, Save, XCircle } from "lucide-react";
import { AdminSidebar } from "@/components/admin/sidebar";

type Item = { id?: string; automation_name?: string; description?: string; status?: string; setup_price?: number | null };
type Proposal = {
  id: string; title: string; company_name: string | null; client_name: string | null; client_email: string | null;
  summary: string | null; items: Item[]; total_setup: number; total_monthly: number; implementation_timeline: string | null;
  support_plan: string | null; status: string; valid_until: string | null; created_at: string;
  currency?: string | null; document_data?: Record<string, unknown> | null;
};

type ProposalForm = {
  title: string; company_name: string; client_name: string; client_email: string; summary: string;
  business_challenge: string; recommended_solution: string; solution_scope: string; deliverables: string;
  technical_requirements: string; support_plan: string; next_steps: string; currency: string;
  total_setup: string; total_monthly: string; valid_until: string; country: string; address: string;
  timezone: string; contact_role: string; timeline: string; delivery_date: string; payment_terms: string;
  assumptions: string; acceptance_name: string; phases: string;
};

const CURRENCIES = ["NGN", "USD", "GBP", "EUR"];
const DEFAULT_TERMS = "50% upfront\n50% after delivery\nMonthly care billed separately";
const DEFAULT_PHASES = "Discovery\nBuild\nTesting\nDeployment\nHandover";
const inputClass = "mt-2 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] outline-none focus:border-[var(--color-accent)]";

function ProposalPreview({ proposal, form }: { proposal: Proposal; form: ProposalForm }) {
  return <article className="proposal-preview space-y-10 py-8 text-[var(--color-text-primary)]">
    <header className="border-b border-[var(--color-border)] pb-8">
      <p className="workspace-kicker">ELION · Implementation proposal</p>
      <h2 className="mt-4 text-4xl font-semibold tracking-[-0.05em]">{form.title || proposal.title}</h2>
      <p className="mt-3 text-base text-[var(--color-text-secondary)]">Prepared for {form.company_name || "the client"}{form.client_name ? ` · ${form.client_name}` : ""}</p>
      <p className="mt-2 text-xs text-[var(--color-text-muted)]">{form.country} · {form.timezone} · Valid until {form.valid_until || "to be confirmed"}</p>
    </header>
    <section><p className="workspace-kicker">Executive summary</p><p className="mt-3 max-w-3xl whitespace-pre-wrap text-base leading-relaxed text-[var(--color-text-secondary)]">{form.summary || "Summary to be confirmed from the audit and discovery conversation."}</p></section>
    <section><p className="workspace-kicker">Business diagnosis</p><p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[var(--color-text-secondary)]">{form.business_challenge || "The business challenge will be confirmed with the client."}</p><div className="mt-5 space-y-4">{(proposal.items || []).map((item, index) => <div key={item.id || index} className="border-t border-[var(--color-border)] pt-4"><p className="font-semibold">{item.automation_name || "Audit finding"}</p><p className="mt-1 text-sm leading-relaxed text-[var(--color-text-secondary)]">{item.description || "No further detail recorded."}</p></div>)}</div></section>
    <section><p className="workspace-kicker">Recommended ELION solution</p><p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[var(--color-text-secondary)]">{form.recommended_solution || "Solution recommendation to be confirmed during scope review."}</p><p className="mt-4 text-sm leading-relaxed"><strong>Scope:</strong> {form.solution_scope || "Confirm workflow scope, integrations, testing, deployment and handover."}</p><p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed"><strong>Deliverables:</strong> {form.deliverables || "Implementation documentation and ownership handover."}</p></section>
    <section><p className="workspace-kicker">Implementation plan</p><div className="mt-4 space-y-3">{form.phases.split("\n").filter(Boolean).map((phase, index) => <div key={`${phase}-${index}`} className="flex gap-4 border-t border-[var(--color-border)] pt-3"><span className="text-xs font-semibold text-[var(--color-text-muted)]">{String(index + 1).padStart(2, "0")}</span><span className="text-sm">{phase}</span></div>)}</div><p className="mt-5 text-sm text-[var(--color-text-secondary)]">Estimated duration: {form.timeline || "To be confirmed"}</p></section>
    <section className="border-t-2 border-[var(--color-text-primary)] pt-6"><p className="workspace-kicker">Investment</p><p className="mt-3 text-3xl font-semibold">{form.currency} {Number(form.total_setup || 0).toLocaleString()}</p>{Number(form.total_monthly || 0) > 0 && <p className="mt-1 text-sm text-[var(--color-text-secondary)]">+ {form.currency} {Number(form.total_monthly).toLocaleString()} monthly care</p>}<p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-[var(--color-text-secondary)]">{form.payment_terms}</p></section>
    <section className="grid gap-10 border-t border-[var(--color-border)] pt-6 sm:grid-cols-2"><div><p className="workspace-kicker">Acceptance</p><p className="mt-4 text-sm">Client / signatory: {form.acceptance_name || "____________________________"}</p><p className="mt-6 text-sm">Signature: ____________________________</p><p className="mt-6 text-sm">Date: _________________________________</p></div><div><p className="workspace-kicker">Next steps</p><p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-[var(--color-text-secondary)]">{form.next_steps || "Confirm scope, approve this proposal, and schedule implementation kickoff."}</p></div></section>
  </article>;
}

function Field({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string }) {
  return <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">{label}<input type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className={inputClass} /></label>;
}
function Area({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">{label}<textarea rows={4} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className={`${inputClass} resize-y`} /></label>;
}
function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="border-y border-[var(--color-border)]/70 py-6"><p className="workspace-kicker">{title}</p><div className="mt-4 space-y-4">{children}</div></section>;
}

export default function ProposalDetailPage() {
  const params = useParams<{ id: string }>();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [form, setForm] = useState<ProposalForm>({ title: "", company_name: "", client_name: "", client_email: "", summary: "", business_challenge: "", recommended_solution: "", solution_scope: "", deliverables: "", technical_requirements: "", support_plan: "", next_steps: "", currency: "NGN", total_setup: "", total_monthly: "", valid_until: "", country: "Nigeria", address: "", timezone: "Africa/Lagos", contact_role: "", timeline: "", delivery_date: "", payment_terms: DEFAULT_TERMS, assumptions: "", acceptance_name: "", phases: DEFAULT_PHASES });
  const [preview, setPreview] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/admin/proposals").then(async (response) => { const body = await response.json(); if (!response.ok) throw new Error(body.error || "Could not load proposal"); return body.proposals as Proposal[]; }).then((rows) => {
      const found = rows.find((row) => row.id === params.id); if (!found) throw new Error("Proposal not found");
      const doc = found.document_data || {};
      const phases = Array.isArray(doc.implementation_phases) ? doc.implementation_phases.map((item) => typeof item === "object" && item && "title" in item ? String(item.title) : "").filter(Boolean).join("\n") : DEFAULT_PHASES;
      setProposal(found);
      setDirty(false);
      setForm({ title: found.title || "", company_name: found.company_name || "", client_name: found.client_name || "", client_email: found.client_email || "", summary: found.summary || String(doc.executive_summary || ""), business_challenge: String(doc.business_challenge || ""), recommended_solution: String(doc.recommended_solution || ""), solution_scope: String(doc.solution_scope || ""), deliverables: String(doc.deliverables || ""), technical_requirements: String(doc.technical_requirements || ""), support_plan: found.support_plan || String(doc.support_plan || ""), next_steps: String(doc.next_steps || ""), currency: found.currency || "NGN", total_setup: String(found.total_setup || ""), total_monthly: String(found.total_monthly || ""), valid_until: found.valid_until ? found.valid_until.slice(0, 10) : "", country: String(doc.country || "Nigeria"), address: String(doc.address || ""), timezone: String(doc.timezone || "Africa/Lagos"), contact_role: String(doc.contact_role || ""), timeline: String(doc.estimated_duration || found.implementation_timeline || ""), delivery_date: String(doc.delivery_date || ""), payment_terms: String(doc.payment_terms || DEFAULT_TERMS), assumptions: String(doc.assumptions || ""), acceptance_name: String(doc.acceptance_name || ""), phases });
    }).catch((error) => setMessage(error instanceof Error ? error.message : "Could not load proposal")).finally(() => setLoading(false));
  }, [params.id]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const update = (key: keyof ProposalForm, value: string) => { setDirty(true); setForm((current) => ({ ...current, [key]: value })); };
  async function updateStatus(status: string) {
    if (!proposal) return;
    setStatusBusy(true); setMessage("");
    try {
      let overrideReason: string | undefined;
      if (status === "accepted") {
        overrideReason = window.prompt("If margin guardrails require an override, enter the reason. Otherwise cancel to stop:") || undefined;
      }
      const response = await fetch("/api/admin/proposals", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: proposal.id, status, founder_override_reason: overrideReason }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Could not update proposal status");
      setProposal(body.proposal); setMessage(`Proposal marked ${status}`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not update proposal status"); }
    finally { setStatusBusy(false); }
  }

  async function save() {
    if (!proposal) return;
    setSaving(true); setMessage("");
    const document_data = { country: form.country, address: form.address, timezone: form.timezone, contact_role: form.contact_role, executive_summary: form.summary, business_challenge: form.business_challenge, recommended_solution: form.recommended_solution, solution_scope: form.solution_scope, deliverables: form.deliverables, technical_requirements: form.technical_requirements, support_plan: form.support_plan, next_steps: form.next_steps, implementation_phases: form.phases.split("\n").map((title, index) => ({ number: index + 1, title: title.trim(), description: "" })).filter((phase) => phase.title), estimated_duration: form.timeline, delivery_date: form.delivery_date, payment_terms: form.payment_terms, assumptions: form.assumptions, acceptance_name: form.acceptance_name };
    try {
      const response = await fetch("/api/admin/proposals", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: proposal.id, title: form.title, company_name: form.company_name, client_name: form.client_name, client_email: form.client_email, summary: form.summary, support_plan: form.support_plan, currency: form.currency, total_setup: Number(form.total_setup) || 0, total_monthly: Number(form.total_monthly) || 0, valid_until: form.valid_until || null, implementation_timeline: form.timeline, document_data }) });
      const body = await response.json(); if (!response.ok) throw new Error(body.error || "Could not save proposal"); setProposal(body.proposal); setDirty(false); setMessage("Draft saved");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not save proposal"); } finally { setSaving(false); }
  }

  if (loading) return <Shell><Loading /></Shell>;
  if (!proposal) return <Shell><div className="border-y border-[var(--color-border)]/70 py-16"><h1 className="text-xl font-semibold text-[var(--color-text-primary)]">Proposal unavailable</h1><p className="mt-2 text-sm text-[var(--color-error)]">{message || "Proposal not found."}</p></div></Shell>;
  return <Shell><Link href="/admin/proposals" className="inline-flex items-center gap-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"><ArrowLeft className="h-4 w-4" /> Back to proposals</Link><header className="mt-8 flex flex-wrap items-end justify-between gap-4 border-b border-[var(--color-border)]/70 pb-7"><div><p className="workspace-kicker">Proposal review</p><h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[var(--color-text-primary)]">{proposal.title}</h1><p className="mt-2 text-sm text-[var(--color-text-secondary)]">{proposal.company_name || "Company not recorded"} · {proposal.status}{dirty ? " · Unsaved changes" : ""}</p></div>      <div className="flex flex-wrap gap-2"><button type="button" onClick={() => void save()} disabled={saving || !dirty} className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-accent)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"><Save className="h-4 w-4" />{saving ? "Saving…" : dirty ? "Save draft" : "Saved"}</button><button type="button" onClick={() => setPreview((value) => !value)} className="rounded-lg border border-[var(--color-border)] px-4 py-2.5 text-sm font-semibold text-[var(--color-text-secondary)]">{preview ? "Edit proposal" : "Preview"}</button><button type="button" onClick={() => window.print()} className="rounded-lg border border-[var(--color-border)] px-4 py-2.5 text-sm font-semibold text-[var(--color-text-secondary)]">Print</button>{proposal.status === "draft" && <button type="button" onClick={() => void updateStatus("sent")} disabled={statusBusy || dirty} className="rounded-lg border border-[var(--color-accent)]/40 px-4 py-2.5 text-sm font-semibold text-[var(--color-accent-bright)] disabled:opacity-50">Send for review</button>}{["sent", "viewed"].includes(proposal.status) && <button type="button" onClick={() => void updateStatus("accepted")} disabled={statusBusy || dirty} className="rounded-lg border border-emerald-500/40 px-4 py-2.5 text-sm font-semibold text-emerald-400 disabled:opacity-50">Mark accepted</button>}</div></header>{message && <p role="status" className="mt-4 border-l-2 border-[var(--color-accent)] pl-3 text-sm text-[var(--color-text-secondary)]">{message}</p>}{preview ? <ProposalPreview proposal={proposal} form={form} /> : <><div className="mt-8 grid gap-10 lg:grid-cols-[1fr_0.8fr]"><div className="space-y-8"><Group title="Client details"><div className="grid gap-4 sm:grid-cols-2"><Field label="Proposal title" value={form.title} onChange={(v) => update("title", v)} /><Field label="Company" value={form.company_name} onChange={(v) => update("company_name", v)} /><Field label="Client name" value={form.client_name} onChange={(v) => update("client_name", v)} /><Field label="Email" value={form.client_email} onChange={(v) => update("client_email", v)} /><Field label="Country" value={form.country} onChange={(v) => update("country", v)} /><Field label="Timezone" value={form.timezone} onChange={(v) => update("timezone", v)} /><Field label="Contact role" value={form.contact_role} onChange={(v) => update("contact_role", v)} /></div><Field label="Address" value={form.address} onChange={(v) => update("address", v)} /></Group><Group title="Executive summary"><Area label="What was found and what this proposal addresses" value={form.summary} onChange={(v) => update("summary", v)} /><Area label="Business challenge" value={form.business_challenge} onChange={(v) => update("business_challenge", v)} /></Group><Group title="Recommended solution"><Area label="System recommendation" value={form.recommended_solution} onChange={(v) => update("recommended_solution", v)} /><Area label="Scope of implementation" value={form.solution_scope} onChange={(v) => update("solution_scope", v)} /><Area label="Deliverables" value={form.deliverables} onChange={(v) => update("deliverables", v)} /><Area label="Technical requirements" value={form.technical_requirements} onChange={(v) => update("technical_requirements", v)} /></Group><Group title="Implementation plan"><Area label="Phases, one per line" value={form.phases} onChange={(v) => update("phases", v)} /><Area label="Support and maintenance" value={form.support_plan} onChange={(v) => update("support_plan", v)} /><Area label="Assumptions and exclusions" value={form.assumptions} onChange={(v) => update("assumptions", v)} /><Area label="Next steps" value={form.next_steps} onChange={(v) => update("next_steps", v)} /></Group></div><aside className="space-y-8"><Group title="Investment"><div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1"><label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Currency<select value={form.currency} onChange={(e) => update("currency", e.target.value)} className={inputClass}>{CURRENCIES.map((currency) => <option key={currency}>{currency}</option>)}</select></label><Field label="Implementation" type="number" value={form.total_setup} onChange={(v) => update("total_setup", v)} /><Field label="Monthly care" type="number" value={form.total_monthly} onChange={(v) => update("total_monthly", v)} /></div><p className="mt-4 text-xs text-[var(--color-text-muted)]">{form.currency} {Number(form.total_setup || 0).toLocaleString()} {Number(form.total_monthly || 0) ? `+ ${form.currency} ${Number(form.total_monthly).toLocaleString()}/mo` : ""}</p></Group><Group title="Delivery"><Field label="Estimated duration" value={form.timeline} onChange={(v) => update("timeline", v)} /><Field label="Delivery date" type="date" value={form.delivery_date} onChange={(v) => update("delivery_date", v)} /><Field label="Valid until" type="date" value={form.valid_until} onChange={(v) => update("valid_until", v)} /><Area label="Payment terms" value={form.payment_terms} onChange={(v) => update("payment_terms", v)} /></Group><Group title="Acceptance"><Field label="Client name / signatory" value={form.acceptance_name} onChange={(v) => update("acceptance_name", v)} /><p className="border-t border-dashed border-[var(--color-border)] pt-4 text-xs text-[var(--color-text-muted)]">Signature placeholder · Date to be completed by client</p></Group></aside></div><section className="mt-10 border-t border-[var(--color-border)]/70 pt-8"><p className="workspace-kicker">Evidence</p><h2 className="mt-2 text-xl font-semibold text-[var(--color-text-primary)]">Audit findings carried into this proposal</h2><div className="mt-4 divide-y divide-[var(--color-border)]/70">{(proposal.items || []).length ? proposal.items.map((item, index) => <div key={item.id || index} className="flex items-start gap-3 py-4">{item.status === "not_included" ? <XCircle className="mt-0.5 h-4 w-4 text-[var(--color-text-muted)]" /> : <CheckCircle className="mt-0.5 h-4 w-4 text-[var(--color-success)]" />}<div><p className="text-sm font-semibold text-[var(--color-text-primary)]">{item.automation_name || "Operational finding"}</p><p className="mt-1 text-sm text-[var(--color-text-secondary)]">{item.description || "No detail recorded."}</p></div></div>) : <p className="py-6 text-sm text-[var(--color-text-muted)]">No audit findings were copied into this proposal.</p>}</div></section></>}</Shell>;

}
function Shell({ children }: { children: React.ReactNode }) { return <div className="workspace-shell"><AdminSidebar /><main className="min-w-0 flex-1 p-5 md:p-8"><div className="mx-auto max-w-5xl">{children}</div></main></div>; }
function Loading() { return <div className="flex items-center gap-2 py-20 text-sm text-[var(--color-text-muted)]"><Loader2 className="h-4 w-4 animate-spin" /> Loading proposal…</div>; }
