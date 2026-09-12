"use client";
// Salesperson workspace for one lead (Phase 4 UI).
//
// Renders /api/admin/lead-intelligence output so Oye never has to read JSON:
//   BUSINESS → OBSERVED (audit evidence + opportunities)
//           → DEEP AUDIT (Observed/Reported/Modeled kept visually separate)
//           → NEXT BEST ACTION (channel-gated)
//           → SALES STATE (proposals, invoices)
//
// Every "strong opportunity" shown here already passed the applicability
// engine's positive-evidence gate; zero strong opportunities is a valid,
// honest state and is rendered as such (no forced pitch).

import { useEffect, useState } from "react";
import { Loader2, AlertTriangle, CheckCircle2, XCircle, HelpCircle, ShieldCheck, TrendingUp } from "lucide-react";

interface Opportunity {
  solution: string;
  solutionName: string;
  state: string;
  confidence: "high" | "medium" | "low";
  evidence: Array<{ category: string; status: string; note: string }>;
  potentialConsequence: string;
  mustConfirm: string[];
  nextBestAction: string;
  pricingTier: string;
}

interface OpportunitiesResult {
  opportunities: Opportunity[];
  noStrongOpportunity: boolean;
  summaryLine: string;
}

interface Intel {
  lead: {
    company_name: string | null;
    contact_name: string;
    email: string;
    phone: string | null;
    website: string | null;
    industry: string | null;
    lead_status: string;
    contact_permission: string | null;
    consent_source: string | null;
    contact_permissions: Array<{ channel: string; status: string; consent_source: string | null; updated_at: string | null }> | null;
    created_at: string;
  };
  observed: {
    auditId: string | null;
    auditDate: string | null;
    overallScore: number | null;
    leakCount: number | null;
    opportunities: OpportunitiesResult | null;
  };
  reported: unknown;
  modeled: unknown;
  proposals: Array<{ id: string; status: string; total_setup: number | null; total_monthly: number | null; sent_at: string | null }> | null;
  unpaidInvoices: number;
  nextBestAction: { action: string; reason: string; allowedChannels: string[]; blockedChannels: string[] };
  truthTypeLegend: { observed: string; reported: string; modeled: string };
}

