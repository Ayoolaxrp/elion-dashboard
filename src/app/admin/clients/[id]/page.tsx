"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface Client {
  id: string; contact_name: string; email: string; phone: string; company_name: string; industry: string; website: string;
  plan_name: string; plan_price: number; onboarding_status: string; onboarding_notes: string; status: string; created_at: string;
  client_automations: Array<{ id: string; status: string; custom_name: string; last_run_at: string; total_runs: number; success_rate: number; deployed_at: string; workflow_templates: { name: string; slug: string; category: string; description: string; value_proposition: string } }>;
  client_integrations: Array<{ integration_type: string; provider: string; status: string; last_verified_at: string }>;
  client_metrics: Array<{ leads_captured: number; leads_qualified: number; leads_responded: number; avg_response_time_seconds: number; followups_sent: number; bookings_created: number; conversion_rate: number }>;
}

const SC: Record<string, string> = { pending: "text-gray-400 bg-gray-400/10", configuring: "text-yellow-400 bg-yellow-400/10", testing: "text-purple-400 bg-purple-400/10", live: "text-green-400 bg-green-400/10", paused: "text-yellow-400 bg-yellow-400/10", failed: "text-red-400 bg-red-400/10" };

export default function ClientDetailPage() {
  const params = useParams();
  const clientId = params.id as string;
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetch(`/api/admin/clients/${clientId}`).then(r => r.json()).then(d => { setClient(d.client); setLoading(false); }).catch(() => setLoading(false)); }, [clientId]);

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-6 h-6 border-2 border-[var(--color-accent)]/30 border-t-[var(--color-accent)] rounded-full animate-spin" /></div>;
  if (!client) return <div className="p-6 max-w-4xl mx-auto text-center py-20"><p className="text-lg text-[var(--color-text-muted)]">Client not found.</p><Link href="/admin/clients" className="text-sm text-[var(--color-accent)] hover:underline mt-2 inline-block">Back to clients</Link></div>;

  const m = client.client_metrics?.[0] || null;
  const connected = client.client_integrations?.filter(i => i.status === "connected") || [];
  const live = client.client_automations?.filter(a => a.status === "live") || [];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <Link href="/admin/clients" className="text-xs text-[var(--color-accent)] hover:underline mb-4 inline-block">&larr; Back to clients</Link>
      <div className="flex items-start justify-between mb-8">
        <div><h1 className="text-2xl font-bold text-[var(--color-text-primary)]">{client.company_name}</h1><p className="text-sm text-[var(--color-text-muted)] mt-1">{client.contact_name} &middot; {client.email}</p></div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 rounded text-xs font-semibold uppercase tracking-wider bg-[var(--color-surface)] text-[var(--color-text-secondary)] border border-[var(--color-border)]">{client.plan_name || "No plan"}</span>
          <span className={`px-2 py-1 rounded text-xs font-semibold uppercase tracking-wider ${SC[client.onboarding_status] || ""}`}>{client.onboarding_status.replace("_", " ")}</span>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)]/50 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Automations ({client.client_automations?.length || 0})</h2>
            {live.length > 0 ? <div className="space-y-3">{live.map(a => (
              <div key={a.id} className="p-4 bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)]/30">
                <div className="flex items-center justify-between mb-2"><div><h3 className="text-sm font-semibold text-[var(--color-text-primary)]">{a.custom_name || a.workflow_templates.name}</h3><p className="text-xs text-[var(--color-text-muted)]">{a.workflow_templates.description}</p></div><span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${SC[a.status] || ""}`}>{a.status}</span></div>
                <div className="flex items-center gap-4 text-xs text-[var(--color-text-muted)]"><span>Runs: {a.total_runs || 0}</span><span>Success: {a.success_rate ? a.success_rate + "%" : "—"}</span><span>Deployed: {a.deployed_at ? new Date(a.deployed_at).toLocaleDateString() : "—"}</span></div>
              </div>
            ))}</div> : <p className="text-sm text-[var(--color-text-muted)]">No automations deployed yet.</p>}
          </div>
          <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)]/50 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Integrations ({connected.length}/{client.client_integrations?.length || 0} connected)</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {client.client_integrations?.map(integ => (
                <div key={integ.integration_type} className="p-3 bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)]/30"><p className="text-xs font-medium text-[var(--color-text-primary)] capitalize">{integ.integration_type}</p><p className={`text-[10px] font-semibold uppercase mt-1 ${integ.status === "connected" ? "text-green-400" : "text-[var(--color-text-muted)]"}`}>{integ.status}</p></div>
              ))}
            </div>
          </div>
          {m && (
            <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)]/50 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Performance</h2>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
                {[{ l: "Leads", v: m.leads_captured || 0 }, { l: "Qualified", v: m.leads_qualified || 0 }, { l: "Responded", v: m.leads_responded || 0 }, { l: "Avg Response", v: m.avg_response_time_seconds ? Math.round(m.avg_response_time_seconds / 60) + "m" : "—" }, { l: "Follow-ups", v: m.followups_sent || 0 }, { l: "Bookings", v: m.bookings_created || 0 }].map(item => (
                  <div key={item.l} className="text-center"><p className="text-lg font-bold text-[var(--color-text-primary)]">{item.v}</p><p className="text-[10px] text-[var(--color-text-muted)] uppercase">{item.l}</p></div>
                ))}
              </div>
            </div>
          )}
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
