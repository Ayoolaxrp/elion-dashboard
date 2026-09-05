"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { ArrowLeft, Loader2, Plus, Trash2, ChevronDown, ChevronRight, Activity, AlertTriangle } from "lucide-react"

interface SC { id: string; component_name: string; status: string; note: string; sort_order: number; is_visible: boolean; updated_at: string }
interface Upd { id: string; incident_id: string; status: string; message: string | null; created_at: string }
interface Inc { id: string; title: string; status: string; message: string | null; components_affected: string[] | null; created_at: string; resolved_at: string | null; updates: Upd[] }

const OPTS = ["operational", "degraded", "partial-outage", "major-outage", "maintenance", "not-configured"]
const LABELS: Record<string, string> = { operational: "Operational", degraded: "Degraded", "partial-outage": "Partial Outage", "major-outage": "Major Outage", maintenance: "Maintenance", "not-configured": "Not Configured" }
const COLORS: Record<string, string> = { operational: "bg-emerald-500", degraded: "bg-amber-500", "partial-outage": "bg-amber-500", "major-outage": "bg-red-500", maintenance: "bg-zinc-500", "not-configured": "bg-zinc-600" }

const PHASES = ["investigating", "identified", "monitoring", "resolved"]
const PHASE_LABEL: Record<string, string> = { investigating: "Investigating", identified: "Identified", monitoring: "Monitoring", resolved: "Resolved" }
const PHASE_BADGE: Record<string, string> = {
  investigating: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  identified: "bg-orange-500/10 text-orange-400 border-orange-500/30",
  monitoring: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  resolved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
}

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", { timeZone: "Africa/Lagos", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })

