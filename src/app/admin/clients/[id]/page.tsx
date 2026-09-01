"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Play, Pause, Loader2, Check, X, ChevronDown, ChevronUp } from "lucide-react";

interface Client {
  id: string; contact_name: string; email: string; phone: string; company_name: string; industry: string; website: string;
  plan_name: string; plan_price: number; onboarding_status: string; onboarding_notes: string; onboarding_form_data: Record<string, unknown> | null; onboarding_completed_at: string | null; status: string; created_at: string;
  client_automations: Array<{ id: string; status: string; custom_name: string; last_run_at: string; total_runs: number; success_rate: number; deployed_at: string; workflow_templates: { name: string; slug: string; category: string; description: string; value_proposition: string } }>;
  client_integrations: Array<{ integration_type: string; provider: string; status: string; last_verified_at: string }>;
  client_metrics: Array<{ leads_captured: number; leads_qualified: number; leads_responded: number; avg_response_time_seconds: number; followups_sent: number; bookings_created: number; conversion_rate: number }>;
}
interface ProvisioningStep { step: string; status: string; detail?: string; missing?: string[]; }
interface ProvisioningLog {
  id: string; created_at: string; action: string; status: string; steps: ProvisioningStep[];
  error_message: string | null; duration_ms: number | null;
  workflow_templates: { name: string; slug: string; category: string } | null;
}
const SC: Record<string, string> = { pending: "text-gray-400 bg-gray-400/10", configuring: "text-yellow-400 bg-yellow-400/10", testing: "text-purple-400 bg-purple-400/10", live: "text-green-400 bg-green-400/10", paused: "text-yellow-400 bg-yellow-400/10", failed: "text-red-400 bg-red-400/10" };
const CAT_LABELS: Record<string, string> = { lead_response: "Lead Response", follow_up: "Follow-Up", booking: "Booking", revenue_recovery: "Revenue Recovery", operations: "Operations" };

