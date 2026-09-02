"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
interface Client { id: string; contact_name: string; email: string; company_name: string; plan_name: string; onboarding_status: string; status: string; created_at: string; client_automations: Array<{ id: string; status: string; workflow_templates: { name: string; category: string } }>; client_integrations: Array<{ integration_type: string; status: string }>; }
const SC: Record<string, string> = { active: "text-green-400 bg-green-400/10", paused: "text-yellow-400 bg-yellow-400/10", churned: "text-red-400 bg-red-400/10", completed: "text-blue-400 bg-blue-400/10" };
const OC: Record<string, string> = { pending: "text-gray-400 bg-gray-400/10", in_review: "text-yellow-400 bg-yellow-400/10", building: "text-blue-400 bg-blue-400/10", testing: "text-purple-400 bg-purple-400/10", go_live: "text-green-400 bg-green-400/10", completed: "text-green-400 bg-green-400/10" };
export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { fetch("/api/admin/clients").then(r => r.json()).then(d => { setClients(d.clients || []); setLoading(false); }).catch(() => setLoading(false)); }, []);
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div><h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Clients</h1><p className="text-sm text-[var(--color-text-muted)] mt-1">Manage client accounts, automations, and onboarding.</p></div>
        <span className="text-xs text-[var(--color-text-muted)]">{clients.length} clients</span>
      </div>
      {loading ? (<div className="flex items-center justify-center py-20"><div className="w-6 h-6 border-2 border-[var(--color-accent)]/30 border-t-[var(--color-accent)] rounded-full animate-spin" /></div>
      ) : clients.length === 0 ? (
        <div className="text-center py-20 bg-[var(--color-surface-raised)] rounded-xl border border-[var(--color-border)]/50">
          <p className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">No clients yet</p>
          <p className="text-sm text-[var(--color-text-muted)]">Clients appear here after a lead converts and is onboarded.</p>
          <div className="flex gap-2 justify-center mt-4"><Link href="/admin/clients/new" className="inline-flex items-center gap-2 px-4 py-2 bg-[#3B66E8] text-white text-sm font-semibold rounded-lg hover:bg-[#3B66E8] transition-colors">Add Client</Link><Link href="/admin/leads" className="inline-flex items-center gap-2 px-4 py-2 bg-[#1F2937] text-white text-sm font-semibold rounded-lg hover:bg-[#2A3548] border border-[#1F2937] transition-colors">View Leads</Link></div>
        </div>
      ) : (
        <div className="space-y-3">
          {clients.map((c) => (
            <Link key={c.id} href={`/admin/clients/${c.id}`} className="block p-5 bg-[var(--color-surface-raised)] border border-[var(--color-border)]/50 rounded-xl hover:border-[var(--color-border)] transition-all">
              <div className="flex items-start justify-between mb-3">
                <div><h3 className="text-base font-semibold text-[var(--color-text-primary)]">{c.company_name}</h3><p className="text-xs text-[var(--color-text-muted)]">{c.contact_name} · {c.email}</p></div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${OC[c.onboarding_status] || ""}`}>{c.onboarding_status.replace("_", " ")}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${SC[c.status] || ""}`}>{c.status}</span>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-[var(--color-text-muted)]">
                <span>Plan: <span className="text-[var(--color-text-secondary)]">{c.plan_name || "Not set"}</span></span>
                <span>Automations: <span className="text-[var(--color-text-secondary)]">{c.client_automations?.length || 0}</span></span>
                <span>Integrations: <span className="text-[var(--color-text-secondary)]">{c.client_integrations?.filter(i => i.status === "connected").length || 0} connected</span></span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
