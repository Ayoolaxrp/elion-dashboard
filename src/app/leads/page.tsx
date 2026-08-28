"use client";
import { useState, useCallback } from "react";
import { Zap, Plus, Send, Clock, CheckCircle, Download, Eye, MessageSquare, UserPlus, FileSpreadsheet, Play } from "lucide-react";
import { PageHeader, Card, Badge, Button, Input, Select, DataTable, Modal, Tabs, StatCard, SearchBar } from "@/components/ui";
import { WorkflowVisualizer, WorkflowDefinition } from "@/components/workflow-visualizer";

interface Lead { id: string; name: string; email: string; phone: string; source: string; company: string; role: string; status: "new" | "qualified" | "contacted" | "meeting" | "won" | "lost"; responseTime: string; score: number; createdAt: string; notes: string; }

const leadResponseFlow: WorkflowDefinition = {
  id: "lead-response", name: "Lead Response Pipeline",
  nodes: [
    { id: "capture", label: "Lead Captured", type: "trigger", description: "Form/Meta/WhatsApp", duration: 800 },
    { id: "score", label: "AI Lead Scoring", type: "action", description: "Score 0-100", duration: 1000 },
    { id: "respond", label: "Instant Response", type: "action", description: "WhatsApp/Email", duration: 900 },
    { id: "qualify", label: "Auto-Qualify", type: "condition", description: "Score > 60?", duration: 1200 },
    { id: "assign", label: "Assign to Sales", type: "action", description: "Round-robin", duration: 800 },
    { id: "followup", label: "Schedule Follow-Up", type: "action", description: "Calendar + reminder", duration: 700 },
    { id: "notify", label: "Notify Team", type: "output", description: "Slack/Email", duration: 600 },
  ],
  edges: [
    { from: "capture", to: "score" }, { from: "score", to: "respond" },
    { from: "respond", to: "qualify" }, { from: "qualify", to: "assign" },
    { from: "assign", to: "followup" }, { from: "followup", to: "notify" },
  ],
};

const statusColors: Record<string, "default" | "success" | "warning" | "danger" | "info" | "outline"> = { new: "info", qualified: "success", contacted: "warning", meeting: "success", won: "success", lost: "danger" };
const statusFlow: Array<"new" | "qualified" | "contacted" | "meeting" | "won" | "lost"> = ["new", "qualified", "contacted", "meeting", "won", "lost"];

const initialLeads: Lead[] = [
  { id: "1", name: "Adebayo Johnson", email: "adebayo@techcorp.ng", phone: "+234 801 234 5678", source: "Meta Ads", company: "TechCorp Nigeria", role: "CTO", status: "qualified", responseTime: "2s", score: 92, createdAt: "2026-08-27 10:23", notes: "Interested in lead response system" },
  { id: "2", name: "Chioma Okafor", email: "chioma@realestate.com", phone: "+234 802 345 6789", source: "Website", company: "Premier Realty", role: "Head of Sales", status: "meeting", responseTime: "3s", score: 87, createdAt: "2026-08-27 09:45", notes: "Real estate lead conversion demo scheduled" },
  { id: "3", name: "Emeka Nwosu", email: "emeka@fintech.io", phone: "+234 803 456 7890", source: "WhatsApp", company: "PayFlow Africa", role: "VP Engineering", status: "contacted", responseTime: "1s", score: 78, createdAt: "2026-08-27 08:12", notes: "Waiting for callback" },
  { id: "4", name: "Funke Adeyemi", email: "funke@clinic.ng", phone: "+234 804 567 8901", source: "Landing Page", company: "Wellness Clinic", role: "Operations Manager", status: "new", responseTime: "—", score: 65, createdAt: "2026-08-26 16:30", notes: "" },
  { id: "5", name: "Gideon Mensah", email: "gideon@logistics.com", phone: "+233 24 567 8901", source: "Instagram", company: "Swift Logistics", role: "Managing Director", status: "won", responseTime: "4s", score: 95, createdAt: "2026-08-26 14:15", notes: "Signed up for Growth plan" },
  { id: "6", name: "Halima Bello", email: "halima@edu.ng", phone: "+234 805 678 9012", source: "Referral", company: "Bright Academy", role: "Principal", status: "qualified", responseTime: "2s", score: 82, createdAt: "2026-08-26 11:00", notes: "Referred by Gideon" },
  { id: "7", name: "Ibrahim Yusuf", email: "ibrahim@trade.ng", phone: "+234 806 789 0123", source: "Meta Ads", company: "TradeZone", role: "Head of Growth", status: "new", responseTime: "—", score: 58, createdAt: "2026-08-25 09:30", notes: "" },
  { id: "8", name: "Janet Okonkwo", email: "janet@salon.com", phone: "+234 807 890 1234", source: "Website", company: "Glamour Salon", role: "Owner", status: "lost", responseTime: "5s", score: 45, createdAt: "2026-08-25 08:00", notes: "Went with competitor" },
];