export default function ClientDetailPage() {
  const params = useParams();
  const clientId = params.id as string;
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [provisioning, setProvisioning] = useState<string | null>(null);
  const [provisionResult, setProvisionResult] = useState<{ steps: ProvisioningStep[]; error?: string } | null>(null);
  const [logs, setLogs] = useState<ProvisioningLog[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => { fetchClient(); }, [clientId]);
  const fetchClient = () => { fetch("/api/admin/clients/" + clientId).then(r => r.json()).then(d => { setClient(d.client); setLoading(false); }).catch(() => setLoading(false)); };
  const fetchLogs = () => { fetch("/api/admin/clients/" + clientId + "/provision").then(r => r.json()).then(d => setLogs(d.logs || [])).catch(() => {}); };

  const handleProvision = async (templateId: string) => {
    setProvisioning(templateId); setProvisionResult(null);
    try {
      const res = await fetch("/api/admin/clients/" + clientId + "/provision", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ template_id: templateId }) });
      const data = await res.json();
      setProvisionResult({ steps: data.steps || [], error: data.error });
      fetchClient(); fetchLogs();
    } catch { setProvisionResult({ steps: [], error: "Request failed" }); }
    setProvisioning(null);
  };

  const handleProvisionAll = async () => {
    setProvisioning("all"); setProvisionResult(null);
    try {
      const res = await fetch("/api/admin/clients/" + clientId + "/provision", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "provision_all" }) });
      const data = await res.json();
      const allSteps = (data.results || []).flatMap((r: { steps: ProvisioningStep[] }) => r.steps);
      const hasError = (data.results || []).some((r: { success: boolean }) => !r.success);
      setProvisionResult({ steps: allSteps, error: hasError ? "Some automations failed" : undefined });
      fetchClient(); fetchLogs();
    } catch { setProvisionResult({ steps: [], error: "Request failed" }); }
    setProvisioning(null);
  };

  const handleDeactivate = async (aid: string) => {
    await fetch("/api/admin/clients/" + clientId + "/provision", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "deactivate", automation_id: aid }) });
    fetchClient(); fetchLogs();
  };
  const handleReactivate = async (aid: string) => {
    await fetch("/api/admin/clients/" + clientId + "/provision", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "reactivate", automation_id: aid }) });
    fetchClient(); fetchLogs();
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-6 h-6 border-2 border-[var(--color-accent)]/30 border-t-[var(--color-accent)] rounded-full animate-spin" /></div>;
  if (!client) return <div className="p-6 max-w-4xl mx-auto text-center py-20"><p className="text-lg text-[var(--color-text-muted)]">Client not found.</p><Link href="/admin/clients" className="text-sm text-[var(--color-accent)] hover:underline mt-2 inline-block">Back to clients</Link></div>;

  const m = client.client_metrics?.[0] || null;
  const connected = client.client_integrations?.filter(i => i.status === "connected") || [];
  const allAuto = client.client_automations || [];
  const dispAuto = showAll ? allAuto : allAuto.filter(a => a.status === "live");

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <Link href="/admin/clients" className="text-xs text-[var(--color-accent)] hover:underline mb-4 inline-block">&larr; Back to clients</Link>
      <div className="flex items-start justify-between mb-8">
        <div><h1 className="text-2xl font-bold text-[var(--color-text-primary)]">{client.company_name}</h1><p className="text-sm text-[var(--color-text-muted)] mt-1">{client.contact_name} &middot; {client.email}</p></div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 rounded text-xs font-semibold uppercase tracking-wider bg-[var(--color-surface)] text-[var(--color-text-secondary)] border border-[var(--color-border)]">{client.plan_name || "No plan"}</span>
          <span className={"px-2 py-1 rounded text-xs font-semibold uppercase tracking-wider " + (SC[client.onboarding_status] || "")}>{client.onboarding_status.replace("_", " ")}</span>
        </div>
      </div>

      {/* Onboarding Link */}
      <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)]/50 rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Client Onboarding</h2>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              {client.onboarding_status === 'completed'
                ? 'Onboarding completed on ' + new Date(client.onboarding_completed_at || Date.now()).toLocaleDateString()
                : client.onboarding_status === 'in_review'
                ? 'Onboarding form submitted — review the details below'
                : 'Send this link to the client to complete onboarding'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={typeof window !== 'undefined' ? window.location.origin + '/onboarding/' + client.id : '/onboarding/' + client.id}
              className="px-3 py-1.5 text-xs bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-muted)] w-64"
            />
            <button
              onClick={() => {
                const url = window.location.origin + '/onboarding/' + client.id;
                navigator.clipboard.writeText(url);
              }}
              className="px-3 py-1.5 text-xs bg-[var(--color-accent)] text-white rounded-lg hover:opacity-90 transition-colors cursor-pointer"
            >
              Copy Link
            </button>
            <a
              href={'/onboarding/' + client.id}
              target="_blank"
              className="px-3 py-1.5 text-xs border border-[var(--color-border)] text-[var(--color-text-secondary)] rounded-lg hover:bg-[var(--color-surface)] transition-colors"
            >
              Preview
            </a>
          </div>
        </div>
      </div>

      {/* Provisioning Controls */}
      <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)]/50 rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Automation Provisioning</h2>
          <div className="flex gap-2">
            <button onClick={() => { fetchLogs(); setShowLogs(!showLogs); }} className="px-3 py-1.5 text-xs text-[var(--color-text-secondary)] border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-surface)] transition-colors cursor-pointer">{showLogs ? "Hide Logs" : "View Logs"}</button>
            <button onClick={handleProvisionAll} disabled={provisioning === "all"} className="px-3 py-1.5 text-xs bg-[var(--color-accent)] text-white rounded-lg hover:opacity-90 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5">{provisioning === "all" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}Provision All</button>
          </div>
        </div>
        <p className="text-xs text-[var(--color-text-muted)] mb-3">Provision automations from active entitlements. Each template validates configuration and credentials before activation.</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {["lead_response", "follow_up", "booking", "revenue_recovery", "operations"].map(cat => {
            const existing = allAuto.find(a => a.workflow_templates?.category === cat);
            return (
              <div key={cat} className={"p-3 rounded-lg border " + (existing ? "border-[var(--color-border)]/50 bg-[var(--color-surface)]" : "border-dashed border-[var(--color-border)]/30 bg-transparent")}>
                <p className="text-xs font-medium text-[var(--color-text-primary)]">{CAT_LABELS[cat] || cat}</p>
                {existing ? (
                  <div className="flex items-center justify-between mt-2">
                    <span className={"text-[10px] font-semibold uppercase " + (SC[existing.status] || "")}>{existing.status}</span>
                    <div className="flex gap-1">
                      {existing.status === "live" && <button onClick={() => handleDeactivate(existing.id)} className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-error)] cursor-pointer" title="Pause"><Pause className="w-3 h-3" /></button>}
                      {existing.status === "paused" && <button onClick={() => handleReactivate(existing.id)} className="p-1 text-[var(--color-text-muted)] hover:text-green-400 cursor-pointer" title="Reactivate"><Play className="w-3 h-3" /></button>}
                    </div>
                  </div>
                ) : (
                  <button onClick={() => handleProvision(cat)} disabled={!!provisioning} className="mt-2 px-2 py-1 text-[10px] bg-[var(--color-accent)]/10 text-[var(--color-accent)] rounded cursor-pointer hover:bg-[var(--color-accent)]/20 disabled:opacity-50 flex items-center gap-1">
                    {provisioning === cat ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Play className="w-2.5 h-2.5" />}Provision
                  </button>
                )}
              </div>
            );
          })}
        </div>
        {provisionResult && (
          <div className={"mt-4 p-4 rounded-lg border " + (provisionResult.error ? "border-[var(--color-error)]/30 bg-[var(--color-error)]/5" : "border-green-400/30 bg-green-400/5")}>
            <div className="flex items-center gap-2 mb-2">
              {provisionResult.error ? <X className="w-4 h-4 text-[var(--color-error)]" /> : <Check className="w-4 h-4 text-green-400" />}
              <p className="text-sm font-medium text-[var(--color-text-primary)]">{provisionResult.error || "Provisioning complete"}</p>
            </div>
            <div className="space-y-1">
              {provisionResult.steps.map((s, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className={s.status === "passed" ? "text-green-400" : s.status === "failed" || s.status === "blocked" ? "text-[var(--color-error)]" : "text-yellow-400"}>
                    {s.status === "passed" ? "✓" : s.status === "failed" || s.status === "blocked" ? "✗" : "○"}
                  </span>
                  <span className="text-[var(--color-text-secondary)]">{s.step}</span>
                  {s.detail && <span className="text-[var(--color-text-muted)]">({s.detail})</span>}
                  {s.missing && <span className="text-[var(--color-error)]">Missing: {s.missing.join(", ")}</span>}
                </div>
              ))}
            </div>
          </div>
        )}
        {showLogs && (
          <div className="mt-4 space-y-2">
            {logs.length === 0 ? <p className="text-xs text-[var(--color-text-muted)]">No provisioning logs yet.</p> : logs.slice(0, 10).map(log => (
              <div key={log.id} className="p-3 bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)]/30">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className={"text-[10px] font-semibold uppercase " + (log.status === "passed" ? "text-green-400" : log.status === "failed" ? "text-[var(--color-error)]" : "text-yellow-400")}>{log.status}</span>
                    <span className="text-xs text-[var(--color-text-secondary)]">{log.action}</span>
                    {log.workflow_templates && <span className="text-xs text-[var(--color-text-muted)]">— {log.workflow_templates.name}</span>}
                  </div>
                  <span className="text-[10px] text-[var(--color-text-muted)]">{new Date(log.created_at).toLocaleString()}</span>
                </div>
                {log.error_message && <p className="text-xs text-[var(--color-error)] mt-1">{log.error_message}</p>}
                {log.duration_ms && <p className="text-[10px] text-[var(--color-text-muted)] mt-1">{log.duration_ms}ms</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)]/50 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Automations ({allAuto.length})</h2>
              {allAuto.length > 0 && <button onClick={() => setShowAll(!showAll)} className="text-[10px] text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] cursor-pointer flex items-center gap-1">{showAll ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}{showAll ? "Show live only" : "Show all"}</button>}
            </div>
            {dispAuto.length > 0 ? (
              <div className="space-y-3">{dispAuto.map(a => (
                <div key={a.id} className="p-4 bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)]/30">
                  <div className="flex items-center justify-between mb-2">
                    <div><h3 className="text-sm font-semibold text-[var(--color-text-primary)]">{a.custom_name || a.workflow_templates?.name}</h3><p className="text-xs text-[var(--color-text-muted)]">{a.workflow_templates?.description}</p></div>
                    <div className="flex items-center gap-2">
                      <span className={"px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider " + (SC[a.status] || "")}>{a.status}</span>
                      {a.status === "live" && <button onClick={() => handleDeactivate(a.id)} className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-error)] cursor-pointer"><Pause className="w-3 h-3" /></button>}
                      {a.status === "paused" && <button onClick={() => handleReactivate(a.id)} className="p-1 text-[var(--color-text-muted)] hover:text-green-400 cursor-pointer"><Play className="w-3 h-3" /></button>}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-[var(--color-text-muted)]">
                    <span>Runs: {a.total_runs || 0}</span><span>Success: {a.success_rate ? a.success_rate + "%" : "—"}</span><span>Deployed: {a.deployed_at ? new Date(a.deployed_at).toLocaleDateString() : "—"}</span>
                  </div>
                </div>
              ))}</div>
            ) : <p className="text-sm text-[var(--color-text-muted)]">{showAll ? "No automations provisioned yet." : "No live automations."}</p>}
          </div>
          <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)]/50 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Integrations ({connected.length}/{client.client_integrations?.length || 0} connected)</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {client.client_integrations?.map(integ => (
                <div key={integ.integration_type} className="p-3 bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)]/30"><p className="text-xs font-medium text-[var(--color-text-primary)] capitalize">{integ.integration_type}</p><p className={"text-[10px] font-semibold uppercase mt-1 " + (integ.status === "connected" ? "text-green-400" : "text-[var(--color-text-muted)]")}>{integ.status}</p></div>
              ))}
            </div>
          </div>
          {m && (<div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)]/50 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Performance</h2>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
              {[{ l: "Leads", v: m.leads_captured || 0 }, { l: "Qualified", v: m.leads_qualified || 0 }, { l: "Responded", v: m.leads_responded || 0 }, { l: "Avg Response", v: m.avg_response_time_seconds ? Math.round(m.avg_response_time_seconds / 60) + "m" : "—" }, { l: "Follow-ups", v: m.followups_sent || 0 }, { l: "Bookings", v: m.bookings_created || 0 }].map(item => (
                <div key={item.l} className="text-center"><p className="text-lg font-bold text-[var(--color-text-primary)]">{item.v}</p><p className="text-[10px] text-[var(--color-text-muted)] uppercase">{item.l}</p></div>
              ))}
            </div>
          </div>)}
        </div>
        <div className="space-y-4">
          <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)]/50 rounded-xl p-5">
            <h3 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">Client Info</h3>
            <div className="space-y-2 text-sm">
              {[["Plan", client.plan_name || "—"], ["Price", client.plan_price ? "₦" + (client.plan_price / 100).toLocaleString() : "—"], ["Industry", client.industry || "—"], ["Phone", client.phone || "—"], ["Status", client.status], ["Since", new Date(client.created_at).toLocaleDateString()]].map(([k, v]) => (
                <div key={k} className="flex justify-between"><span className="text-[var(--color-text-muted)]">{k}</span><span className="text-[var(--color-text-primary)]">{v}</span></div>
              ))}
            </div>
          </div>
          {client.onboarding_notes && <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)]/50 rounded-xl p-5"><h3 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">Notes</h3><p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{client.onboarding_notes}</p></div>}
        </div>
      </div>
    </div>
  );
}
