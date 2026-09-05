"use client";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { AdminSidebar } from "@/components/admin/sidebar";
import {
  Plus,
  Loader2,
  X,
  ChevronDown,
  ChevronUp,
  Search,
  Archive,
  RotateCcw,
  Trash2,
  AlertTriangle,
} from "lucide-react";

interface Lead {
  id: string;
  contact_name: string;
  email: string;
  phone: string | null;
  whatsapp: string | null;
  company_name: string | null;
  website: string | null;
  industry: string | null;
  company_size: string | null;
  primary_problem: string | null;
  current_process: string | null;
  desired_outcome: string | null;
  enquiry_channels: string | null;
  lead_status: string;
  audit_status: string | null;
  source: string | null;
  created_at: string;
  updated_at?: string | null;
  archived_at?: string | null;
}

const SC: Record<string, string> = {
  new: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  audited: "bg-violet-500/10 text-violet-400 border border-violet-500/20",
  contacted: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  qualified: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  paid: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  lost: "bg-red-500/10 text-red-400 border border-red-500/20",
  proposal: "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20",
  archived: "bg-[#1F2937]/40 text-[#6B7280] border border-[#1F2937]",
};
// Must match the leads.lead_status CHECK constraint.
const STATUSES = ["new", "audited", "contacted", "qualified", "paid", "lost", "proposal"];

