"use client";
// ELION client portal workspace (light document style, spec section 3).
// Real data only; honest empty states. Mobile: single column, task cards.

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, FileText, BarChart3, AlertCircle, Inbox } from "lucide-react";

const T = {
  pageBg: "#F7F7F5", surface: "#FFFFFF", surfaceMuted: "#F1F1EF",
  textPrimary: "#252525", textSecondary: "#646461", textMuted: "#777773", border: "#E4E4E0",
  accent: "#6950A1", accentSoft: "#F0EAF7",
  successBg: "#E8F3EB", successText: "#25613C",
  progressBg: "#EAF0FC", progressText: "#315CAD",
  attentionBg: "#FFF3D6", attentionText: "#805A12",
  errorBg: "#FCEBEC", errorText: "#AD343D",
  neutralBg: "#EEEEEB", neutralText: "#5C5C58",
};

const STATUS_MAP: Record<string, { bg: string; text: string; label: string }> = {
  not_started: { bg: T.neutralBg, text: T.neutralText, label: "Not started" },
  in_progress: { bg: T.progressBg, text: T.progressText, label: "In progress" },
  needs_input: { bg: T.attentionBg, text: T.attentionText, label: "Needs your input" },
  complete: { bg: T.successBg, text: T.successText, label: "Complete" },
  failed: { bg: T.errorBg, text: T.errorText, label: "Failed" },
  request_sent: { bg: T.progressBg, text: T.progressText, label: "Request sent" },
  awaiting_access: { bg: T.attentionBg, text: T.attentionText, label: "Awaiting access" },
  connected: { bg: T.successBg, text: T.successText, label: "Connected" },
};

function Badge({ status }: { status: string }) {
  const s = STATUS_MAP[status] || STATUS_MAP.not_started;
  return (
    <span className="inline-flex items-center rounded-full font-medium" style={{ background: s.bg, color: s.text, fontSize: 12, padding: "4px 8px" }}>
      {s.label}
    </span>
  );
}

interface PortalData {
  client: { company_name: string; contact_name: string; plan_name: string | null; onboarding_status: string };
  project: { id: string; name: string; description: string | null; phase: string } | null;
  tasks: { id: string; title: string; details: string | null; owner: string; status: string; due_date: string | null }[];
  nextAction: { title: string; detail: string } | null;
  onboardingForm: { current_step: number; saved_steps: number; completed_at: string | null } | null;
  documents: { id: string; title: string; category: string; status: string; created_at: string }[];
  reports: { id: string; title: string; period_start: string; period_end: string; data_source: string | null }[];
  accessRequests: { id: string; service_name: string; status: string }[];
}

