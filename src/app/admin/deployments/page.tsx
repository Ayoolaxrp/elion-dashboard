"use client";
// Client infrastructure — deployment ownership + vendor-cost register.
// One screen so delivery knows: who owns each n8n instance, who pays every
// vendor, what ELION pays per month, and whether a deployment is ready.

import { useEffect, useState } from "react";
import { AdminSidebar } from "@/components/admin/sidebar";
import { Loader2, ShieldCheck, Plus, Trash2, TrendingUp, AlertTriangle } from "lucide-react";

interface Client { id: string; company_name: string | null; contact_name: string | null; email: string | null; }
interface Automation {
  id: string;
  custom_name: string | null;
  status: string;
  deployment_type: string | null;
  instance_ref: string | null;
  billing_owner: string | null;
  elion_access_state: string | null;
  n8n_plan: string | null;
  estimated_monthly_executions: number | null;
  actual_monthly_executions: number | null;
  workflow_version: string | null;
  last_tested_at: string | null;
  monitoring_state: string | null;
  care_state: string | null;
  go_live_at: string | null;
  offboarded_at: string | null;
  readiness?: { ready: boolean; missing: string[] };
}
interface VendorCost {
  id: string;
  vendor: string;
  service: string;
  purpose: string | null;
  billing_owner: string;
  currency: string;
  fixed_fee: number | null;
  included_allowance: string | null;
  variable_basis: string | null;
  expected_monthly_usage: number | null;
  actual_monthly_usage: number | null;
  renewal_at: string | null;
  status: string;
  notes: string | null;
}

const inputCls = "px-3 py-2 rounded-lg bg-[#0A0D14] border border-[#1F2937] text-white text-sm placeholder:text-[#4B5563]";
const LABEL = "text-[10px] font-semibold uppercase tracking-wider text-[#7C8494] block mb-1";

