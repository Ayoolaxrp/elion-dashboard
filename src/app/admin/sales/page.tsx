"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AdminSidebar } from "@/components/admin/sidebar";
import { ArrowRight, Check, Clipboard, ExternalLink, Loader2, Mail, RefreshCw, Search, Sparkles } from "lucide-react";

type Lead = {
  id: string;
  contact_name: string;
  email: string;
  phone: string | null;
  company_name: string | null;
  website: string | null;
  industry: string | null;
  primary_problem: string | null;
  lead_status: string;
  audit_status: string | null;
  source: string | null;
  created_at: string;
  updated_at?: string | null;
  archived_at?: string | null;
  sales?: {
    audit_status: string;
    opportunity: string;
    recommended_solution: string | null;
    main_finding: string | null;
    audit_date: string | null;
    last_activity: string | null;
    contact_status: string;
    conversation_status: string;
    proposal_status: string;
    customer_status: string;
  };
};

type View = "today" | "all" | "recent";

const STATUSES = ["new", "audited", "contacted", "qualified", "proposal", "paid", "lost"];
const STATUS_LABELS: Record<string, string> = {
  new: "New",
  audited: "Audited",
  contacted: "Contacted",
  qualified: "Qualified",
  proposal: "Proposal sent",
  paid: "Won",
  lost: "Lost",
};

function daysSince(iso: string | null | undefined) {
  if (!iso) return 999;
  return Math.max(0, Math.floor((Date.now() - Date.parse(iso)) / 86_400_000));
}