export default function ClientPortal() {
  const [data, setData] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetch("/api/client/portal")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => { setFailed(true); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: T.pageBg }}>
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: T.accent }} />
      </div>
    );
  }
  if (failed || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: T.pageBg }}>
        <div className="text-center" style={{ maxWidth: 420 }}>
          <AlertCircle className="w-10 h-10 mx-auto mb-3" style={{ color: T.errorText }} />
          <h1 className="text-lg font-bold mb-2" style={{ color: T.textPrimary }}>Could not load your workspace</h1>
          <p className="text-sm mb-4" style={{ color: T.textSecondary }}>Check your connection and try again. Nothing was lost.</p>
          <button onClick={() => window.location.reload()} className="rounded-md font-semibold text-white" style={{ background: T.accent, height: 44, padding: "0 20px", cursor: "pointer" }}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { client, project, tasks, nextAction, onboardingForm, documents, reports, accessRequests } = data;

  const cardStyle = { background: T.surface, border: "1px solid " + T.border } as const;

  return (
    <div className="min-h-screen py-6 px-4 sm:px-6 lg:px-10" style={{ background: T.pageBg, color: T.textPrimary }}>
      <div className="mx-auto w-full" style={{ maxWidth: 1180 }}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <p className="text-xs font-semibold tracking-widest" style={{ color: T.accent }}>ELION CLIENT WORKSPACE</p>
            <h1 className="text-2xl font-bold">{client.company_name}</h1>
            <p className="text-sm" style={{ color: T.textSecondary }}>
              {project ? project.name : "Your workspace"}{client.plan_name ? " · " + client.plan_name + " plan" : ""}
            </p>
          </div>
          <Link href="/dashboard" className="text-sm underline" style={{ color: T.textSecondary }}>Operations dashboard</Link>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:w-[280px] shrink-0 space-y-3">
            <div className="rounded-lg p-5" style={cardStyle}>
              <p className="text-sm font-semibold mb-1">Welcome, {client.contact_name.split(" ")[0]}</p>
              <p className="text-xs leading-relaxed" style={{ color: T.textSecondary }}>
                {onboardingForm?.completed_at ? "Onboarding complete. We are preparing your systems." : "Complete onboarding so we can prepare your systems."}
              </p>
              {!onboardingForm?.completed_at && (
                <Link href="/dashboard/portal/onboarding" className="mt-3 inline-flex items-center gap-1.5 rounded-md font-semibold text-white" style={{ background: T.accent, height: 44, padding: "0 16px", fontSize: 14 }}>
                  {onboardingForm && onboardingForm.saved_steps > 0 ? "Continue onboarding" : "Start onboarding"}
                </Link>
              )}
            </div>

            <div className="rounded-lg p-5" style={cardStyle}>
              <p className="text-sm font-semibold mb-2">Quick links</p>
              <ul className="space-y-1.5 text-sm">
                <li><Link href="/dashboard/documents" className="underline" style={{ color: T.textSecondary }}>Documents</Link></li>
                <li><a href="#reports" className="underline" style={{ color: T.textSecondary }}>Reports</a></li>
                <li><Link href="/landing/support" className="underline" style={{ color: T.textSecondary }}>Support</Link></li>
              </ul>
            </div>

            <div className="rounded-lg overflow-hidden" style={cardStyle}>
              <div className="px-4 py-3 font-semibold" style={{ background: T.surfaceMuted, fontSize: 15 }}>Required access</div>
              {accessRequests.length === 0 ? (
                <p className="px-4 py-3 text-xs" style={{ color: T.textMuted }}>No access requests yet. We will list anything we need here.</p>
              ) : (
                <ul>
                  {accessRequests.map((a) => (
                    <li key={a.id} className="px-4 py-3 flex items-center justify-between gap-2" style={{ borderTop: "1px solid " + T.border }}>
                      <span className="text-sm">{a.service_name}</span>
                      <Badge status={a.status} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="flex-1 space-y-3">
            <div className="rounded-lg p-5" style={{ background: T.accentSoft, border: "1px solid " + T.border }}>
              <p className="text-xs font-semibold tracking-wide mb-1" style={{ color: T.accent }}>YOUR NEXT ACTION</p>
              {nextAction ? (
                <>
                  <p className="text-base font-semibold">{nextAction.title}</p>
                  <p className="text-sm mt-0.5" style={{ color: T.textSecondary }}>{nextAction.detail}</p>
                </>
              ) : (
                <p className="text-sm" style={{ color: T.textSecondary }}>Nothing needed from you right now.</p>
              )}
            </div>

            <div className="rounded-lg overflow-hidden" style={cardStyle}>
              <div className="px-4 py-3 font-semibold" style={{ background: T.accentSoft, fontSize: 15 }}>
                {project ? "Tasks · " + project.name : "Tasks"}
              </div>
              {tasks.length === 0 ? (
                <p className="px-4 py-4 text-sm" style={{ color: T.textMuted }}>No tasks yet. Tasks appear here as your implementation starts.</p>
              ) : (
                <>
                  <table className="hidden sm:table w-full">
                    <thead>
                      <tr className="text-left" style={{ borderBottom: "1px solid " + T.border }}>
                        <th className="py-2.5 px-4 text-xs font-medium" style={{ color: T.textSecondary }}>Task</th>
                        <th className="py-2.5 px-4 text-xs font-medium" style={{ color: T.textSecondary }}>Status</th>
                        <th className="py-2.5 px-4 text-xs font-medium" style={{ color: T.textSecondary }}>Owner</th>
                        <th className="py-2.5 px-4 text-xs font-medium" style={{ color: T.textSecondary }}>Due</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tasks.map((t) => (
                        <tr key={t.id} style={{ borderBottom: "1px solid " + T.border }}>
                          <td className="py-3 px-4 text-sm">{t.title}</td>
                          <td className="py-3 px-4"><Badge status={t.status} /></td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1.5 text-sm" style={{ color: T.textSecondary }}>
                              <span className="w-6 h-6 rounded-full inline-flex items-center justify-center text-[10px] font-semibold" style={{ background: T.accentSoft, color: T.accent }}>
                                {(t.owner || "E").slice(0, 2).toUpperCase()}
                              </span>
                              {t.owner}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm" style={{ color: T.textSecondary }}>{t.due_date || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <ul className="sm:hidden">
                    {tasks.map((t) => (
                      <li key={t.id} className="px-4 py-3" style={{ borderTop: "1px solid " + T.border }}>
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p className="text-sm font-medium">{t.title}</p>
                          <Badge status={t.status} />
                        </div>
                        <p className="text-xs" style={{ color: T.textMuted }}>{t.owner}{t.due_date ? " · due " + t.due_date : ""}</p>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>

            <div className="rounded-lg overflow-hidden" style={cardStyle}>
              <div className="px-4 py-3 font-semibold" style={{ background: T.surfaceMuted, fontSize: 15 }}>Recent deliverables</div>
              {documents.length === 0 ? (
                <p className="px-4 py-4 text-sm" style={{ color: T.textMuted }}>No documents yet. Your scope and agreement will appear here.</p>
              ) : (
                <ul>
                  {documents.slice(0, 5).map((d) => (
                    <li key={d.id} className="px-4 py-3 flex items-center justify-between gap-3" style={{ borderTop: "1px solid " + T.border }}>
                      <span className="inline-flex items-center gap-2 text-sm min-w-0">
                        <FileText className="w-4 h-4 shrink-0" style={{ color: T.accent }} />
                        <span className="truncate">{d.title}</span>
                      </span>
                      <Badge status={d.status === "final" ? "complete" : "in_progress"} />
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div id="reports" className="rounded-lg overflow-hidden" style={cardStyle}>
              <div className="px-4 py-3 font-semibold" style={{ background: T.surfaceMuted, fontSize: 15 }}>Reports</div>
              {reports.length === 0 ? (
                <div className="px-4 py-4">
                  <p className="text-sm flex items-center gap-2" style={{ color: T.textMuted }}><Inbox className="w-4 h-4" /> No reports yet.</p>
                  <p className="text-xs mt-1" style={{ color: T.textMuted }}>
                    Monthly reporting starts once your systems are live and integrations are connected. We never show invented metrics.
                  </p>
                </div>
              ) : (
                <ul>
                  {reports.map((r) => (
                    <li key={r.id} className="px-4 py-3 flex items-center justify-between gap-3" style={{ borderTop: "1px solid " + T.border }}>
                      <span className="inline-flex items-center gap-2 text-sm min-w-0">
                        <BarChart3 className="w-4 h-4 shrink-0" style={{ color: T.accent }} />
                        <span className="truncate">{r.title} · {r.period_start} to {r.period_end}</span>
                      </span>
                      <span className="text-xs shrink-0" style={{ color: T.textMuted }}>{r.data_source || ""}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
