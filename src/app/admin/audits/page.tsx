"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, ChevronDown, ChevronUp, Search } from "lucide-react";
import { AdminSidebar } from "@/components/admin/sidebar";

interface AuditFinding {
  id?: string;
  area: string;
  severity: "critical" | "high" | "medium" | "low";
  description?: string;
  impact?: string;
  recommendation?: string;
  evidenceLevel?: string;
  estimateNote?: string | null;
}
interface Audit {
  id: string;
  company_name: string;
  industry: string | null;
  website: string | null;
  overall_score: number | null;
  leak_count: number | null;
  critical_leaks: number | null;
  high_leaks: number | null;
  summary: string | null;
  findings: AuditFinding[] | null;
  recommendations: { needs?: string[]; roles?: string[]; priorityActions?: string[] } | null;
  status: string;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
  leads: { id: string; contact_name: string | null; email: string | null; company_name: string | null; lead_status: string | null } | null;
}

const SEV: Record<string, string> = {
  critical: "bg-red-500/10 text-red-400 border border-red-500/20",
  high: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  medium: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  low: "bg-gray-500/10 text-gray-400 border border-gray-500/20",
};
const EVIDENCE: Record<string, string> = {
  verified: "bg-emerald-500/10 text-emerald-400",
  supported: "bg-blue-500/10 text-blue-400",
  estimated: "bg-amber-500/10 text-amber-400",
  unknown: "bg-gray-500/10 text-gray-400",
};

export default function AdminAuditsPage() {
  const [audits, setAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/audits")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Request failed"))))
      .then((d) => setAudits(d.audits || []))
      .catch(() => setError("Failed to load audits"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = audits.filter((a) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return [a.company_name, a.industry, a.leads?.email, a.leads?.contact_name].filter(Boolean).some((v) => (v as string).toLowerCase().includes(q));
  });

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[var(--color-surface)]">
        <AdminSidebar />
        <main className="flex-1 flex items-center justify-center"><Loader2 className="w-6 h-6 text-[var(--color-accent)] animate-spin" /></main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[var(--color-surface)]">
      <AdminSidebar />
      <main className="flex-1 p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]" style={{ fontFamily: "Space Grotesk,sans-serif" }}>Audits</h1>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">{audits.length} audits captured from the public audit experience</p>
          </div>

          {error && <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>}

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search company, industry, email…"
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-sm"
            />
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-20 bg-[var(--color-surface-raised)] rounded-xl border border-[var(--color-border)]">
              <p className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">{audits.length === 0 ? "No audits yet" : "No audits match your search"}</p>
              <p className="text-sm text-[var(--color-text-muted)]">
                {audits.length === 0 ? "When visitors run the public audit, results are stored here with their findings." : "Try a different search term."}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((a) => {
                const isOpen = expanded === a.id;
                const score = a.overall_score ?? null;
                return (
                  <div key={a.id} className="rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] p-4 hover:border-[var(--color-accent)]/30 transition-colors">
                    <div className="flex flex-wrap items-center justify-between gap-3 cursor-pointer" onClick={() => setExpanded(isOpen ? null : a.id)}>
                      <div className="flex items-center gap-3 min-w-0">
                        {isOpen ? <ChevronUp className="w-4 h-4 text-[var(--color-text-muted)] shrink-0" /> : <ChevronDown className="w-4 h-4 text-[var(--color-text-muted)] shrink-0" />}
                        <div className="min-w-0">
                          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] truncate">{a.company_name}</h3>
                          <p className="text-xs text-[var(--color-text-muted)] truncate">
                            {a.industry || "—"} · {new Date(a.created_at).toLocaleDateString("en-NG", { timeZone: "Africa/Lagos", year: "numeric", month: "short", day: "numeric" })}
                            {a.leads?.email ? ` · ${a.leads.email}` : " · no contact email"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {score !== null && (
                          <span className="px-2 py-1 rounded-lg text-xs font-bold text-[var(--color-accent)] bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20">{score}/100</span>
                        )}
                        <span className="px-2 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wider bg-gray-500/10 text-gray-400 border border-gray-500/20">{a.status}</span>
                        <span className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-[var(--color-surface)] text-[var(--color-text-muted)] border border-[var(--color-border)]">
                          {a.critical_leaks || 0} critical · {a.high_leaks || 0} high · {a.leak_count || 0} total
                        </span>
                      </div>
                    </div>

                    {isOpen && (
                      <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
                        {a.summary && <p className="text-xs text-[var(--color-text-secondary)] mb-4 leading-relaxed">{a.summary}</p>}

                        <h4 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">Findings</h4>
                        {(a.findings || []).length === 0 ? (
                          <p className="text-xs text-[var(--color-text-muted)] mb-4">No findings recorded.</p>
                        ) : (
                          <div className="space-y-2 mb-4">
                            {(a.findings || []).map((f, i) => (
                              <div key={f.id || i} className="p-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)]/50">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${SEV[f.severity] || SEV.medium}`}>{f.severity}</span>
                                  <span className="text-xs font-semibold text-[var(--color-text-primary)]">{f.area}</span>
                                  {f.evidenceLevel && <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${EVIDENCE[f.evidenceLevel] || EVIDENCE.unknown}`}>{f.evidenceLevel}</span>}
                                </div>
                                {f.description && <p className="text-xs text-[var(--color-text-secondary)] mt-1">{f.description}</p>}
                                {f.recommendation && <p className="text-xs text-[var(--color-accent)] mt-1">→ {f.recommendation}</p>}
                                {f.estimateNote && <p className="text-[10px] text-[var(--color-text-muted)] italic mt-1">Estimate: {f.estimateNote}</p>}
                              </div>
                            ))}
                          </div>
                        )}

                        {a.recommendations && (a.recommendations.needs?.length || a.recommendations.roles?.length) ? (
                          <>
                            <h4 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">Recommended Systems</h4>
                            <div className="flex flex-wrap gap-2 mb-4">
                              {(a.recommendations.needs || []).map((n) => (
                                <span key={n} className="px-2 py-1 rounded-lg text-xs bg-[var(--color-accent)]/10 text-[var(--color-accent)] border border-[var(--color-accent)]/20">{n}</span>
                              ))}
                              {(a.recommendations.roles || []).map((r) => (
                                <span key={r} className="px-2 py-1 rounded-lg text-xs bg-[var(--color-surface)] text-[var(--color-text-secondary)] border border-[var(--color-border)]">{r}</span>
                              ))}
                            </div>
                          </>
                        ) : null}

                        <div className="flex flex-wrap items-center gap-4 text-[10px] text-[var(--color-text-muted)]">
                          <span>Audit ID: {a.id}</span>
                          {a.leads ? (
                            <Link href={`/admin/leads`} className="text-[var(--color-accent)] hover:underline">Linked lead: {a.leads.contact_name || a.leads.email || a.leads.company_name || a.leads.id}</Link>
                          ) : (
                            <span>No linked lead (no contact email provided)</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}