export default function AdminStatusPage() {
  const [comps, setComps] = useState<SC[]>([])
  const [incs, setIncs] = useState<Inc[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState("")

  // Incident state
  const [showInc, setShowInc] = useState(false)
  const [incTitle, setIncTitle] = useState("")
  const [incMsg, setIncMsg] = useState("")
  const [incComps, setIncComps] = useState<string[]>([])
  const [incPhase, setIncPhase] = useState("investigating")
  const [incBusy, setIncBusy] = useState(false)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [updateOpen, setUpdateOpen] = useState<Record<string, boolean>>({})
  const [updPhase, setUpdPhase] = useState<Record<string, string>>({})
  const [updMsg, setUpdMsg] = useState<Record<string, string>>({})
  const [updBusy, setUpdBusy] = useState<string | null>(null)
  const [err, setErr] = useState("")

  const load = useCallback(() => {
    Promise.all([
      fetch("/api/admin/status").then((r) => r.json()),
      fetch("/api/admin/incidents").then((r) => r.json()),
    ])
      .then(([cRes, iRes]) => {
        setComps(cRes.components || [])
        setIncs(iRes.incidents || [])
      })
      .catch(() => { /* network/parse error -> leave lists empty */ })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const updateField = async (comp: SC, field: string, value: string | boolean) => {
    setSaving(comp.id)
    setErr("")
    const u = { ...comp, [field]: value }
    const r = await fetch("/api/admin/status", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: comp.id, status: u.status, note: u.note, is_visible: u.is_visible }),
    })
    if (!r.ok) { setErr("Could not save component : " + (await r.json()).error); setSaving(null); return }
    setComps((p) => p.map((c) => (c.id === comp.id ? u : c)))
    setSaving(null)
  }

  const addNew = async () => {
    if (!newName.trim()) return
    setErr("")
    const r = await fetch("/api/admin/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ component_name: newName.trim(), status: "operational", sort_order: comps.length }),
    })
    if (!r.ok) { setErr("Could not add component"); return }
    const { component } = await r.json()
    setComps((p) => [...p, component])
    setNewName("")
    setShowAdd(false)
  }

  const remove = async (id: string) => {
    if (!confirm("Remove component? Its history will be deleted.")) return
    const r = await fetch("/api/admin/status?id=" + id, { method: "DELETE" })
    if (r.ok) setComps((p) => p.filter((c) => c.id !== id))
  }

  const toggleComp = (id: string) => {
    setIncComps((p) => (p.includes(id) ? p.filter((c) => c !== id) : [...p, id]))
  }

  const createIncident = async () => {
    if (!incTitle.trim()) return
    setIncBusy(true); setErr("")
    const r = await fetch("/api/admin/incidents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: incTitle.trim(), message: incMsg.trim() || null, status: incPhase, components_affected: incComps }),
    })
    setIncBusy(false)
    if (!r.ok) { setErr("Could not create incident"); return }
    setIncTitle(""); setIncMsg(""); setIncComps([]); setIncPhase("investigating"); setShowInc(false)
    load()
  }

  const postUpdate = async (inc: Inc) => {
    const phase = updPhase[inc.id] || inc.status
    setUpdBusy(inc.id); setErr("")
    const r = await fetch("/api/admin/incidents", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: inc.id, status: phase, message: (updMsg[inc.id] || "").trim() || null }),
    })
    setUpdBusy(null)
    if (!r.ok) { setErr("Could not post update"); return }
    setUpdMsg((p) => ({ ...p, [inc.id]: "" }))
    setUpdateOpen((p) => ({ ...p, [inc.id]: false }))
    load()
  }

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-[var(--color-accent)] animate-spin" /></div>

  const opCount = comps.filter((c) => c.status === "operational").length
  const openInc = incs.filter((i) => i.status !== "resolved").length

  return (
    <div className="max-w-4xl mx-auto p-6 pb-24">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="p-2 rounded-lg hover:bg-[var(--color-surface-raised)]"><ArrowLeft className="w-5 h-5 text-[var(--color-text-muted)]" /></Link>
          <div>
            <h1 className="text-xl font-bold text-[var(--color-text-primary)]" style={{ fontFamily: "Space Grotesk,sans-serif" }}>System Status</h1>
            <p className="text-sm text-[var(--color-text-muted)]">{opCount} of {comps.length} components operational · {openInc} open incident{openInc === 1 ? "" : "s"} · <Link href="/status" className="text-[var(--color-accent)] hover:underline">View public page</Link></p>
          </div>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-accent)] text-white text-sm font-semibold"><Plus className="w-4 h-4" /> Component</button>
      </div>

      {err && <div className="mb-6 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400">{err}</div>}

      {showAdd && (
        <div className="mb-6 p-4 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-accent)]/30">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Component name : only add user-facing services" className="flex-1 px-3 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-sm" onKeyDown={(e) => e.key === "Enter" && addNew()} />
            <div className="flex gap-2">
              <button onClick={addNew} className="px-4 py-2 rounded-lg bg-[var(--color-accent)] text-white text-sm font-semibold">Add</button>
              <button onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-lg bg-[var(--color-surface)] text-sm">Cancel</button>
            </div>
          </div>
          <p className="text-xs text-[var(--color-text-muted)] mt-2">Only components you add here (with &quot;Visible&quot; on) appear on the public /status page. Internal infrastructure stays admin-only.</p>
        </div>
      )}

      {/* Components */}
      <h2 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">Components</h2>
      <div className="space-y-2 mb-10">
        {comps.map((comp) => (
          <div key={comp.id} className="p-4 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className={`w-2 h-2 rounded-full ${COLORS[comp.status]} ${comp.status === "operational" ? "" : "animate-pulse"}`} />
                <span className="text-sm font-medium text-[var(--color-text-primary)]">{comp.component_name}</span>
                {saving === comp.id && <Loader2 className="w-3 h-3 text-[var(--color-accent)] animate-spin" />}
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]"><input type="checkbox" checked={comp.is_visible} onChange={(e) => updateField(comp, "is_visible", e.target.checked)} className="rounded" /> Public</label>
                <button onClick={() => remove(comp.id)} className="p-1 rounded hover:bg-red-500/10 text-[var(--color-text-muted)] hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              {OPTS.map((opt) => {
                const isActive = comp.status === opt
                return (
                  <button key={opt} onClick={() => updateField(comp, "status", opt)}
                    className={"inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all " + (isActive ? "border-[var(--color-accent)]/30" : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-border)]/80")}
                    style={isActive ? { backgroundColor: "rgba(79,124,255,0.15)", color: "var(--color-accent)" } : {}}>
                    {LABELS[opt]}
                  </button>
                )
              })}
            </div>
            <input type="text" value={comp.note} onChange={(e) => updateField(comp, "note", e.target.value)} placeholder="Note (visible on the public page)" className="w-full px-3 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-xs" />
          </div>
        ))}
        {comps.length === 0 && <div className="text-center py-10 text-sm text-[var(--color-text-muted)]">No components yet.</div>}
      </div>

      {/* Incidents */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wider flex items-center gap-2"><Activity className="w-4 h-4" /> Incidents</h2>
        <button onClick={() => setShowInc(!showInc)} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-xs font-semibold text-[var(--color-text-primary)] hover:border-[var(--color-accent)]/40">
          {showInc ? <ChevronDown className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />} New incident
        </button>
      </div>

      {showInc && (
        <div className="mb-6 p-4 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-accent)]/30">
          <div className="space-y-3">
            <div>
              <label className="text-xs text-[var(--color-text-muted)] mb-1 block">Title</label>
              <input type="text" value={incTitle} onChange={(e) => setIncTitle(e.target.value)} placeholder="e.g. Audit tool returning errors" className="w-full px-3 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-sm" />
            </div>
            <div>
              <label className="text-xs text-[var(--color-text-muted)] mb-1 block">Initial update (optional)</label>
              <textarea value={incMsg} onChange={(e) => setIncMsg(e.target.value)} rows={2} placeholder="What are you seeing?" className="w-full px-3 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-sm resize-none" />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-[var(--color-text-muted)]">Affected components:</span>
              {comps.map((c) => (
                <button key={c.id} onClick={() => toggleComp(c.id)}
                  className={"px-2.5 py-1 rounded-md text-[11px] font-medium border transition-all " + (incComps.includes(c.id) ? "border-[var(--color-accent)]/40" : "border-[var(--color-border)] text-[var(--color-text-muted)]")}
                  style={incComps.includes(c.id) ? { backgroundColor: "rgba(79,124,255,0.12)", color: "var(--color-accent)" } : {}}>
                  {c.component_name}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              {PHASES.map((ph) => (
                <button key={ph} onClick={() => setIncPhase(ph)}
                  className={"px-3 py-1.5 rounded-lg text-xs font-medium border " + (incPhase === ph ? PHASE_BADGE[ph] : "border-[var(--color-border)] text-[var(--color-text-muted)]")}>
                  {PHASE_LABEL[ph]}
                </button>
              ))}
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={createIncident} disabled={incBusy || !incTitle.trim()} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-accent)] text-white text-sm font-semibold disabled:opacity-50">
                {incBusy && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Create incident
              </button>
              <button onClick={() => setShowInc(false)} className="px-4 py-2 rounded-lg bg-[var(--color-surface)] text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {incs.map((inc) => {
          const isOpen = expanded[inc.id]
          const showUpd = updateOpen[inc.id]
          return (
            <div key={inc.id} className="rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)] overflow-hidden">
              <button onClick={() => setExpanded((p) => ({ ...p, [inc.id]: !p[inc.id] }))} className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-[var(--color-surface)]/40 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  {isOpen ? <ChevronDown className="w-4 h-4 shrink-0 text-[var(--color-text-muted)]" /> : <ChevronRight className="w-4 h-4 shrink-0 text-[var(--color-text-muted)]" />}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">{inc.title}</p>
                    <p className="text-[11px] text-[var(--color-text-muted)]">{fmtTime(inc.created_at)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {inc.components_affected && inc.components_affected.length > 0 && (
                    <span className="hidden sm:inline text-[10px] text-[var(--color-text-muted)]">{inc.components_affected.length} comp</span>
                  )}
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide border ${PHASE_BADGE[inc.status] || PHASE_BADGE.investigating}`}>{PHASE_LABEL[inc.status] || inc.status}</span>
                </div>
              </button>

              {isOpen && (
                <div className="px-4 pb-4 border-t border-[var(--color-border)] pt-3">
                  {inc.components_affected && inc.components_affected.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {inc.components_affected.map((c) => (
                        <span key={c} className="px-2 py-0.5 rounded-md bg-[var(--color-surface)] border border-[var(--color-border)] text-[10px] text-[var(--color-text-muted)]">{c}</span>
                      ))}
                    </div>
                  )}
                  <div className="space-y-2 mb-4 border-l border-[var(--color-border)] ml-1.5 pl-4">
                    {inc.updates.length === 0 ? (
                      <p className="text-xs text-[var(--color-text-muted)]">{inc.message || "No updates yet."}</p>
                    ) : (
                      inc.updates.map((u) => (
                        <div key={u.id} className="relative">
                          <span className={`absolute -left-[21.5px] top-1.5 w-2 h-2 rounded-full ${u.status === "resolved" ? "bg-emerald-500" : u.status === "monitoring" ? "bg-blue-500" : u.status === "identified" ? "bg-orange-500" : "bg-amber-400"}`} />
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide border ${PHASE_BADGE[u.status] || PHASE_BADGE.investigating}`}>{PHASE_LABEL[u.status] || u.status}</span>
                            <span className="text-[10px] text-[var(--color-text-muted)] tabular-nums">{fmtTime(u.created_at)}</span>
                          </div>
                          {u.message && <p className="text-xs text-[var(--color-text-secondary)] mt-1">{u.message}</p>}
                        </div>
                      ))
                    )}
                  </div>

                  {showUpd ? (
                    <div className="p-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)]">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        {PHASES.map((ph) => (
                          <button key={ph} onClick={() => setUpdPhase((p) => ({ ...p, [inc.id]: ph }))}
                            className={"px-2.5 py-1 rounded-md text-[11px] font-medium border " + ((updPhase[inc.id] || inc.status) === ph ? PHASE_BADGE[ph] : "border-[var(--color-border)] text-[var(--color-text-muted)]")}>
                            {PHASE_LABEL[ph]}
                          </button>
                        ))}
                      </div>
                      <textarea value={updMsg[inc.id] || ""} onChange={(e) => setUpdMsg((p) => ({ ...p, [inc.id]: e.target.value }))} rows={2} placeholder="Update message" className="w-full px-3 py-2 rounded-lg bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-xs resize-none mb-2" />
                      <div className="flex gap-2">
                        <button onClick={() => postUpdate(inc)} disabled={updBusy === inc.id} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--color-accent)] text-white text-xs font-semibold disabled:opacity-50">
                          {updBusy === inc.id && <Loader2 className="w-3 h-3 animate-spin" />} Post update
                        </button>
                        <button onClick={() => setUpdateOpen((p) => ({ ...p, [inc.id]: false }))} className="px-3 py-1.5 rounded-lg bg-[var(--color-surface-raised)] text-xs">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => { setUpdateOpen((p) => ({ ...p, [inc.id]: true })); setUpdPhase((p) => ({ ...p, [inc.id]: inc.status })) }} className="inline-flex items-center gap-1.5 text-xs text-[var(--color-accent)] hover:underline">
                      <AlertTriangle className="w-3.5 h-3.5" /> Post status update
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
        {incs.length === 0 && (
          <div className="text-center py-10 rounded-xl border border-dashed border-[var(--color-border)]">
            <p className="text-sm text-[var(--color-text-muted)]">No incidents recorded.</p>
            <p className="text-xs text-[var(--color-text-muted)]/70 mt-1">Create one above : it will appear on the public page with a full Investigating → Resolved timeline.</p>
          </div>
        )}
      </div>

      <div className="mt-8 p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]">
        <p className="text-xs text-[var(--color-text-muted)] mb-2 flex items-center gap-1.5"><Activity className="w-3.5 h-3.5" /> Public page preview (visible components only)</p>
        <div className="space-y-1">
          {comps.filter((c) => c.is_visible && c.status !== "not-configured").map((c) => (
            <div key={c.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-[var(--color-surface-raised)]">
              <span className="text-xs text-[var(--color-text-primary)]">{c.component_name}</span>
              <div className="flex items-center gap-1.5">
                <div className={"w-2 h-2 rounded-full " + COLORS[c.status]} />
                <span className="text-[10px] text-[var(--color-text-muted)]">{LABELS[c.status]}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