function relativeDate(iso: string | null | undefined) {
  if (!iso) return "No activity recorded";
  const days = daysSince(iso);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

function openingMessage(lead: Lead) {
  const company = lead.company_name || "your business";
  const finding = lead.sales?.main_finding || lead.primary_problem;
  const solution = lead.sales?.recommended_solution;
  if (finding && solution) {
    return `Hi ${lead.contact_name || "there"}, I was reviewing ${company} and noticed a possible gap around ${finding.toLowerCase()}. ELION helps businesses address these operational gaps with systems such as ${solution}. Would you be open to a short conversation about what is happening in your current process?`;
  }
  if (finding) {
    return `Hi ${lead.contact_name || "there"}, I was reviewing ${company} and noticed a possible gap around ${finding.toLowerCase()}. I thought it may be useful to compare notes on how enquiries and follow-up currently work in your business. Would you be open to a short conversation?`;
  }
  return `Hi ${lead.contact_name || "there"}, I was reviewing ${company} and thought there may be an opportunity to improve how enquiries and follow-up are handled. Would you be open to a short conversation about your current process?`;
}

function priorityFor(lead: Lead) {
  const reasons: string[] = [];
  let score = 0;
  const status = lead.lead_status.toLowerCase();
  const auditStatus = (lead.sales?.audit_status || lead.audit_status || "").toLowerCase();
  if (auditStatus === "completed" || lead.sales?.audit_date) { score += 4; reasons.push("audit completed"); }
  if (lead.source === "interactive_demo") { score += 4; reasons.push("completed interactive demo"); }
  if (lead.sales?.recommended_solution) { score += 3; reasons.push("solution opportunity identified"); }
  if (lead.sales?.main_finding || lead.primary_problem) { score += 2; reasons.push("clear operational problem"); }
  if (["new", "audited", "contacted", "qualified", "proposal"].includes(status)) score += 1;
  if (daysSince(lead.sales?.last_activity || lead.updated_at || lead.created_at) <= 2) { score += 2; reasons.push("recent activity"); }
  if (daysSince(lead.sales?.last_activity || lead.updated_at || lead.created_at) > 14) reasons.push("needs reactivation");
  if (!reasons.length) reasons.push("needs initial review");
  return { score, reasons };
}

function salesStage(lead: Lead) {
  const status = lead.lead_status.toLowerCase();
  if (status === "paid") return "Won";
  if (status === "lost") return "Lost";
  if (status === "proposal") return "Proposal sent";
  if (lead.sales?.conversation_status === "started") return "Conversation started";
  if (["contacted", "qualified"].includes(status)) return "Contacted";
  if (lead.sales?.audit_date || status === "audited") return "Ready to contact";
  return status === "new" ? "New" : "Reviewing";
}

function nextAction(lead: Lead) {
  const status = lead.lead_status.toLowerCase();
  if (status === "proposal") return "Follow up on proposal";
  if (status === "qualified") return "Scope proposal";
  if (status === "contacted") return "Continue conversation";
  if (status === "paid") return "Begin onboarding";
  if (status === "lost") return "Record loss reason";
  if (!lead.sales?.audit_date) return "Review or run audit";
  return "Send approved opening";
}

function PriorityBadge({ score }: { score: number }) {
  const label = score >= 9 ? "High priority" : score >= 5 ? "Worth reviewing" : "Needs review";
  const cls = score >= 9 ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : score >= 5 ? "border-amber-500/30 bg-amber-500/10 text-amber-400" : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)]";
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${cls}`}><span className="tabular-nums">{score}</span> {label}</span>;
}

function QueueCard({ lead, onStatusChange }: { lead: Lead; onStatusChange: (id: string, status: string) => Promise<void> }) {
  const [copied, setCopied] = useState(false);
  const priority = priorityFor(lead);
  const message = openingMessage(lead);
  const website = lead.website ? (lead.website.startsWith("http") ? lead.website : `https://${lead.website}`) : null;

  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch { /* Clipboard may be unavailable in some browsers. */ }
  };

  return (
    <article className="border-b border-[var(--color-border)]/70 py-7 first:pt-1 last:border-0">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <PriorityBadge score={priority.score} />
            <span className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">{relativeDate(lead.sales?.last_activity || lead.updated_at || lead.created_at)}</span>
          </div>
          <h3 className="mt-3 text-xl font-semibold tracking-tight text-[var(--color-text-primary)]">{lead.company_name || "Unnamed business"}</h3>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{lead.contact_name || "Contact not recorded"} · {lead.industry || "Industry not recorded"}</p>
          <p className="mt-2 text-xs font-medium text-[var(--color-accent-bright)]">Sales stage: {salesStage(lead)}</p>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-[var(--color-text-muted)]">
            {website ? <a href={website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[var(--color-accent-bright)] hover:underline">{lead.website} <ExternalLink className="h-3 w-3" /></a> : <span>Website not recorded</span>}
            {lead.email && <a href={`mailto:${lead.email}`} className="inline-flex items-center gap-1 hover:text-[var(--color-text-primary)]"><Mail className="h-3 w-3" /> {lead.email}</a>}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <label className="sr-only" htmlFor={`status-${lead.id}`}>Sales status for {lead.company_name || lead.contact_name}</label>
          <select id={`status-${lead.id}`} value={lead.lead_status} onChange={(event) => void onStatusChange(lead.id, event.target.value)} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 py-2 text-xs font-medium text-[var(--color-text-primary)]">
            {STATUSES.map((status) => <option key={status} value={status}>{STATUS_LABELS[status]}</option>)}
          </select>
        </div>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-[1fr_0.9fr]">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">Why this lead is here</p>
          <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">{priority.reasons.join(" · ")}</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">Audit</p><p className="mt-1 text-sm text-[var(--color-text-primary)]">{lead.sales?.audit_status || lead.audit_status || "Not recorded"}</p></div>
            <div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">Source</p><p className="mt-1 text-sm text-[var(--color-text-primary)]">{lead.source || "Direct"}</p></div>
            <div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">Main finding</p><p className="mt-1 text-sm leading-relaxed text-[var(--color-text-primary)]">{lead.sales?.main_finding || lead.primary_problem || "No finding recorded yet"}</p></div>
            <div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">Recommended system</p><p className="mt-1 text-sm leading-relaxed text-[var(--color-accent-bright)]">{lead.sales?.recommended_solution || "Confirm after review"}</p></div>
          </div>
        </div>
        <div className="border-l-2 border-[var(--color-accent)]/60 pl-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">Suggested opening · review before sending</p>
          <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-primary)]">{message}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button type="button" onClick={() => void copyMessage()} className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-accent)] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-[var(--color-accent-hover)]">{copied ? <Check className="h-3.5 w-3.5" /> : <Clipboard className="h-3.5 w-3.5" />}{copied ? "Copied" : "Copy opening"}</button>
            <span className="text-[11px] text-[var(--color-text-muted)]">Next: {nextAction(lead)}</span>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-4 text-xs text-[var(--color-text-muted)]">
        <span>Stage: {salesStage(lead)}</span>
        <span>Conversation: {lead.sales?.conversation_status || "Not recorded"}</span>
        <span>Proposal: {lead.sales?.proposal_status || "Not recorded"}</span>
        <span>Last activity: {relativeDate(lead.sales?.last_activity || lead.updated_at || lead.created_at)}</span>
        <Link href={`/admin/leads?lead=${lead.id}`} className="ml-auto inline-flex items-center gap-1 font-semibold text-[var(--color-accent-bright)] hover:text-[var(--color-text-primary)]">Open full lead <ArrowRight className="h-3.5 w-3.5" /></Link>
      </div>
    </article>
  );
}

