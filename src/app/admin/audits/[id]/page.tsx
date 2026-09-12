"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, ExternalLink, Loader2 } from "lucide-react";
import { AdminSidebar } from "@/components/admin/sidebar";

type Finding = {
  area?: string;
  title?: string;
  severity?: string;
  description?: string;
  impact?: string;
  recommendation?: string;
  evidence?: string;
  evidenceLevel?: string;
  estimateNote?: string | null;
};

type Audit = {
  id: string;
  company_name: string;
  industry: string | null;
  website: string | null;
  overall_score: number | null;
  leak_count: number | null;
  critical_leaks: number | null;
  high_leaks: number | null;
  summary: string | null;
  findings: Finding[] | null;
  recommendations: { needs?: string[]; roles?: string[]; priorityActions?: string[] } | null;
  status: string;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
  leads: {
    id: string;
    contact_name: string | null;
    email: string | null;
    phone: string | null;
    company_name: string | null;
    website: string | null;
    industry: string | null;
    primary_problem: string | null;
    lead_status: string | null;
  } | null;
};

const severityClass: Record<string, string> = {
  critical: "border-red-500/30 bg-red-500/10 text-red-300",
  high: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  medium: "border-blue-500/30 bg-blue-500/10 text-blue-300",
  low: "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)]",
};

function display(value: string | null | undefined, fallback = "Not recorded") {
  return value?.trim() || fallback;
}

