"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Loader2, X, ChevronDown, ChevronUp } from "lucide-react";

interface Lead { id: string; contact_name: string; email: string; phone: string | null; company_name: string | null; website: string | null; industry: string | null; primary_problem: string | null; lead_status: string; source: string | null; created_at: string; }
const SC: Record<string, string> = { new: "bg-blue-500/10 text-blue-400 border border-blue-500/20", audited: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20", contacted: "bg-amber-500/10 text-amber-400 border border-amber-500/20", qualified: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20", paid: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20", lost: "bg-red-500/10 text-red-400 border border-red-500/20" };
const STATUSES = ["new", "audited", "contacted", "qualified", "paid", "lost"];

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ contact_name: "", email: "", phone: "", company_name: "", website: "", industry: "", primary_problem: "" });
  const [saving, setSaving] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = () => { fetch("/api/admin/leads").then(r => r.json()).then(d => { setLeads(d.leads || []); setLoading(false); }).catch(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const addLead = async () => {
    if (!form.contact_name || !form.email) return;
    setSaving(true);
    const r = await fetch("/api/admin/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (r.ok) { const d = await r.json(); setLeads([d.lead, ...leads]); setForm({ contact_name: "", email: "", phone: "", company_name: "", website: "", industry: "", primary_problem: "" }); setShowAdd(false); }
    setSaving(false);
  };

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id);
    await fetch("/api/admin/leads", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, lead_status: status }) });
    setLeads(leads.map(l => l.id === id ? { ...l, lead_status: status } : l));
    setUpdating(null);
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-[#4F7CFF] animate-spin" /></div>;

  return (
    <div className="">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="text-[#9CA3AF] hover:text-white"><ArrowLeft className="w-4 h-4" /></Link>
            <div><h1 className="text-2xl font-bold text-white">Leads</h1><p className="text-sm text-[#6B7280] mt-1">{leads.length} total leads</p></div>
          </div>
          <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#4F7CFF] text-white text-sm font-semibold hover:bg-[#3B66E8] transition-colors">
            <Plus className="w-4 h-4" /> Add Lead
          </button>
        </div>

        {showAdd && (
          <div className="mb-6 p-5 rounded-xl bg-[#11161F] border border-[#4F7CFF]/30">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">New Lead</h3>
              <button onClick={() => setShowAdd(false)} className="text-[#6B7280] hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input placeholder="Contact name *" value={form.contact_name} onChange={e => setForm({...form, contact_name: e.target.value})} className="px-3 py-2 rounded-lg bg-[#0A0D14] border border-[#1F2937] text-white text-sm" />
              <input placeholder="Email *" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="px-3 py-2 rounded-lg bg-[#0A0D14] border border-[#1F2937] text-white text-sm" />
              <input placeholder="Phone" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="px-3 py-2 rounded-lg bg-[#0A0D14] border border-[#1F2937] text-white text-sm" />
              <input placeholder="Company" value={form.company_name} onChange={e => setForm({...form, company_name: e.target.value})} className="px-3 py-2 rounded-lg bg-[#0A0D14] border border-[#1F2937] text-white text-sm" />
              <input placeholder="Website" value={form.website} onChange={e => setForm({...form, website: e.target.value})} className="px-3 py-2 rounded-lg bg-[#0A0D14] border border-[#1F2937] text-white text-sm" />
              <input placeholder="Industry" value={form.industry} onChange={e => setForm({...form, industry: e.target.value})} className="px-3 py-2 rounded-lg bg-[#0A0D14] border border-[#1F2937] text-white text-sm" />
              <input placeholder="Primary problem" value={form.primary_problem} onChange={e => setForm({...form, primary_problem: e.target.value})} className="px-3 py-2 rounded-lg bg-[#0A0D14] border border-[#1F2937] text-white text-sm sm:col-span-2" />
            </div>
            <button onClick={addLead} disabled={saving || !form.contact_name || !form.email} className="mt-3 flex items-center gap-2 px-4 py-2 rounded-lg bg-[#10B981] text-white text-sm font-semibold hover:bg-[#059669] transition-colors disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Save Lead
            </button>
          </div>
        )}

        {leads.length === 0 ? (
          <div className="text-center py-20 bg-[#11161F] rounded-xl border border-[#1F2937]">
            <p className="text-lg font-semibold text-white mb-2">No leads yet</p>
            <p className="text-sm text-[#6B7280] mb-4">Add your first lead or wait for funnel submissions.</p>
            <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-[#4F7CFF] text-white text-sm font-semibold rounded-lg hover:bg-[#3B66E8]"><Plus className="w-4 h-4" /> Add Lead</button>
          </div>
        ) : (
          <div className="space-y-2">
            {leads.map(lead => (
              <div key={lead.id} className="rounded-xl bg-[#11161F] border border-[#1F2937] p-4 hover:border-[#4F7CFF]/30 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1 cursor-pointer" onClick={() => setExpanded(expanded === lead.id ? null : lead.id)}>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-white">{lead.contact_name}</h3>
                      {expanded === lead.id ? <ChevronUp className="w-3 h-3 text-[#6B7280]" /> : <ChevronDown className="w-3 h-3 text-[#6B7280]" />}
                    </div>
                    <p className="text-xs text-[#6B7280]">{lead.email}{lead.phone ? " · " + lead.phone : ""}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select value={lead.lead_status} onChange={e => updateStatus(lead.id, e.target.value)} disabled={updating === lead.id}
                      className="px-2 py-1 rounded text-[10px] font-semibold uppercase tracking-wider bg-[#0A0D14] border border-[#1F2937] text-white cursor-pointer">
                      {STATUSES.map(s => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                    </select>
                  </div>
                </div>
                {expanded === lead.id && (
                  <div className="mt-3 pt-3 border-t border-[#1F2937] grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    {lead.company_name && <div><span className="text-[#6B7280]">Company:</span> <span className="text-white">{lead.company_name}</span></div>}
                    {lead.website && <div><span className="text-[#6B7280]">Website:</span> <span className="text-white">{lead.website}</span></div>}
                    {lead.industry && <div><span className="text-[#6B7280]">Industry:</span> <span className="text-white">{lead.industry}</span></div>}
                    {lead.primary_problem && <div className="sm:col-span-2"><span className="text-[#6B7280]">Problem:</span> <span className="text-white">{lead.primary_problem}</span></div>}
                    <div><span className="text-[#6B7280]">Source:</span> <span className="text-white">{lead.source || "direct"}</span></div>
                    <div><span className="text-[#6B7280]">Created:</span> <span className="text-white">{new Date(lead.created_at).toLocaleDateString("en-NG", { timeZone: "Africa/Lagos" })}</span></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
