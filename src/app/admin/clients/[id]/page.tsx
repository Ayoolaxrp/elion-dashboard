"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle, Circle, Clock, Zap, Loader2 } from "lucide-react";
import { getClient, getClientEntitlements, getClientActivities, getClientOnboardingTasks, getClientAutomations, getClientIntegrations } from "@/lib/mock-lifecycle";
import { useParams } from "next/navigation";
import { AdminSidebar } from "@/components/admin/sidebar";
import { DemoDataBanner } from "@/components/admin/demo-data-banner";

interface RealAutomation {
  id: string;
  status: string | null;
  custom_name: string | null;
  last_run_at: string | null;
  total_runs: number | null;
  success_rate: number | null;
  deployed_at: string | null;
  workflow_templates: { name: string | null; slug: string | null; category: string | null } | null;
}
interface RealIntegration { id: string; integration_type: string | null; provider: string | null; status: string | null; last_verified_at: string | null; }
interface RealClient {
  id: string;
  contact_name: string | null;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  industry: string | null;
  country: string | null;
  timezone: string | null;
  currency: string | null;
  status: string | null;
  onboarding_status: string | null;
  created_at: string;
  client_automations?: RealAutomation[];
  client_integrations?: RealIntegration[];
}

const LIFECYCLE_COLORS: Record<string, string> = {
  prospect: "text-gray-400 bg-gray-400/10",
  contract_pending: "text-amber-400 bg-amber-400/10",
  payment_pending: "text-amber-400 bg-amber-400/10",
  onboarding: "text-blue-400 bg-blue-400/10",
  implementation: "text-blue-400 bg-blue-400/10",
  testing: "text-purple-400 bg-purple-400/10",
  live: "text-emerald-400 bg-emerald-400/10",
  paused: "text-yellow-400 bg-yellow-400/10",
  completed: "text-emerald-400 bg-emerald-400/10",
  cancelled: "text-red-400 bg-red-400/10",
};

const ONBOARDING_STAGES = ["welcome", "kickoff", "business_info", "configuration", "approval", "build", "testing", "launch", "handover"];
const STAGE_LABELS: Record<string, string> = { welcome: "Welcome", kickoff: "Kickoff", business_info: "Business Info", configuration: "Configuration", approval: "Approval", build: "Build", testing: "Testing", launch: "Launch", handover: "Handover" };

const TABS = ["Overview", "Commercial", "Onboarding", "Automations", "Activity"] as const;

const fmt = (v: string | null | undefined) => v?.trim() || <span className="text-[var(--color-text-muted)]">Not available</span>;