export default function SalesQueuePage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [view, setView] = useState<View>("today");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/leads");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load sales queue");
      setLeads(data.leads || []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load sales queue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const visible = useMemo(() => {
    const search = query.trim().toLowerCase();
    const active = leads.filter((lead) => !lead.archived_at && !["paid", "lost"].includes(lead.lead_status));
    const base = view === "all" ? leads.filter((lead) => !lead.archived_at) : view === "recent" ? active.filter((lead) => daysSince(lead.sales?.last_activity || lead.updated_at || lead.created_at) <= 7) : active;
    return base.filter((lead) => !search || [lead.company_name, lead.contact_name, lead.email, lead.industry, lead.primary_problem, lead.sales?.main_finding, lead.sales?.recommended_solution].filter(Boolean).some((value) => String(value).toLowerCase().includes(search))).sort((a, b) => {
      if (view === "today") return priorityFor(b).score - priorityFor(a).score || Date.parse(b.sales?.last_activity || b.updated_at || b.created_at) - Date.parse(a.sales?.last_activity || a.updated_at || a.created_at);
      return Date.parse(b.sales?.last_activity || b.updated_at || b.created_at) - Date.parse(a.sales?.last_activity || a.updated_at || a.created_at);
    });
  }, [leads, query, view]);

  const updateStatus = async (id: string, status: string) => {
    setError("");
    try {
      const response = await fetch("/api/admin/leads", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, lead_status: status }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not update status");
      setLeads((current) => current.map((lead) => lead.id === id ? { ...lead, lead_status: status, updated_at: new Date().toISOString() } : lead));
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Could not update status");
    }
  };

  return (
    <div className="workspace-shell">
      <AdminSidebar />
      <main className="flex-1 min-w-0 p-5 md:p-8">
        <div className="mx-auto max-w-5xl">
          <header className="mb-9 flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-accent-bright)]"><Sparkles className="h-3.5 w-3.5" /> Founder cockpit</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[var(--color-text-primary)] md:text-4xl">Who should I contact today?</h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--color-text-secondary)]">A focused view of leads that need a decision. Review the evidence, adapt the opening, and send manually when you are ready.</p>
            </div>
            <button type="button" onClick={() => void load()} className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] px-3 py-2 text-xs font-medium text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]"><RefreshCw className="h-3.5 w-3.5" /> Refresh</button>
          </header>

          <div className="mb-7 border-y border-[var(--color-border)]/70 py-3">
            <div className="flex flex-wrap items-center gap-2">
              {[{ key: "today", label: "Today's queue" }, { key: "all", label: "All leads" }, { key: "recent", label: "Recently updated" }].map((item) => <button key={item.key} type="button" onClick={() => setView(item.key as View)} className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${view === item.key ? "bg-[var(--color-accent)]/10 text-[var(--color-accent-bright)]" : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"}`}>{item.label}</button>)}
              <span className="ml-auto text-xs text-[var(--color-text-muted)]">{visible.length} lead{visible.length === 1 ? "" : "s"}</span>
            </div>
            <div className="relative mt-3 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search company, person, industry, finding" className="w-full rounded-lg border border-[var(--color-border)] bg-transparent py-2.5 pl-9 pr-3 text-sm text-[var(--color-text-primary)] outline-none transition-colors placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)]" />
            </div>
          </div>

          {error && <div role="alert" className="mb-5 border-l-2 border-[var(--color-error)] pl-3 text-sm text-[var(--color-error)]">{error}</div>}
          {loading ? <div className="flex items-center gap-2 py-16 text-sm text-[var(--color-text-muted)]"><Loader2 className="h-4 w-4 animate-spin" /> Loading founder queue…</div> : visible.length === 0 ? <div className="border-y border-[var(--color-border)]/70 py-16 text-center"><p className="text-lg font-semibold text-[var(--color-text-primary)]">{leads.length === 0 ? "No leads captured yet" : view === "today" ? "Nothing needs attention right now" : "No leads match this view"}</p><p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[var(--color-text-muted)]">{leads.length === 0 ? "Run the public audit or interactive demo to start building the founder queue." : "Try another view or search term. Completed and lost leads are kept out of today's queue."}</p>{leads.length === 0 && <Link href="/audit" className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[var(--color-accent)] px-4 py-2.5 text-sm font-semibold text-white">Run an audit <ArrowRight className="h-4 w-4" /></Link>}</div> : <section aria-label={view === "today" ? "Today's sales queue" : "Sales leads"}>{visible.map((lead) => <QueueCard key={lead.id} lead={lead} onStatusChange={updateStatus} />)}</section>}

          <p className="mt-8 text-[11px] leading-relaxed text-[var(--color-text-muted)]">Priority is explainable, not predictive: audits, demo activity, clear findings, recommended systems, and recency. This workspace never sends messages automatically.</p>
        </div>
      </main>
    </div>
  );
}