const OPP_STATE: Record<string, { label: string; cls: string }> = {
  strong_opportunity: { label: "Strong opportunity", cls: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" },
  investigate: { label: "Investigate", cls: "bg-amber-500/10 text-amber-400 border border-amber-500/30" },
  insufficient_evidence: { label: "Insufficient evidence", cls: "bg-violet-500/10 text-violet-400 border border-violet-500/30" },
  not_applicable: { label: "Not applicable", cls: "bg-[#1F2937]/40 text-[#6B7280] border border-[#1F2937]" },
  no_recommendation: { label: "No recommendation", cls: "bg-[#1F2937]/40 text-[#6B7280] border border-[#1F2937]" },
};

const CONSENT_STATUS: Record<string, { label: string; cls: string }> = {
  opted_in: { label: "Opted in", cls: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" },
  opted_out: { label: "Opted out", cls: "bg-red-500/10 text-red-400 border border-red-500/30" },
  do_not_contact: { label: "Do not contact", cls: "bg-red-500/20 text-red-300 border border-red-500/50" },
  public_business_contact: { label: "Public business contact", cls: "bg-blue-500/10 text-blue-400 border border-blue-500/30" },
  unknown: { label: "Unknown", cls: "bg-[#1F2937]/40 text-[#6B7280] border border-[#1F2937]" },
};

const TRUTH: Record<string, { label: string; cls: string }> = {
  observed: { label: "Observed", cls: "bg-blue-500/10 text-blue-400 border border-blue-500/30" },
  reported: { label: "Reported", cls: "bg-amber-500/10 text-amber-400 border border-amber-500/30" },
  modeled: { label: "Modeled", cls: "bg-violet-500/10 text-violet-400 border border-violet-500/30" },
};

const CONF: Record<string, string> = {
  high: "bg-emerald-500/10 text-emerald-400",
  medium: "bg-amber-500/10 text-amber-400",
  low: "bg-[#1F2937]/40 text-[#6B7280]",
};

function renderTruth(obj: unknown) {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
    return <span className="text-[#4B5563]">Not available</span>;
  }
  const entries = Object.entries(obj as Record<string, unknown>).filter(([, v]) => v !== null && v !== undefined && v !== "");
  if (!entries.length) return <span className="text-[#4B5563]">Not available</span>;
  return (
    <div className="grid grid-cols-1 gap-1.5">
      {entries.map(([k, v]) => (
        <div key={k} className="flex flex-col sm:flex-row sm:gap-2 text-xs">
          <span className="text-[#7C8494] sm:w-52 shrink-0 sm:text-right capitalize">{k.replace(/_/g, " ")}</span>
          <span className="text-white break-words">
            {typeof v === "object" ? JSON.stringify(v) : String(v)}
          </span>
        </div>
      ))}
    </div>
  );
}

function Section({ title, legend, children }: { title: string; legend?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-[#0A0D14] border border-[#1F2937] p-4">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-[#7C8494] mb-3 flex items-center gap-2">
        {title}
        {legend && <span className="font-normal normal-case tracking-normal text-[#4B5563]">{legend}</span>}
      </h4>
      {children}
    </div>
  );
}

export function LeadIntelligencePanel({ leadId }: { leadId: string }) {
  const [data, setData] = useState<Intel | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch(`/api/admin/lead-intelligence?leadId=${encodeURIComponent(leadId)}`);
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(d.error || `Failed to load intelligence (${r.status})`);
        if (alive) setData(d);
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : "Failed to load intelligence");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [leadId]);

  if (loading) {
    return (
      <div className="mt-4 pt-4 border-t border-[#1F2937] flex items-center gap-2 text-sm text-[#7C8494]">
        <Loader2 className="w-4 h-4 text-[#3B66E8] animate-spin" /> Loading sales intelligence…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mt-4 pt-4 border-t border-[#1F2937] flex items-start gap-2 text-sm text-red-400">
        <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
        <span>{error || "Intelligence unavailable"}</span>
      </div>
    );
  }

  const opps = data.observed?.opportunities;

  return (
    <div className="mt-4 pt-4 border-t border-[#1F2937] space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-semibold text-white">Sales Intelligence</h3>
        {data.lead.industry && <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#0A0D14] border border-[#1F2937] text-[#9CA3AF]">{data.lead.industry}</span>}
        {data.lead.website && (
          <a href={data.lead.website.startsWith("http") ? data.lead.website : `https://${data.lead.website}`} target="_blank" rel="noopener noreferrer" className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#0A0D14] border border-[#1F2937] text-[#3B66E8] hover:underline">Open website ↗</a>
        )}
        <span className="ml-auto text-[10px] text-[#4B5563]">
          {data.observed?.auditDate ? `Audit ${new Date(data.observed.auditDate).toLocaleDateString("en-NG", { timeZone: "Africa/Lagos" })}` : "No audit yet"}
        </span>
      </div>

      {/* ── Next Best Action ── */}
      <Section title="Next Best Action">
        <div className={`rounded-lg border p-3 text-sm ${data.nextBestAction.allowedChannels.length ? "border-emerald-500/30 bg-emerald-500/5" : "border-[#1F2937] bg-[#11161F]"}`}>
          <div className="flex items-start gap-2">
            {data.nextBestAction.allowedChannels.length ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
            )}
            <div>
              <p className="text-white font-medium">{data.nextBestAction.action}</p>
              <p className="text-[#7C8494] text-xs mt-1">{data.nextBestAction.reason}</p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {data.nextBestAction.allowedChannels.map((c) => (
                  <span key={c} className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">✓ {c}</span>
                ))}
                {data.nextBestAction.blockedChannels.map((c) => (
                  <span key={c} className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-500/10 text-red-400 border border-red-500/30">✗ {c}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ── Consent per channel ── */}
      <Section title="Contact permission" legend="per channel · a public number is never opt-in">
        <div className="flex flex-wrap gap-1.5">
          {(data.lead.contact_permissions && data.lead.contact_permissions.length ? data.lead.contact_permissions : []).map((p) => {
            const s = CONSENT_STATUS[p.status] || CONSENT_STATUS.unknown;
            return (
              <span key={p.channel} className={`px-2 py-1 rounded text-[10px] font-semibold ${s.cls}`}>
                {p.channel} · {s.label}
              </span>
            );
          })}
          {(!data.lead.contact_permissions || !data.lead.contact_permissions.length) && (
            <span className="text-xs text-[#4B5563]">No channel permissions recorded — default unknown.</span>
          )}
        </div>
        {data.lead.consent_source && <p className="text-[10px] text-[#4B5563] mt-2">Consent source: {data.lead.consent_source}</p>}
      </Section>

      {/* ── Commercial diagnosis (observed) ── */}
      <Section title="Commercial diagnosis" legend="from public evidence · observed, not reported">
        {opps && opps.opportunities.length > 0 ? (
          <div className="space-y-2">
            {opps.opportunities.map((o) => {
              const st = OPP_STATE[o.state] || OPP_STATE.no_recommendation;
              return (
                <div key={o.solution} className="rounded-lg bg-[#11161F] border border-[#1F2937] p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-white">{o.solutionName}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${st.cls}`}>{st.label}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${CONF[o.confidence] || CONF.low}`}>{o.confidence}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#0A0D14] border border-[#1F2937] text-[#7C8494]">{o.pricingTier.replace(/_/g, " ")}</span>
                  </div>
                  <p className="text-xs text-[#9CA3AF] mt-2">{o.potentialConsequence}</p>
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    <div className="rounded-md border border-[#1F2937] bg-[#0A0D14] p-2">
                      <span className="block text-[10px] uppercase tracking-wide text-[#4B5563]">Observation</span>
                      <span className="text-[#D1D5DB]">{o.evidence?.length ? o.evidence.map((e) => `${e.category.replace(/_/g, " ")}: ${e.note}`).join(" · ") : "No public observation recorded."}</span>
                    </div>
                    <div className="rounded-md border border-[#1F2937] bg-[#0A0D14] p-2">
                      <span className="block text-[10px] uppercase tracking-wide text-[#4B5563]">Business impact</span>
                      <span className="text-[#D1D5DB]">{o.potentialConsequence}</span>
                    </div>
                    <div className="rounded-md border border-[#1F2937] bg-[#0A0D14] p-2">
                      <span className="block text-[10px] uppercase tracking-wide text-[#4B5563]">Possible opportunity</span>
                      <span className="text-[#D1D5DB]">{st.label}; this is not a claim of lost money or guaranteed revenue.</span>
                    </div>
                    <div className="rounded-md border border-[#1F2937] bg-[#0A0D14] p-2">
                      <span className="block text-[10px] uppercase tracking-wide text-[#4B5563]">Recommended solution / next action</span>
                      <span className="text-[#D1D5DB]">{o.solutionName} · {o.nextBestAction}</span>
                    </div>
                  </div>
                  {o.evidence && o.evidence.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {o.evidence.map((e) => (
                        <span key={e.category} title={e.note} className="px-1.5 py-0.5 rounded text-[10px] bg-[#0A0D14] border border-[#1F2937] text-[#7C8494]">
                          {e.category.replace(/_/g, " ")}: {e.note.length > 60 ? e.note.slice(0, 60) + "…" : e.note}
                        </span>
                      ))}
                    </div>
                  )}
                  {o.mustConfirm && o.mustConfirm.length > 0 && (
                    <div className="mt-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#7C8494] mb-1">Must confirm with the business</p>
                      <ul className="text-xs text-white space-y-0.5 list-disc pl-4">
                        {o.mustConfirm.map((q) => <li key={q}>{q}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-lg bg-[#11161F] border border-[#1F2937] p-3 flex items-start gap-2">
            <HelpCircle className="w-4 h-4 text-[#7C8494] mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-white font-medium">{opps ? opps.summaryLine : "No audit evidence available for this lead yet."}</p>
              <p className="text-[10px] text-[#4B5563] mt-1">Zero strong opportunities is a valid result — use discovery questions before proposing anything.</p>
            </div>
          </div>
        )}
        {data.observed?.overallScore != null && (
          <p className="text-[10px] text-[#4B5563] mt-2">
            Diagnostic score: {data.observed.overallScore} · {data.observed.leakCount ?? 0} flagged items. Scores are diagnostics, not revenue claims.
          </p>
        )}
      </Section>

      {/* ── Deep Audit truth types ── */}
      <Section title="Deep Audit" legend="truth types kept separate">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="rounded-lg bg-[#11161F] border border-[#1F2937] p-3">
            <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${TRUTH.observed.cls}`} title={data.truthTypeLegend?.observed}>Observed</span>
            <p className="text-[10px] text-[#4B5563] mt-1 mb-2">{data.truthTypeLegend?.observed}</p>
            {renderTruth({ audit: data.observed?.auditId ? { audit_date: data.observed.auditDate, score: data.observed.overallScore } : null })}
          </div>
          <div className="rounded-lg bg-[#11161F] border border-[#1F2937] p-3">
            <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${TRUTH.reported.cls}`} title={data.truthTypeLegend?.reported}>Reported</span>
            <p className="text-[10px] text-[#4B5563] mt-1 mb-2">{data.truthTypeLegend?.reported}</p>
            {renderTruth(data.reported)}
          </div>
          <div className="rounded-lg bg-[#11161F] border border-[#1F2937] p-3">
            <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${TRUTH.modeled.cls}`} title={data.truthTypeLegend?.modeled}>Modeled</span>
            <p className="text-[10px] text-[#4B5563] mt-1 mb-2">{data.truthTypeLegend?.modeled}</p>
            {renderTruth(data.modeled)}
          </div>
        </div>
      </Section>

      {/* ── Sales state ── */}
      <Section title="Sales state">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="rounded-lg bg-[#11161F] border border-[#1F2937] p-3">
            <span className="text-[#7C8494] block mb-1">Proposals</span>
            {(data.proposals && data.proposals.length ? data.proposals : []).map((p) => (
              <div key={p.id} className="text-white flex justify-between gap-2 py-0.5">
                <span className="capitalize">{p.status.replace(/_/g, " ")}</span>
                <span>{p.total_setup != null ? "₦" + Number(p.total_setup).toLocaleString() : "—"}{p.total_monthly != null ? " + ₦" + Number(p.total_monthly).toLocaleString() + "/mo" : ""}</span>
              </div>
            ))}
            {(!data.proposals || !data.proposals.length) && <span className="text-[#4B5563]">No proposals yet</span>}
          </div>
          <div className="rounded-lg bg-[#11161F] border border-[#1F2937] p-3">
            <span className="text-[#7C8494] block mb-1">Invoices</span>
            {data.unpaidInvoices > 0 ? (
              <span className="text-amber-400 font-semibold flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" /> {data.unpaidInvoices} unpaid invoice{data.unpaidInvoices > 1 ? "s" : ""} outstanding</span>
            ) : (
              <span className="text-emerald-400 font-semibold flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> No outstanding invoices</span>
            )}
            <p className="text-[10px] text-[#4B5563] mt-1">Commission is calculated from collected cleared cash, not signed proposals.</p>
          </div>
        </div>
      </Section>

      <div className="flex flex-wrap items-center gap-2 text-[10px] text-[#4B5563] pt-1">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500/60" />
        <span>Next Best Action is rule-based. A public WhatsApp number is never treated as WhatsApp marketing opt-in.</span>
        <TrendingUp className="w-3.5 h-3.5 text-violet-500/60 ml-2" />
        <span>Modeled figures are scenarios, never reported fact.</span>
      </div>
    </div>
  );
}