function RealClientView({ c }: { c: RealClient }) {
  const autos = c.client_automations || [];
  const ints = c.client_integrations || [];
  const statusLabel = (c.status || c.onboarding_status || "unknown").replace("_", " ");
  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/clients" className="p-2 rounded-lg hover:bg-[var(--color-surface-raised)]"><ArrowLeft className="w-5 h-5 text-[var(--color-text-muted)]" /></Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-[var(--color-text-primary)] truncate" style={{ fontFamily: "Space Grotesk,sans-serif" }}>{c.company_name || c.contact_name || "Client"}</h1>
          <p className="text-sm text-[var(--color-text-muted)] truncate">{c.contact_name || "-"} · {c.email || "-"}</p>
        </div>
        <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${LIFECYCLE_COLORS[c.status || c.onboarding_status || ""] || "text-gray-400 bg-gray-400/10"}`}>{statusLabel}</span>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Business</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between gap-4"><span className="text-[var(--color-text-muted)] shrink-0">Industry</span><span className="text-[var(--color-text-secondary)] text-right">{fmt(c.industry)}</span></div>
            <div className="flex justify-between gap-4"><span className="text-[var(--color-text-muted)] shrink-0">Website</span>{c.website ? <a href={c.website.startsWith("http") ? c.website : `https://${c.website}`} target="_blank" rel="noopener noreferrer" className="text-[var(--color-accent)] hover:underline text-right break-all">{c.website}</a> : <span className="text-[var(--color-text-muted)]">Not available</span>}</div>
            <div className="flex justify-between gap-4"><span className="text-[var(--color-text-muted)] shrink-0">Phone</span><span className="text-[var(--color-text-secondary)]">{fmt(c.phone)}</span></div>
            <div className="flex justify-between gap-4"><span className="text-[var(--color-text-muted)] shrink-0">Country</span><span className="text-[var(--color-text-secondary)]">{fmt(c.country)}</span></div>
            <div className="flex justify-between gap-4"><span className="text-[var(--color-text-muted)] shrink-0">Timezone</span><span className="text-[var(--color-text-secondary)]">{fmt(c.timezone)}</span></div>
            <div className="flex justify-between gap-4"><span className="text-[var(--color-text-muted)] shrink-0">Currency</span><span className="text-[var(--color-text-secondary)]">{fmt(c.currency)}</span></div>
            <div className="flex justify-between gap-4"><span className="text-[var(--color-text-muted)] shrink-0">Onboarding</span><span className="text-[var(--color-text-secondary)]">{fmt(c.onboarding_status)}</span></div>
            <div className="flex justify-between gap-4"><span className="text-[var(--color-text-muted)] shrink-0">Client since</span><span className="text-[var(--color-text-secondary)]">{new Date(c.created_at).toLocaleDateString("en-NG", { timeZone: "Africa/Lagos", year: "numeric", month: "short", day: "numeric" })}</span></div>
          </div>
        </div>
        <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Systems</h3>
          {autos.length === 0 ? (
            <p className="text-sm text-[var(--color-text-muted)]">No automations deployed yet. Use the Deploy wizard to provision systems.</p>
          ) : (
            <div className="space-y-2">
              {autos.map((a) => (
                <div key={a.id} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)]/50">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{a.custom_name || a.workflow_templates?.name || "Automation"}</p>
                    {a.workflow_templates?.slug && <p className="text-[10px] text-[var(--color-text-muted)] truncate">{a.workflow_templates.slug}</p>}
                  </div>
                  <span className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${a.status === "live" ? "text-emerald-400 bg-emerald-400/10" : a.status ? "text-amber-400 bg-amber-400/10" : "text-gray-400 bg-gray-400/10"}`}>{a.status || "pending"}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-xl p-5">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Integrations</h3>
        {ints.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">No integrations connected yet.</p>
        ) : (
          <div className="space-y-2">
            {ints.map((i) => (
              <div key={i.id} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)]/50">
                <span className="text-sm text-[var(--color-text-primary)] capitalize">{i.integration_type || "integration"}{i.provider ? ` · ${i.provider}` : ""}</span>
                <span className={`text-xs font-semibold ${i.status === "connected" || i.status === "healthy" ? "text-emerald-400" : "text-amber-400"}`}>{i.status || "not_configured"}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ClientDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const mockClient = getClient(id);
  const [real, setReal] = useState<RealClient | null>(null);
  const [loadingReal, setLoadingReal] = useState(true);
  const [tab, setTab] = useState<string>("Overview");

  useEffect(() => {
    fetch(`/api/admin/clients/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setReal(d?.client || null))
      .catch(() => {})
      .finally(() => setLoadingReal(false));
  }, [id]);

  const shell = (inner: React.ReactNode) => (
    <div className="flex min-h-screen bg-[var(--color-surface)]">
      <AdminSidebar />
      <main className="flex-1 p-4 md:p-6">{inner}</main>
    </div>
  );

  if (loadingReal) return shell(<div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-[var(--color-accent)] animate-spin" /></div>);

  // Real client record from the database.
  if (real) return shell(<RealClientView c={real} />);

  // Demo client from the onboarding journey dataset.
  if (mockClient) {
    const entitlements = getClientEntitlements(mockClient.id);
    const activities = getClientActivities(mockClient.id);
    const tasks = getClientOnboardingTasks(mockClient.id);
    const automations = getClientAutomations(mockClient.id);
    const integrations = getClientIntegrations(mockClient.id);
    const purchased = entitlements.filter(e => e.status === "active");
    const completedTasks = tasks.filter(t => t.status === "completed").length;
    const currentStageIdx = mockClient.onboarding_stage ? ONBOARDING_STAGES.indexOf(mockClient.onboarding_stage) : -1;

    return shell(
      <div className="max-w-5xl mx-auto">
        <DemoDataBanner text="Illustrative demo data : this client is part of the onboarding journey demo, not a live production record." />
        <div className="flex items-center gap-3 mb-6">
          <Link href="/admin/clients" className="p-2 rounded-lg hover:bg-[var(--color-surface-raised)]"><ArrowLeft className="w-5 h-5 text-[var(--color-text-muted)]" /></Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-[var(--color-text-primary)]" style={{ fontFamily: "Space Grotesk,sans-serif" }}>{mockClient.organization.name}</h1>
            <p className="text-sm text-[var(--color-text-muted)]">{mockClient.contact_name} · {mockClient.email}</p>
          </div>
          <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${LIFECYCLE_COLORS[mockClient.lifecycle_status]}`}>{mockClient.lifecycle_status.replace("_", " ")}</span>
        </div>

        <div className="flex gap-1 border-b border-[var(--color-border)] mb-6 overflow-x-auto">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} className={`px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${tab === t ? "text-[var(--color-accent)] border-b-2 border-[var(--color-accent)]" : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"}`}>{t}</button>
          ))}
        </div>

        {tab === "Overview" && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-xl p-5">
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Business</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-[var(--color-text-muted)]">Industry</span><span className="text-[var(--color-text-secondary)]">{mockClient.organization.industry}</span></div>
                <div className="flex justify-between"><span className="text-[var(--color-text-muted)]">Website</span><span className="text-[var(--color-text-secondary)]">{mockClient.organization.website || "-"}</span></div>
                <div className="flex justify-between"><span className="text-[var(--color-text-muted)]">Phone</span><span className="text-[var(--color-text-secondary)]">{mockClient.phone || "-"}</span></div>
                <div className="flex justify-between"><span className="text-[var(--color-text-muted)]">Since</span><span className="text-[var(--color-text-secondary)]">{new Date(mockClient.created_at).toLocaleDateString("en-NG")}</span></div>
              </div>
            </div>
            <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-xl p-5">
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Systems</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-[var(--color-text-muted)]">Purchased</span><span className="text-[var(--color-text-secondary)]">{purchased.length}</span></div>
                <div className="flex justify-between"><span className="text-[var(--color-text-muted)]">Live</span><span className="text-emerald-400">{purchased.filter(e => e.implementation_status === "live").length}</span></div>
                <div className="flex justify-between"><span className="text-[var(--color-text-muted)]">Integrations</span><span className="text-[var(--color-text-secondary)]">{integrations.filter(i => i.status === "connected").length} connected</span></div>
              </div>
            </div>
          </div>
        )}

        {tab === "Commercial" && (
          <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-xl p-5">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">What Was Sold</h3>
            <div className="space-y-2">
              {["Lead Response System", "Follow-Up Sequence", "Booking Automation", "Revenue Recovery", "Operations Automation"].map(name => {
                const ent = purchased.find(e => e.automation_name === name);
                return (
                  <div key={name} className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)]/50">
                    {ent ? <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" /> : <Circle className="w-4 h-4 text-[var(--color-text-muted)] shrink-0" />}
                    <span className={`text-sm ${ent ? "text-[var(--color-text-primary)] font-medium" : "text-[var(--color-text-muted)]"}`}>{name}</span>
                    {ent && <span className="ml-auto text-xs text-emerald-400">{ent.implementation_status}</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === "Onboarding" && mockClient.onboarding_stage && (
          <div className="space-y-6">
            <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-xl p-5">
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Onboarding Progress</h3>
              <div className="flex gap-1 mb-4">
                {ONBOARDING_STAGES.map((s, i) => (
                  <div key={s} className={`h-1.5 flex-1 rounded-full ${i < currentStageIdx ? "bg-emerald-400" : i === currentStageIdx ? "bg-[var(--color-accent)]" : "bg-[var(--color-border)]"}`} />
                ))}
              </div>
              <p className="text-xs text-[var(--color-text-muted)]">{completedTasks} of {tasks.length} tasks completed. Current: <span className="text-[var(--color-accent)]">{STAGE_LABELS[mockClient.onboarding_stage!]}</span></p>
            </div>
            <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-xl p-5">
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Tasks</h3>
              <div className="space-y-2">
                {tasks.map(t => (
                  <div key={t.id} className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)]/50">
                    {t.status === "completed" ? <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" /> : t.status === "in_progress" ? <Clock className="w-4 h-4 text-[var(--color-accent)] shrink-0" /> : <Circle className="w-4 h-4 text-[var(--color-text-muted)] shrink-0" />}
                    <div className="flex-1">
                      <p className={`text-sm ${t.status === "completed" ? "text-[var(--color-text-muted)]" : "text-[var(--color-text-primary)] font-medium"}`}>{t.title}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">{t.description}</p>
                    </div>
                    <span className="text-[10px] text-[var(--color-text-muted)] uppercase">{STAGE_LABELS[t.stage]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === "Automations" && (
          <div className="space-y-4">
            {automations.length === 0 ? (
              <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-xl p-8 text-center">
                <Zap className="w-10 h-10 text-[var(--color-text-muted)] mx-auto mb-3" />
                <p className="text-sm text-[var(--color-text-muted)]">No automations configured yet.</p>
              </div>
            ) : automations.map(a => (
              <div key={a.id} className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-xl p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">{a.automation_name}</h3>
                    <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Template {a.template_version}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${a.status === "live" ? "text-emerald-400 bg-emerald-400/10" : "text-amber-400 bg-amber-400/10"}`}>{a.status}</span>
                </div>
                {a.activated_at && <p className="text-xs text-[var(--color-text-muted)] mt-2">Activated: {new Date(a.activated_at).toLocaleDateString("en-NG")}</p>}
              </div>
            ))}

            {integrations.length > 0 && (
              <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-xl p-5">
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Integrations</h3>
                <div className="space-y-2">
                  {integrations.map(i => (
                    <div key={i.id} className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)]/50">
                      <span className="text-sm text-[var(--color-text-primary)]">{i.integration_type}</span>
                      <span className={`text-xs font-semibold ${i.status === "connected" ? "text-emerald-400" : "text-amber-400"}`}>{i.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "Activity" && (
          <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-xl p-5">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Activity Timeline</h3>
            {activities.length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)]">No activity yet.</p>
            ) : (
              <div className="space-y-3">
                {activities.map(a => (
                  <div key={a.id} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-[var(--color-accent)] mt-2 shrink-0" />
                    <div>
                      <p className="text-sm text-[var(--color-text-primary)]">{a.action}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">{a.details}</p>
                      <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">{a.actor} · {new Date(a.created_at).toLocaleDateString("en-NG", { timeZone: "Africa/Lagos" })}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return shell(<div className="p-6"><p className="text-[var(--color-text-muted)]">Client not found.</p></div>);
}