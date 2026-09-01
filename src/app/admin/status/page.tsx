"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react"

interface SC { id: string; component_name: string; status: string; note: string; sort_order: number; is_visible: boolean; updated_at: string }
const OPTS = ["operational","degraded","partial-outage","major-outage","maintenance","not-configured"]
const LABELS: Record<string,string> = {operational:"Operational",degraded:"Degraded","partial-outage":"Partial Outage","major-outage":"Major Outage",maintenance:"Maintenance","not-configured":"Not Configured"}
const COLORS: Record<string,string> = {operational:"bg-emerald-500",degraded:"bg-amber-500","partial-outage":"bg-amber-500","major-outage":"bg-red-500",maintenance:"bg-zinc-500","not-configured":"bg-zinc-600"}

export default function AdminStatusPage() {
  const [comps, setComps] = useState<SC[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string|null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState("")

  useEffect(() => { fetch("/api/admin/status").then(r=>r.json()).then(d=>{setComps(d.components||[]);setLoading(false)}).catch(()=>setLoading(false)) }, [])

  const updateField = async (comp: SC, field: string, value: any) => {
    setSaving(comp.id)
    const u = {...comp, [field]: value}
    const r = await fetch("/api/admin/status",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:comp.id,status:u.status,note:u.note,is_visible:u.is_visible})})
    if(r.ok) setComps(p=>p.map(c=>c.id===comp.id?u:c))
    setSaving(null)
  }

  const addNew = async () => {
    if(!newName.trim()) return
    const r = await fetch("/api/admin/status",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({component_name:newName.trim(),status:"operational",sort_order:comps.length})})
    if(r.ok){const{component}=await r.json();setComps(p=>[...p,component]);setNewName("");setShowAdd(false)}
  }

  const remove = async (id: string) => {
    if(!confirm("Remove?")) return
    const r = await fetch("/api/admin/status?id="+id,{method:"DELETE"})
    if(r.ok) setComps(p=>p.filter(c=>c.id!==id))
  }

  if(loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 border-2 border-[var(--color-accent)]/30 border-t-[var(--color-accent)] rounded-full animate-spin" /></div>
  const opCount = comps.filter(c=>c.status==="operational").length

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="p-2 rounded-lg hover:bg-[var(--color-surface-raised)]"><ArrowLeft className="w-5 h-5 text-[var(--color-text-muted)]" /></Link>
          <div><h1 className="text-xl font-bold text-[var(--color-text-primary)]" style={{fontFamily:"Space Grotesk,sans-serif"}}>Manage System Status</h1><p className="text-sm text-[var(--color-text-muted)]">{opCount} of {comps.length} operational</p></div>
        </div>
        <button onClick={()=>setShowAdd(!showAdd)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-accent)] text-white text-sm font-semibold"><Plus className="w-4 h-4" /> Add</button>
      </div>
      {showAdd&&<div className="mb-6 p-4 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-accent)]/30"><div className="flex items-center gap-3"><input type="text" value={newName} onChange={e=>setNewName(e.target.value)} placeholder="Component name" className="flex-1 px-3 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-sm" onKeyDown={e=>e.key==="Enter"&&addNew()} /><button onClick={addNew} className="px-4 py-2 rounded-lg bg-[var(--color-accent)] text-white text-sm font-semibold">Add</button><button onClick={()=>setShowAdd(false)} className="px-4 py-2 rounded-lg bg-[var(--color-surface)] text-sm">Cancel</button></div></div>}
      <div className="space-y-2">
        {comps.map(comp=>(
          <div key={comp.id} className="p-4 rounded-xl bg-[var(--color-surface-raised)] border border-[var(--color-border)]">
            <div className="flex items-center justify-between mb-3"><div className="flex items-center gap-3"><span className="text-sm font-medium text-[var(--color-text-primary)]">{comp.component_name}</span>{saving===comp.id&&<Loader2 className="w-3 h-3 text-[var(--color-accent)] animate-spin" />}</div><div className="flex items-center gap-2"><label className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]"><input type="checkbox" checked={comp.is_visible} onChange={e=>updateField(comp,"is_visible",e.target.checked)} className="rounded" /> Visible</label><button onClick={()=>remove(comp.id)} className="p-1 rounded hover:bg-red-500/10 text-[var(--color-text-muted)] hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button></div></div>
            <div className="flex flex-wrap gap-2 mb-3">{OPTS.map(opt=>{const isActive=comp.status===opt;return<button key={opt} onClick={()=>updateField(comp,"status",opt)} className={"inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border "+(isActive?"border-[var(--color-accent)]/30":"border-[var(--color-border)] text-[var(--color-text-muted)]")} style={isActive?{backgroundColor:"rgba(79,124,255,0.15)",color:"var(--color-accent)"}:{}}>{LABELS[opt]}</button>})}</div>
            <input type="text" value={comp.note} onChange={e=>updateField(comp,"note",e.target.value)} placeholder="Note" className="w-full px-3 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-xs" onBlur={()=>updateField(comp,"note",comp.note)} />
          </div>
        ))}
      </div>
      {comps.length===0&&<div className="text-center py-12"><p className="text-sm text-[var(--color-text-muted)]">No components yet.</p></div>}
      <div className="mt-8 p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]"><p className="text-xs text-[var(--color-text-muted)] mb-2">Preview:</p><div className="space-y-1">{comps.filter(c=>c.is_visible).map(c=>(<div key={c.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-[var(--color-surface-raised)]"><span className="text-xs text-[var(--color-text-primary)]">{c.component_name}</span><div className="flex items-center gap-1.5"><div className={"w-2 h-2 rounded-full "+COLORS[c.status]}/><span className="text-[10px] text-[var(--color-text-muted)]">{LABELS[c.status]}</span></div></div>))}</div></div>
    </div>
  )
}