export default function DeploymentsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [clientId, setClientId] = useState("");
  const [deployments, setDeployments] = useState<Automation[]>([]);
  const [vendorCosts, setVendorCosts] = useState<VendorCost[]>([]);
  const [register, setRegister] = useState<{ elionPaidMonthly: number; clientPaidMonthly: number; warnings: string[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // estimate form
  const [est, setEst] = useState({ scheduledRunsPerDay: "0", webhookRunsPerMonth: "0", messageRunsPerMonth: "0", backgroundRunsPerMonth: "0", retryFactor: "1" });
  const [estResult, setEstResult] = useState<{ estimatedMonthlyExecutions: number; planBand: string; assumptions: string[] } | null>(null);

  // vendor form
  const [vf, setVf] = useState({ vendor: "", service: "", purpose: "", billing_owner: "client", currency: "NGN", fixed_fee: "", included_allowance: "", variable_basis: "" });

  useEffect(() => {
    fetch("/api/admin/clients")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setClients(d.clients || []))
      .catch(() => {});
  }, []);

  const load = (id: string) => {
    if (!id) return;
    setLoading(true);
    setError(null);
    fetch(`/api/admin/deployments?client_id=${encodeURIComponent(id)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Request failed"))))
      .then((d) => {
        setDeployments(d.deployments || []);
        setVendorCosts(d.vendorCosts || []);
        setRegister(d.register || null);
      })
      .catch((e: any) => setError(e.message || "Failed to load"))
      .finally(() => setLoading(false));
  };

  const runEstimate = async () => {
    setBusy(true);
    try {
      const r = await fetch("/api/admin/deployments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "estimate", ...est }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Estimate failed");
      setEstResult(d);
    } catch (e: any) {
      setMsg("Estimate error: " + e.message);
    } finally {
      setBusy(false);
    }
  };

  const updateAutomation = async (automation_id: string, patch: Record<string, unknown>) => {
    setBusy(true);
    try {
      const r = await fetch("/api/admin/deployments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_automation", automation_id, ...patch }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Update failed");
      setMsg("Deployment updated.");
      load(clientId);
    } catch (e: any) {
      setMsg("Update error: " + e.message);
    } finally {
      setBusy(false);
    }
  };

  const addVendor = async () => {
    if (!vf.vendor.trim() || !vf.service.trim()) { alert("Vendor and service are required"); return; }
    setBusy(true);
    try {
      const r = await fetch("/api/admin/deployments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "upsert_vendor",
          client_id: clientId,
          vendor: vf.vendor.trim(),
          service: vf.service.trim(),
          purpose: vf.purpose.trim() || undefined,
          billing_owner: vf.billing_owner,
          currency: vf.currency,
          fixed_fee: vf.fixed_fee ? Number(vf.fixed_fee) : undefined,
          included_allowance: vf.included_allowance.trim() || undefined,
          variable_basis: vf.variable_basis.trim() || undefined,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Save failed");
      setVf({ vendor: "", service: "", purpose: "", billing_owner: "client", currency: "NGN", fixed_fee: "", included_allowance: "", variable_basis: "" });
      load(clientId);
    } catch (e: any) {
      setMsg("Vendor error: " + e.message);
    } finally {
      setBusy(false);
    }
  };

  const deleteVendor = async (id: string) => {
    setBusy(true);
    try {
      const r = await fetch("/api/admin/deployments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete_vendor", vendor_cost_id: id }),
      });
      if (!r.ok) throw new Error("Delete failed");
      load(clientId);
    } catch (e: any) {
      setMsg("Delete error: " + e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0A0D14]">
      <AdminSidebar />
      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-bold text-white">Deployments &amp; Vendor Costs</h1>
              <p className="text-sm text-[#7C8494] mt-1">Client-owned n8n model · who owns, who pays · never finance infrastructure by accident</p>
            </div>
            <select value={clientId} onChange={(e) => { setClientId(e.target.value); load(e.target.value); }} className={inputCls}>
              <option value="">Select client…</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.company_name || c.contact_name || c.email || c.id}</option>
              ))}
            </select>
          </div>

          {error && <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>}
          {msg && <div className="mb-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-300 text-sm">{msg}</div>}

          {!clientId ? (
            <div className="text-center py-20 bg-[#11161F] rounded-xl border border-[#1F2937] text-sm text-[#7C8494]">
              Select a client to see deployment ownership and vendor costs.
            </div>
          ) : loading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 text-[#3B66E8] animate-spin" /></div>
          ) : (
            <div className="space-y-6">
              {/* n8n execution estimate */}
              <div className="rounded-xl bg-[#11161F] border border-[#1F2937] p-4">
                <h3 className="text-sm font-semibold text-white mb-1 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-[#3B66E8]" /> n8n execution estimate</h3>
                <p className="text-xs text-[#7C8494] mb-3">Estimate demand before choosing a plan — never pick a plan from workflow count.</p>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  <div><span className={LABEL}>Schedules/day</span><input type="number" className={inputCls} value={est.scheduledRunsPerDay} onChange={(e) => setEst({ ...est, scheduledRunsPerDay: e.target.value })} /></div>
                  <div><span className={LABEL}>Webhooks/mo</span><input type="number" className={inputCls} value={est.webhookRunsPerMonth} onChange={(e) => setEst({ ...est, webhookRunsPerMonth: e.target.value })} /></div>
                  <div><span className={LABEL}>Messages/mo</span><input type="number" className={inputCls} value={est.messageRunsPerMonth} onChange={(e) => setEst({ ...est, messageRunsPerMonth: e.target.value })} /></div>
                  <div><span className={LABEL}>Background/mo</span><input type="number" className={inputCls} value={est.backgroundRunsPerMonth} onChange={(e) => setEst({ ...est, backgroundRunsPerMonth: e.target.value })} /></div>
                  <div><span className={LABEL}>Retry ×</span><input type="number" step="0.1" className={inputCls} value={est.retryFactor} onChange={(e) => setEst({ ...est, retryFactor: e.target.value })} /></div>
                </div>
                <button onClick={runEstimate} disabled={busy} className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#3B66E8] text-white text-sm font-semibold disabled:opacity-50">
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Estimate
                </button>
                {estResult && (
                  <div className="mt-3 text-xs text-white bg-[#0A0D14] border border-[#1F2937] rounded-lg p-3">
                    ≈ <span className="font-semibold text-[#3B66E8]">{estResult.estimatedMonthlyExecutions.toLocaleString()}</span> executions/month · plan band signal: <span className="font-semibold">{estResult.planBand}</span>
                    <ul className="mt-1 text-[#7C8494] space-y-0.5">
                      {estResult.assumptions.map((a) => <li key={a}>• {a}</li>)}
                    </ul>
                  </div>
                )}
              </div>

              {/* Deployments */}
              <div className="rounded-xl bg-[#11161F] border border-[#1F2937] p-4">
                <h3 className="text-sm font-semibold text-white mb-3">Deployments <span className="text-[#7C8494] font-normal">({deployments.length})</span></h3>
                {deployments.length === 0 ? (
                  <p className="text-xs text-[#4B5563]">No automations deployed for this client yet (use Deploy Systems).</p>
                ) : (
                  <div className="space-y-3">
                    {deployments.map((d) => (
                      <div key={d.id} className="rounded-lg bg-[#0A0D14] border border-[#1F2937] p-3">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="text-sm font-semibold text-white">{d.custom_name || "Automation"}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${d.status === "live" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}>{d.status}</span>
                          {d.readiness && !d.readiness.ready && (
                            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-500/10 text-red-400"><AlertTriangle className="w-3 h-3" /> Not go-live ready</span>
                          )}
                          {d.readiness && d.readiness.ready && (
                            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400"><ShieldCheck className="w-3 h-3" /> Go-live ready</span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                          <div><span className={LABEL}>Billing owner</span>
                            <select className={inputCls} value={d.billing_owner || "client"} onChange={(e) => updateAutomation(d.id, { billing_owner: e.target.value })}>
                              <option value="client">Client</option><option value="elion">ELION</option>
                            </select>
                          </div>
                          <div><span className={LABEL}>ELION access</span>
                            <select className={inputCls} value={d.elion_access_state || "none"} onChange={(e) => updateAutomation(d.id, { elion_access_state: e.target.value })}>
                              <option value="none">None</option><option value="pending">Pending</option><option value="granted">Granted</option><option value="revoked">Revoked</option>
                            </select>
                          </div>
                          <div><span className={LABEL}>Instance ref</span>
                            <input className={inputCls} defaultValue={d.instance_ref || ""} placeholder="n8n URL / workspace id" onBlur={(e) => e.target.value !== (d.instance_ref || "") && updateAutomation(d.id, { instance_ref: e.target.value })} />
                          </div>
                          <div><span className={LABEL}>n8n plan</span>
                            <input className={inputCls} defaultValue={d.n8n_plan || ""} placeholder="e.g. Starter" onBlur={(e) => e.target.value !== (d.n8n_plan || "") && updateAutomation(d.id, { n8n_plan: e.target.value })} />
                          </div>
                          <div><span className={LABEL}>Workflow version</span>
                            <input className={inputCls} defaultValue={d.workflow_version || ""} placeholder="v1.0" onBlur={(e) => e.target.value !== (d.workflow_version || "") && updateAutomation(d.id, { workflow_version: e.target.value })} />
                          </div>
                          <div><span className={LABEL}>Est./Actual exec/mo</span>
                            <div className="flex gap-1">
                              <input type="number" className={inputCls} defaultValue={d.estimated_monthly_executions ?? ""} placeholder="est" onBlur={(e) => updateAutomation(d.id, { estimated_monthly_executions: e.target.value ? Number(e.target.value) : null })} />
                              <input type="number" className={inputCls} defaultValue={d.actual_monthly_executions ?? ""} placeholder="act" onBlur={(e) => updateAutomation(d.id, { actual_monthly_executions: e.target.value ? Number(e.target.value) : null })} />
                            </div>
                          </div>
                          <div><span className={LABEL}>Care / monitoring</span>
                            <div className="flex gap-1">
                              <select className={inputCls} value={d.care_state || "none"} onChange={(e) => updateAutomation(d.id, { care_state: e.target.value })}>
                                <option value="none">No care</option><option value="active">Care active</option><option value="cancelled">Care ended</option>
                              </select>
                              <select className={inputCls} value={d.monitoring_state || "not_monitored"} onChange={(e) => updateAutomation(d.id, { monitoring_state: e.target.value })}>
                                <option value="not_monitored">No monitoring</option><option value="monitoring">Monitoring</option><option value="ended">Ended</option>
                              </select>
                            </div>
                          </div>
                          <div><span className={LABEL}>Last tested / go-live</span>
                            <input type="date" className={inputCls} defaultValue={d.last_tested_at ? d.last_tested_at.slice(0, 10) : ""} onChange={(e) => e.target.value && updateAutomation(d.id, { last_tested_at: e.target.value + "T00:00:00Z" })} />
                          </div>
                        </div>
                        {d.readiness && !d.readiness.ready && (
                          <ul className="mt-2 text-[11px] text-red-400/90 space-y-0.5">
                            {d.readiness.missing.map((m) => <li key={m}>• {m}</li>)}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Vendor costs */}
              <div className="rounded-xl bg-[#11161F] border border-[#1F2937] p-4">
                <h3 className="text-sm font-semibold text-white mb-1">Vendor-cost register</h3>
                {register && (
                  <div className="flex flex-wrap gap-2 my-2 text-xs">
                    <span className="px-2 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30">Client pays ≈ ₦{register.clientPaidMonthly.toLocaleString()}/mo</span>
                    <span className="px-2 py-1 rounded bg-violet-500/10 text-violet-400 border border-violet-500/30">ELION pays ≈ ₦{register.elionPaidMonthly.toLocaleString()}/mo (must be in quote direct cost)</span>
                  </div>
                )}
                {register && register.warnings.map((w) => (
                  <p key={w} className="text-[11px] text-amber-400 mb-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3 shrink-0" /> {w}</p>
                ))}
                <div className="mt-2 overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-left text-[#7C8494] uppercase tracking-wider text-[10px]">
                        <th className="py-1 pr-2">Vendor</th><th className="py-1 pr-2">Service</th><th className="py-1 pr-2">Owner</th><th className="py-1 pr-2">Fee/mo</th><th className="py-1 pr-2">Allowance</th><th className="py-1 pr-2">Basis</th><th className="py-1 pr-2">Usage</th><th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {vendorCosts.map((v) => (
                        <tr key={v.id} className="border-t border-[#1F2937]/60 text-white">
                          <td className="py-1.5 pr-2">{v.vendor}</td>
                          <td className="py-1.5 pr-2">{v.service}</td>
                          <td className="py-1.5 pr-2 capitalize">{v.billing_owner}</td>
                          <td className="py-1.5 pr-2">{v.fixed_fee != null ? "₦" + v.fixed_fee.toLocaleString() : "—"}</td>
                          <td className="py-1.5 pr-2">{v.included_allowance || "—"}</td>
                          <td className="py-1.5 pr-2">{v.variable_basis || "—"}</td>
                          <td className="py-1.5 pr-2">{v.actual_monthly_usage ?? v.expected_monthly_usage ?? "—"}</td>
                          <td className="py-1.5"><button onClick={() => deleteVendor(v.id)} className="text-red-400/70 hover:text-red-300"><Trash2 className="w-3.5 h-3.5" /></button></td>
                        </tr>
                      ))}
                      {vendorCosts.length === 0 && (
                        <tr><td colSpan={8} className="py-2 text-[#4B5563]">No vendors recorded.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2">
                  <input className={inputCls} placeholder="Vendor *" value={vf.vendor} onChange={(e) => setVf({ ...vf, vendor: e.target.value })} />
                  <input className={inputCls} placeholder="Service *" value={vf.service} onChange={(e) => setVf({ ...vf, service: e.target.value })} />
                  <input className={inputCls} placeholder="Purpose" value={vf.purpose} onChange={(e) => setVf({ ...vf, purpose: e.target.value })} />
                  <select className={inputCls} value={vf.billing_owner} onChange={(e) => setVf({ ...vf, billing_owner: e.target.value })}>
                    <option value="client">Client pays</option><option value="elion">ELION pays</option>
                  </select>
                  <input type="number" className={inputCls} placeholder="Fixed fee ₦/mo" value={vf.fixed_fee} onChange={(e) => setVf({ ...vf, fixed_fee: e.target.value })} />
                  <input className={inputCls} placeholder="Included allowance" value={vf.included_allowance} onChange={(e) => setVf({ ...vf, included_allowance: e.target.value })} />
                  <input className={inputCls} placeholder="Variable basis" value={vf.variable_basis} onChange={(e) => setVf({ ...vf, variable_basis: e.target.value })} />
                  <button onClick={addVendor} disabled={busy} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#047857] text-white text-sm font-semibold disabled:opacity-50">
                    {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Add vendor
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}