function generateScore(): number { return Math.floor(Math.random() * 40) + 55; }

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [showIntake, setShowIntake] = useState(false);
  const [showLeadDetail, setShowLeadDetail] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "", role: "", source: "website", message: "" });
  const [formError, setFormError] = useState("");
  const [notif, setNotif] = useState("");
  const [showFlow, setShowFlow] = useState(false);

  const showNotification = (msg: string) => { setNotif(msg); setTimeout(() => setNotif(""), 3000); };

  const addLead = useCallback(() => {
    if (!form.name.trim() || !form.email.trim()) { setFormError("Name and email are required"); return; }
    setFormError("");
    const now = new Date();
    const ts = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const newLead: Lead = { id: String(Date.now()), name: form.name, email: form.email, phone: form.phone, company: form.company, role: form.role, source: form.source.charAt(0).toUpperCase() + form.source.slice(1), status: "new", responseTime: "—", score: generateScore(), createdAt: ts, notes: form.message };
    setLeads((prev) => [newLead, ...prev]);
    setForm({ name: "", email: "", phone: "", company: "", role: "", source: "website", message: "" });
    setShowIntake(false);
    showNotification(`Lead "${newLead.name}" added! Response system will auto-qualify.`);
  }, [form]);

  const advanceLead = (leadId: string) => {
    setLeads((prev) => prev.map((l) => { if (l.id !== leadId) return l; const idx = statusFlow.indexOf(l.status); return idx < statusFlow.length - 2 ? { ...l, status: statusFlow[idx + 1] } : l; }));
    showNotification("Lead advanced to next stage!");
  };

  const setLeadStatus = (leadId: string, status: Lead["status"]) => { setLeads((prev) => prev.map((l) => l.id === leadId ? { ...l, status } : l)); };

  const exportCSV = () => {
    const headers = "Name,Email,Phone,Company,Role,Source,Status,Score,Created\n";
    const rows = leads.map((l) => `"${l.name}","${l.email}","${l.phone}","${l.company}","${l.role}","${l.source}","${l.status}",${l.score},"${l.createdAt}"`).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `leads-export-${new Date().toISOString().split("T")[0]}.csv`; a.click();
    URL.revokeObjectURL(url);
    showNotification(`Exported ${leads.length} leads to CSV`);
  };

  const openDetail = (lead: Lead) => { setSelectedLead(lead); setShowLeadDetail(true); };

  const filtered = leads.filter((l) => {
    const ms = !search || l.name.toLowerCase().includes(search.toLowerCase()) || l.email.toLowerCase().includes(search.toLowerCase()) || l.company.toLowerCase().includes(search.toLowerCase());
    const mt = activeTab === "all" || (activeTab === "new" && l.status === "new") || (activeTab === "qualified" && (l.status === "qualified" || l.status === "contacted")) || (activeTab === "meetings" && l.status === "meeting") || (activeTab === "won" && l.status === "won");
    return ms && mt;
  });

  const counts = { all: leads.length, new: leads.filter((l) => l.status === "new").length, qualified: leads.filter((l) => l.status === "qualified" || l.status === "contacted").length, meetings: leads.filter((l) => l.status === "meeting").length, won: leads.filter((l) => l.status === "won").length };
  const pipelineCounts = statusFlow.reduce((acc, s) => { acc[s] = leads.filter((l) => l.status === s).length; return acc; }, {} as Record<string, number>);
  const maxPipeline = Math.max(...Object.values(pipelineCounts), 1);
  const avgResponseTime = leads.filter((l) => l.responseTime !== "—").length > 0 ? `${(leads.filter((l) => l.responseTime !== "—").reduce((s, l) => s + parseFloat(l.responseTime), 0) / leads.filter((l) => l.responseTime !== "—").length).toFixed(1)}s` : "—";
  const qualifiedCount = leads.filter((l) => l.status === "qualified" || l.status === "contacted" || l.status === "meeting" || l.status === "won").length;
  const convRate = leads.length > 0 ? `${Math.round((leads.filter((l) => l.status === "won").length / leads.length) * 100)}%` : "0%";

  const columns = [
    { key: "name", label: "Lead", render: (item: Lead) => <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">{item.name.split(" ").map((n) => n[0]).join("")}</div><div><p className="font-medium text-foreground">{item.name}</p><p className="text-xs text-muted-foreground">{item.email}</p></div></div> },
    { key: "company", label: "Company", render: (item: Lead) => <div><p className="text-foreground">{item.company}</p><p className="text-xs text-muted-foreground">{item.role}</p></div> },
    { key: "source", label: "Source", render: (item: Lead) => <Badge variant="outline">{item.source}</Badge> },
    { key: "score", label: "Score", render: (item: Lead) => <span className={`text-sm font-bold ${item.score >= 80 ? "text-success" : item.score >= 60 ? "text-warning" : "text-destructive"}`}>{item.score}</span> },
    { key: "responseTime", label: "Response", render: (item: Lead) => <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-muted-foreground" /><span className="text-sm">{item.responseTime}</span></div> },
    { key: "status", label: "Status", render: (item: Lead) => <select value={item.status} onChange={(e) => setLeadStatus(item.id, e.target.value as Lead["status"])} className="px-2 py-1 bg-secondary border border-border rounded text-xs text-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring">{statusFlow.map((s) => <option key={s} value={s}>{s}</option>)}</select> },
    { key: "id", label: "", render: (item: Lead) => <button onClick={() => openDetail(item)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground cursor-pointer"><Eye className="w-4 h-4" /></button> },
  ];

  return (
    <div className="animate-fade-in">
      {notif && <div className="fixed top-4 right-4 z-[100] px-4 py-3 rounded-lg bg-success/10 border border-success/20 text-success text-sm font-medium animate-fade-in shadow-lg">{notif}</div>}
      <PageHeader title="Lead Response System" description="Every lead gets an immediate response and consistent follow-up" icon={<Zap className="w-6 h-6" />} actions={<div className="flex gap-3"><Button variant="secondary" onClick={() => setShowFlow(!showFlow)}><Play className="w-4 h-4" />{showFlow ? "Hide Flow" : "View Flow"}</Button><Button variant="secondary" onClick={exportCSV}><FileSpreadsheet className="w-4 h-4" />Export CSV</Button><Button onClick={() => setShowIntake(true)}><Plus className="w-4 h-4" />Add Lead</Button></div>} />

      {/* Workflow Visualization */}
      {showFlow && (
        <Card className="mb-6">
          <WorkflowVisualizer
            workflow={leadResponseFlow}
            onRunComplete={(results) => {
              const ok = Object.values(results).filter((s) => s === "success").length;
              showNotification(`Lead response flow completed: ${ok}/${Object.values(results).length} steps`);
            }}
          />
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 stagger-children">
        <StatCard label="Total Leads" value={leads.length} icon={<Zap className="w-5 h-5" />} gradient="primary" />
        <StatCard label="Avg Response Time" value={avgResponseTime} icon={<Clock className="w-5 h-5" />} gradient="success" />
        <StatCard label="Qualified" value={qualifiedCount} icon={<CheckCircle className="w-5 h-5" />} gradient="success" />
        <StatCard label="Conversion Rate" value={convRate} icon={<MessageSquare className="w-5 h-5" />} gradient="primary" />
      </div>

      <Card className="mb-6">
        <h3 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider">Pipeline Overview</h3>
        <div className="flex gap-2">
          {statusFlow.map((s) => (
            <div key={s} className="flex-1 text-center">
              <div className="h-20 rounded-lg bg-secondary/50 overflow-hidden flex flex-col justify-end">
                <div className={`rounded-lg ${s === "won" ? "bg-success" : s === "lost" ? "bg-destructive" : s === "new" ? "bg-info" : s === "meeting" ? "bg-success/70" : "bg-primary"}`} style={{ height: `${(pipelineCounts[s] / maxPipeline) * 100}%` }} />
              </div>
              <p className="text-xs text-muted-foreground mt-2 capitalize">{s}</p>
              <p className="text-sm font-semibold text-foreground">{pipelineCounts[s]}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="flex items-center justify-between mb-4">
        <Tabs tabs={[{ id: "all", label: "All Leads", count: counts.all }, { id: "new", label: "New", count: counts.new }, { id: "qualified", label: "Qualified", count: counts.qualified }, { id: "meetings", label: "Meetings", count: counts.meetings }, { id: "won", label: "Won", count: counts.won }]} activeTab={activeTab} onTabChange={setActiveTab} />
        <SearchBar placeholder="Search leads..." value={search} onChange={setSearch} />
      </div>
      <Card><DataTable columns={columns} data={filtered as unknown as Record<string, unknown>[]} emptyMessage="No leads found" /></Card>

      <Modal open={showIntake} onClose={() => { setShowIntake(false); setFormError(""); }} title="Add New Lead">
        <div className="space-y-4">
          {formError && <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20"><p className="text-sm text-destructive">{formError}</p></div>}
          <div className="grid grid-cols-2 gap-4">
            <Input label="Full Name *" placeholder="e.g. Adebayo Johnson" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
            <Input label="Email *" placeholder="email@company.com" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Phone" placeholder="+234 801 234 5678" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
            <Input label="Company" placeholder="Company name" value={form.company} onChange={(v) => setForm({ ...form, company: v })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Role" placeholder="e.g. Head of Sales" value={form.role} onChange={(v) => setForm({ ...form, role: v })} />
            <Select label="Source" value={form.source} onChange={(v) => setForm({ ...form, source: v })} options={[{ value: "website", label: "Website" }, { value: "meta", label: "Meta Ads" }, { value: "instagram", label: "Instagram" }, { value: "whatsapp", label: "WhatsApp" }, { value: "referral", label: "Referral" }, { value: "landing page", label: "Landing Page" }]} />
          </div>
          <Input label="Notes" multiline placeholder="What are they interested in?" value={form.message} onChange={(v) => setForm({ ...form, message: v })} />
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => { setShowIntake(false); setFormError(""); }} className="flex-1">Cancel</Button>
            <Button onClick={addLead} className="flex-1"><UserPlus className="w-4 h-4" />Add Lead</Button>
          </div>
        </div>
      </Modal>

      <Modal open={showLeadDetail} onClose={() => { setShowLeadDetail(false); setSelectedLead(null); }} title="Lead Details">
        {selectedLead && (() => {
          const live = leads.find((l) => l.id === selectedLead.id) || selectedLead;
          return (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">{live.name.split(" ").map((n) => n[0]).join("")}</div>
                <div className="flex-1"><h3 className="text-lg font-semibold text-foreground">{live.name}</h3><p className="text-sm text-muted-foreground">{live.role} at {live.company}</p></div>
                <Badge variant={statusColors[live.status]}>{live.status}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-secondary/30">
                <div><p className="text-xs text-muted-foreground mb-1">Email</p><p className="text-sm text-foreground">{live.email}</p></div>
                <div><p className="text-xs text-muted-foreground mb-1">Phone</p><p className="text-sm text-foreground">{live.phone}</p></div>
                <div><p className="text-xs text-muted-foreground mb-1">Source</p><p className="text-sm text-foreground">{live.source}</p></div>
                <div><p className="text-xs text-muted-foreground mb-1">Score</p><p className="text-sm font-semibold text-foreground">{live.score}/100</p></div>
                <div><p className="text-xs text-muted-foreground mb-1">Created</p><p className="text-sm text-foreground">{live.createdAt}</p></div>
                <div><p className="text-xs text-muted-foreground mb-1">Response Time</p><p className="text-sm text-foreground">{live.responseTime}</p></div>
              </div>
              {live.notes && <div className="p-3 rounded-lg bg-secondary/30"><p className="text-xs text-muted-foreground mb-1">Notes</p><p className="text-sm text-foreground">{live.notes}</p></div>}
              <div>
                <p className="text-xs text-muted-foreground mb-2">Update Status</p>
                <div className="flex gap-2">
                  {statusFlow.map((s) => <button key={s} onClick={() => setLeadStatus(live.id, s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${live.status === s ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>{s}</button>)}
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="secondary" className="flex-1" onClick={() => showNotification(`Message sent to ${live.name}!`)}><MessageSquare className="w-4 h-4" />Send Message</Button>
                <Button className="flex-1" onClick={() => { advanceLead(live.id); showNotification(`Follow-up scheduled for ${live.name}!`); }}><Clock className="w-4 h-4" />Advance & Follow-Up</Button>
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}