export default function AuditDetailPage() {
  const params = useParams<{ id: string }>();
  const [audit, setAudit] = useState<Audit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const id = params.id;
    fetch(`/api/admin/audits/${encodeURIComponent(id)}`)
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || "Could not load audit");
        return body.audit as Audit;
      })
      .then(setAudit)
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Could not load audit"))
      .finally(() => setLoading(false));
  }, [params.id]);

  return (
    <div className="workspace-shell">
      <AdminSidebar />
      <main className="min-w-0 flex-1 p-5 md:p-8">
        <div className="mx-auto max-w-5xl">
          <Link href="/admin/audits" className="inline-flex items-center gap-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
            <ArrowLeft className="h-4 w-4" /> Back to audits
          </Link>

          {loading ? (
            <div className="flex items-center gap-2 py-20 text-sm text-[var(--color-text-muted)]"><Loader2 className="h-4 w-4 animate-spin" /> Loading audit…</div>
          ) : error || !audit ? (
            <div className="mt-8 border-y border-[var(--color-border)]/70 py-16">
              <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">Audit unavailable</h1>
              <p className="mt-2 text-sm text-[var(--color-text-muted)]">{error || "This audit could not be found."}</p>
            </div>
          ) : (
            <>
              <header className="mt-8 flex flex-wrap items-start justify-between gap-5 border-b border-[var(--color-border)]/70 pb-8">
                <div>
                  <p className="workspace-kicker">Audit detail</p>
                  <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[var(--color-text-primary)] md:text-4xl">{display(audit.company_name)}</h1>
                  <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{display(audit.industry, "Industry not recorded")} · {new Date(audit.created_at).toLocaleDateString("en-NG")}</p>
                  {audit.website && <a href={audit.website.startsWith("http") ? audit.website : `https://${audit.website}`} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 text-sm text-[var(--color-accent-bright)] hover:underline">{audit.website} <ExternalLink className="h-3 w-3" /></a>}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">{audit.status}</span>
                  {audit.status === "completed" && <Link href={`/admin/proposals?audit=${encodeURIComponent(audit.id)}`} className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-accent)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-accent-hover)]">Create proposal <ArrowRight className="h-4 w-4" /></Link>}
                </div>
              </header>

              <section className="grid gap-3 py-8 sm:grid-cols-4" aria-label="Audit summary">
                {[{ label: "Automation score", value: audit.overall_score === null ? "—" : `${audit.overall_score}/100` }, { label: "Total findings", value: audit.leak_count ?? 0 }, { label: "Critical", value: audit.critical_leaks ?? 0 }, { label: "High priority", value: audit.high_leaks ?? 0 }].map((item) => (
                  <div key={item.label} className="border-l-2 border-[var(--color-accent)]/60 pl-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">{item.label}</p>
                    <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--color-text-primary)]">{item.value}</p>
                  </div>
                ))}
              </section>

              <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr]">
                <section>
                  <p className="workspace-kicker">Diagnosis</p>
                  <h2 className="mt-2 text-xl font-semibold text-[var(--color-text-primary)]">What the audit found</h2>
                  {audit.summary && <p className="mt-4 text-sm leading-relaxed text-[var(--color-text-secondary)]">{audit.summary}</p>}
                  <div className="mt-6 space-y-4">
                    {(audit.findings || []).length === 0 ? <p className="border-y border-[var(--color-border)]/70 py-8 text-sm text-[var(--color-text-muted)]">No findings were recorded for this audit.</p> : (audit.findings || []).map((finding, index) => {
                      const severity = (finding.severity || "medium").toLowerCase();
                      return <article key={`${finding.area || finding.title || "finding"}-${index}`} className="border-y border-[var(--color-border)]/70 py-5 first:border-t-0">
                        <div className="flex flex-wrap items-center gap-2"><span className={`rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-wider ${severityClass[severity] || severityClass.medium}`}>{severity}</span><h3 className="text-sm font-semibold text-[var(--color-text-primary)]">{display(finding.title || finding.area, "Operational finding")}</h3>{finding.evidenceLevel && <span className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">{finding.evidenceLevel}</span>}</div>
                        {finding.description && <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">{finding.description}</p>}
                        {finding.impact && <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-primary)]"><strong>Business impact:</strong> {finding.impact}</p>}
                        {finding.evidence && <p className="mt-2 text-xs leading-relaxed text-[var(--color-text-muted)]"><strong>Evidence:</strong> {finding.evidence}</p>}
                        {finding.recommendation && <p className="mt-3 text-sm leading-relaxed text-[var(--color-accent-bright)]"><strong>Recommendation:</strong> {finding.recommendation}</p>}
                        {finding.estimateNote && <p className="mt-2 text-xs italic text-[var(--color-text-muted)]">Modeled scenario: {finding.estimateNote}. Not a forecast or guarantee.</p>}
                      </article>;
                    })}
                  </div>
                </section>

                <aside className="space-y-8">
                  <section>
                    <p className="workspace-kicker">Client context</p>
                    <div className="mt-4 space-y-3 text-sm">
                      <div><p className="text-xs text-[var(--color-text-muted)]">Contact</p><p className="mt-1 text-[var(--color-text-primary)]">{display(audit.leads?.contact_name)}</p></div>
                      <div><p className="text-xs text-[var(--color-text-muted)]">Email</p><p className="mt-1 break-all text-[var(--color-text-primary)]">{display(audit.leads?.email)}</p></div>
                      <div><p className="text-xs text-[var(--color-text-muted)]">Phone</p><p className="mt-1 text-[var(--color-text-primary)]">{display(audit.leads?.phone)}</p></div>
                      <div><p className="text-xs text-[var(--color-text-muted)]">Business challenge</p><p className="mt-1 leading-relaxed text-[var(--color-text-primary)]">{display(audit.leads?.primary_problem)}</p></div>
                    </div>
                  </section>
                  <section>
                    <p className="workspace-kicker">Recommended direction</p>
                    <div className="mt-4 space-y-3">
                      {(audit.recommendations?.needs || []).length === 0 ? <p className="text-sm text-[var(--color-text-muted)]">No systems were recommended yet.</p> : (audit.recommendations?.needs || []).map((need) => <div key={need} className="flex items-start gap-2 text-sm text-[var(--color-text-primary)]"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-accent-bright)]" />{need}</div>)}
                      {(audit.recommendations?.roles || []).length > 0 && <p className="pt-2 text-xs leading-relaxed text-[var(--color-text-muted)]">Operational roles involved: {(audit.recommendations?.roles || []).join(", ")}</p>}
                    </div>
                  </section>
                  <section className="border-l-2 border-[var(--color-accent)]/60 pl-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">Next step</p>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">Review the evidence, confirm the scope with the business, then create a proposal from this completed audit.</p>
                    {audit.status === "completed" && <Link href={`/admin/proposals?audit=${encodeURIComponent(audit.id)}`} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-accent-bright)] hover:text-[var(--color-text-primary)]">Create from findings <ArrowRight className="h-4 w-4" /></Link>}
                  </section>
                </aside>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