const EMPTY_FORM = {
  contact_name: "",
  email: "",
  phone: "",
  whatsapp: "",
  company_name: "",
  website: "",
  industry: "",
  company_size: "",
  primary_problem: "",
  current_process: "",
  desired_outcome: "",
  enquiry_channels: "",
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [archiveSupported, setArchiveSupported] = useState(false);

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [expanded, setExpanded] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");
  const [showArchived, setShowArchived] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/admin/leads");
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        throw new Error(d.error || `Request failed (${r.status})`);
      }
      const d = await r.json();
      setLeads(d.leads || []);
      setArchiveSupported(d.archiveSupported === true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load leads");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const sources = useMemo(
    () => Array.from(new Set(leads.map((l) => l.source || "direct").filter(Boolean))).sort(),
    [leads]
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = leads;
    if (!showArchived) list = list.filter((l) => !l.archived_at);
    if (statusFilter !== "all") list = list.filter((l) => l.lead_status === statusFilter);
    if (sourceFilter !== "all") list = list.filter((l) => (l.source || "direct") === sourceFilter);
    if (q) {
      list = list.filter((l) =>
        [l.contact_name, l.email, l.phone, l.whatsapp, l.company_name, l.website, l.industry, l.primary_problem, l.source]
          .filter(Boolean)
          .some((v) => (v as string).toLowerCase().includes(q))
      );
    }
    return [...list].sort((a, b) => {
      const diff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return sortDir === "desc" ? -diff : diff;
    });
  }, [leads, query, statusFilter, sourceFilter, sortDir, showArchived]);

  const archivedCount = leads.filter((l) => l.archived_at).length;

  const addLead = async () => {
    if (!form.contact_name || !form.email) return;
    setSaving(true);
    setFormError(null);
    try {
      const r = await fetch("/api/admin/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || `Request failed (${r.status})`);
      setLeads((prev) => [d.lead, ...prev]);
      setForm(EMPTY_FORM);
      setShowAdd(false);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Failed to save lead");
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (id: string, lead_status: string) => {
    setBusyId(id);
    try {
      const r = await fetch("/api/admin/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, lead_status }),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        throw new Error(d.error || "Failed to update status");
      }
      setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, lead_status } : l)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update status");
    } finally {
      setBusyId(null);
    }
  };

  const setArchived = async (id: string, archive: boolean) => {
    setBusyId(id);
    try {
      const r = await fetch("/api/admin/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, archive }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "Archive action failed");
      setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, archived_at: archive ? d.lead?.archived_at || new Date().toISOString() : null } : l)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Archive action failed");
    } finally {
      setBusyId(null);
      setConfirmDelete(null);
    }
  };

  const deleteLead = async (id: string) => {
    setBusyId(id);
    try {
      const r = await fetch("/api/admin/leads", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        throw new Error(d.error || "Delete failed");
      }
      setLeads((prev) => prev.filter((l) => l.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setBusyId(null);
      setConfirmDelete(null);
    }
  };

  const field = (v: string | null | undefined) => v?.trim() || <span className="text-[#4B5563]">Not available</span>;

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[var(--color-surface)]">
        <AdminSidebar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-[#3B66E8] animate-spin" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[var(--color-surface)]">
      <AdminSidebar />
      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">Leads</h1>
            <p className="text-sm text-[#7C8494] mt-1">{visible.length} shown · {leads.length} total{archivedCount ? ` · ${archivedCount} archived` : ""}</p>
          </div>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#3B66E8] text-white text-sm font-semibold hover:bg-[#2F54C4] transition-colors">
          <Plus className="w-4 h-4" /> Add Lead
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-start justify-between gap-3">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400/70 hover:text-red-300"><X className="w-4 h-4" /></button>
        </div>
      )}

      {!archiveSupported && (
        <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs">
          Archive is not available yet : apply <code className="text-amber-300">supabase/migrations/017_lead_archive.sql</code> to enable Archive / Restore.
        </div>
      )}

      {showAdd && (
        <div className="mb-6 p-5 rounded-xl bg-[#11161F] border border-[#3B66E8]/30">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">New Lead</h3>
            <button onClick={() => { setShowAdd(false); setFormError(null); }} className="text-[#7C8494] hover:text-white"><X className="w-4 h-4" /></button>
          </div>
          {formError && <div className="mb-3 p-2 rounded bg-red-500/10 border border-red-500/30 text-red-400 text-xs">{formError}</div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input placeholder="Contact name *" value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} className="px-3 py-2 rounded-lg bg-[#0A0D14] border border-[#1F2937] text-white text-sm" />
            <input placeholder="Email *" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="px-3 py-2 rounded-lg bg-[#0A0D14] border border-[#1F2937] text-white text-sm" />
            <input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="px-3 py-2 rounded-lg bg-[#0A0D14] border border-[#1F2937] text-white text-sm" />
            <input placeholder="WhatsApp" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} className="px-3 py-2 rounded-lg bg-[#0A0D14] border border-[#1F2937] text-white text-sm" />
            <input placeholder="Company" value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} className="px-3 py-2 rounded-lg bg-[#0A0D14] border border-[#1F2937] text-white text-sm" />
            <input placeholder="Website" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} className="px-3 py-2 rounded-lg bg-[#0A0D14] border border-[#1F2937] text-white text-sm" />
            <input placeholder="Industry" value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} className="px-3 py-2 rounded-lg bg-[#0A0D14] border border-[#1F2937] text-white text-sm" />
            <input placeholder="Company size" value={form.company_size} onChange={(e) => setForm({ ...form, company_size: e.target.value })} className="px-3 py-2 rounded-lg bg-[#0A0D14] border border-[#1F2937] text-white text-sm" />
            <input placeholder="Primary problem" value={form.primary_problem} onChange={(e) => setForm({ ...form, primary_problem: e.target.value })} className="px-3 py-2 rounded-lg bg-[#0A0D14] border border-[#1F2937] text-white text-sm sm:col-span-2" />
            <input placeholder="Current process" value={form.current_process} onChange={(e) => setForm({ ...form, current_process: e.target.value })} className="px-3 py-2 rounded-lg bg-[#0A0D14] border border-[#1F2937] text-white text-sm sm:col-span-2" />
            <input placeholder="Desired outcome" value={form.desired_outcome} onChange={(e) => setForm({ ...form, desired_outcome: e.target.value })} className="px-3 py-2 rounded-lg bg-[#0A0D14] border border-[#1F2937] text-white text-sm sm:col-span-2" />
            <input placeholder="Enquiry channels (comma separated)" value={form.enquiry_channels} onChange={(e) => setForm({ ...form, enquiry_channels: e.target.value })} className="px-3 py-2 rounded-lg bg-[#0A0D14] border border-[#1F2937] text-white text-sm sm:col-span-2" />
          </div>
          <button onClick={addLead} disabled={saving || !form.contact_name || !form.email} className="mt-3 flex items-center gap-2 px-4 py-2 rounded-lg bg-[#047857] text-white text-sm font-semibold hover:bg-[#059669] transition-colors disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Save Lead
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className="mb-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7C8494]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, email, company, website, problem…"
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#0A0D14] border border-[#1F2937] text-white text-sm placeholder:text-[#4B5563]"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-lg bg-[#0A0D14] border border-[#1F2937] text-white text-sm"
        >
          <option value="all">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
        </select>
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="px-3 py-2 rounded-lg bg-[#0A0D14] border border-[#1F2937] text-white text-sm"
        >
          <option value="all">All sources</option>
          {sources.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          value={sortDir}
          onChange={(e) => setSortDir(e.target.value as "desc" | "asc")}
          className="px-3 py-2 rounded-lg bg-[#0A0D14] border border-[#1F2937] text-white text-sm"
        >
          <option value="desc">Newest first</option>
          <option value="asc">Oldest first</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-[#9CA3AF] cursor-pointer select-none">
          <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} className="accent-[#3B66E8]" />
          Show archived
        </label>
      </div>

      {visible.length === 0 ? (
        <div className="text-center py-20 bg-[#11161F] rounded-xl border border-[#1F2937]">
          <p className="text-lg font-semibold text-white mb-2">{leads.length === 0 ? "No leads yet" : "No leads match your filters"}</p>
          <p className="text-sm text-[#7C8494] mb-4 max-w-md mx-auto">
            {leads.length === 0
              ? "Run an audit or connect a lead source to start building your pipeline."
              : "Try adjusting the search, status, or source filters."}
          </p>
          {leads.length === 0 ? (
            <Link href="/audit" className="inline-flex items-center gap-2 px-4 py-2 bg-[#3B66E8] text-white text-sm font-semibold rounded-lg hover:bg-[#2F54C4] transition-colors">
              Run an Audit
            </Link>
          ) : (
            <button onClick={() => { setQuery(""); setStatusFilter("all"); setSourceFilter("all"); }} className="inline-flex items-center gap-2 px-4 py-2 bg-[#3B66E8] text-white text-sm font-semibold rounded-lg hover:bg-[#2F54C4] transition-colors">
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {visible.map((lead) => {
            const isArchived = !!lead.archived_at;
            return (
              <div key={lead.id} className={`rounded-xl bg-[#11161F] border border-[#1F2937] p-4 hover:border-[#3B66E8]/30 transition-colors ${isArchived ? "opacity-70" : ""}`}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex-1 min-w-[200px] cursor-pointer" onClick={() => setExpanded(expanded === lead.id ? null : lead.id)}>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-white">{lead.contact_name}</h3>
                      {isArchived && <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${SC.archived}`}>Archived</span>}
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${SC[lead.lead_status] || SC.new}`}>{lead.lead_status.replace("_", " ")}</span>
                      {expanded === lead.id ? <ChevronUp className="w-3 h-3 text-[#7C8494]" /> : <ChevronDown className="w-3 h-3 text-[#7C8494]" />}
                    </div>
                    <p className="text-xs text-[#7C8494] mt-1">{lead.email}{lead.phone ? " · " + lead.phone : ""}{lead.company_name ? ` · ${lead.company_name}` : ""}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <select
                      value={lead.lead_status}
                      onChange={(e) => updateStatus(lead.id, e.target.value)}
                      disabled={busyId === lead.id}
                      className="px-2 py-1 rounded text-[10px] font-semibold uppercase tracking-wider bg-[#0A0D14] border border-[#1F2937] text-white cursor-pointer disabled:opacity-50"
                    >
                      {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                    </select>
                    {archiveSupported && (
                      isArchived ? (
                        <button onClick={() => setArchived(lead.id, false)} disabled={busyId === lead.id} title="Restore lead"
                          className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold bg-[#0A0D14] border border-[#1F2937] text-emerald-400 hover:border-emerald-500/40 disabled:opacity-50">
                          <RotateCcw className="w-3 h-3" /> Restore
                        </button>
                      ) : (
                        <button onClick={() => setArchived(lead.id, true)} disabled={busyId === lead.id} title="Archive lead (keeps history, hides from default list)"
                          className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold bg-[#0A0D14] border border-[#1F2937] text-[#9CA3AF] hover:border-amber-500/40 hover:text-amber-400 disabled:opacity-50">
                          <Archive className="w-3 h-3" /> Archive
                        </button>
                      )
                    )}
                    {confirmDelete === lead.id ? (
                      <span className="flex items-center gap-2 px-2 py-1 rounded bg-red-500/10 border border-red-500/30">
                        <AlertTriangle className="w-3 h-3 text-red-400" />
                        <button onClick={() => deleteLead(lead.id)} disabled={busyId === lead.id} className="text-[10px] font-semibold text-red-400 hover:text-red-300">Delete forever?</button>
                        <button onClick={() => setConfirmDelete(null)} className="text-[10px] text-[#7C8494] hover:text-white">Cancel</button>
                      </span>
                    ) : (
                      <button onClick={() => setConfirmDelete(lead.id)} title="Permanently delete lead (irreversible)"
                        className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold bg-[#0A0D14] border border-[#1F2937] text-[#9CA3AF] hover:border-red-500/40 hover:text-red-400">
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    )}
                  </div>
                </div>
                {expanded === lead.id && (
                  <div className="mt-3 pt-3 border-t border-[#1F2937] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                    <div><span className="text-[#7C8494] block mb-0.5">Contact</span><span className="text-white">{lead.contact_name}</span></div>
                    <div><span className="text-[#7C8494] block mb-0.5">Email</span><span className="text-white break-all">{field(lead.email)}</span></div>
                    <div><span className="text-[#7C8494] block mb-0.5">Phone</span><span className="text-white">{field(lead.phone)}</span></div>
                    <div><span className="text-[#7C8494] block mb-0.5">WhatsApp</span><span className="text-white">{field(lead.whatsapp)}</span></div>
                    <div><span className="text-[#7C8494] block mb-0.5">Company</span><span className="text-white">{field(lead.company_name)}</span></div>
                    <div><span className="text-[#7C8494] block mb-0.5">Website</span>{lead.website ? <a href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`} target="_blank" rel="noopener noreferrer" className="text-[#3B66E8] hover:underline break-all">{lead.website}</a> : <span className="text-[#4B5563]">Not available</span>}</div>
                    <div><span className="text-[#7C8494] block mb-0.5">Industry</span><span className="text-white">{field(lead.industry)}</span></div>
                    <div><span className="text-[#7C8494] block mb-0.5">Company size</span><span className="text-white">{field(lead.company_size)}</span></div>
                    <div><span className="text-[#7C8494] block mb-0.5">Source</span><span className="text-white">{field(lead.source || "direct")}</span></div>
                    <div className="sm:col-span-2 lg:col-span-2"><span className="text-[#7C8494] block mb-0.5">Primary problem</span><span className="text-white">{field(lead.primary_problem)}</span></div>
                    <div className="sm:col-span-2 lg:col-span-2"><span className="text-[#7C8494] block mb-0.5">Current process</span><span className="text-white">{field(lead.current_process)}</span></div>
                    <div className="sm:col-span-2 lg:col-span-2"><span className="text-[#7C8494] block mb-0.5">Desired outcome</span><span className="text-white">{field(lead.desired_outcome)}</span></div>
                    <div className="sm:col-span-2 lg:col-span-2"><span className="text-[#7C8494] block mb-0.5">Enquiry channels</span><span className="text-white">{field(lead.enquiry_channels)}</span></div>
                    <div><span className="text-[#7C8494] block mb-0.5">Audit status</span><span className="text-white">{field(lead.audit_status)}</span></div>
                    <div><span className="text-[#7C8494] block mb-0.5">Created</span><span className="text-white">{new Date(lead.created_at).toLocaleDateString("en-NG", { timeZone: "Africa/Lagos", year: "numeric", month: "short", day: "numeric" })}</span></div>
                    {lead.archived_at && <div><span className="text-[#7C8494] block mb-0.5">Archived</span><span className="text-white">{new Date(lead.archived_at).toLocaleDateString("en-NG", { timeZone: "Africa/Lagos", year: "numeric", month: "short", day: "numeric" })}</span></div>}
                    <div><span className="text-[#7C8494] block mb-0.5">Lead ID</span><span className="text-[#4B5563] break-all">{lead.id}</span></div>
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