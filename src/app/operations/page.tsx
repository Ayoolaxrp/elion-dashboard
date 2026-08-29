"use client";
import { useState, useCallback } from "react";
import { Settings, Plus, Play, Pause, Trash2, CheckCircle, Clock, TrendingUp, ArrowRight, Workflow, RefreshCw, Eye, Copy, Zap, Mail, Calendar, FileText, Users, Database, AlertTriangle, MessageSquare } from "lucide-react";
import { PageHeader, Card, Badge, Button, Input, Select, Modal, Tabs, StatCard, ProgressBar } from "@/components/ui";
import { WorkflowVisualizer, WorkflowDefinition } from "@/components/workflow-visualizer";

interface WF { id: string; name: string; description: string; category: string; status: "active" | "paused"; triggers: number; tasksCompleted: number; timeSaved: string; lastRun: string; steps: { type: string; label: string }[]; visual?: WorkflowDefinition; }
interface LogEntry { id: string; workflow: string; action: string; status: "success" | "failed" | "running"; timestamp: string; duration: string; }

// Pre-built visual workflow definitions for each automation
const workflowVisuals: Record<string, WorkflowDefinition> = {
  "1": {
    id: "onboarding", name: "Client Onboarding Flow",
    nodes: [
      { id: "trigger", label: "New Client Signs", type: "trigger", description: "Webhook received", icon: <Zap className="w-4 h-4" />, duration: 800 },
      { id: "crm", label: "Create CRM Record", type: "action", description: "HubSpot/Pipedrive", icon: <Database className="w-4 h-4" />, duration: 1200 },
      { id: "welcome", label: "Send Welcome Email", type: "action", description: "SMTP/Resend", icon: <Mail className="w-4 h-4" />, duration: 1000 },
      { id: "whatsapp", label: "WhatsApp Greeting", type: "action", description: "WhatsApp Business API", icon: <MessageSquare className="w-4 h-4" />, duration: 900 },
      { id: "tasks", label: "Assign Onboarding Tasks", type: "action", description: "Task management", icon: <FileText className="w-4 h-4" />, duration: 800 },
      { id: "notify", label: "Notify Team", type: "output", description: "Slack/Email", icon: <Users className="w-4 h-4" />, duration: 600 },
    ],
    edges: [
      { from: "trigger", to: "crm" }, { from: "crm", to: "welcome" },
      { from: "welcome", to: "whatsapp" }, { from: "whatsapp", to: "tasks" },
      { from: "tasks", to: "notify" },
    ],
  },
  "2": {
    id: "reports", name: "Weekly Report Generator",
    nodes: [
      { id: "trigger", label: "Every Monday 8AM", type: "trigger", description: "Cron schedule", icon: <Calendar className="w-4 h-4" />, duration: 800 },
      { id: "metrics", label: "Pull Analytics Data", type: "action", description: "Google Analytics + CRM", icon: <Database className="w-4 h-4" />, duration: 1500 },
      { id: "generate", label: "Generate PDF Report", type: "action", description: "Puppeteer/HTML", icon: <FileText className="w-4 h-4" />, duration: 2000 },
      { id: "email", label: "Email Stakeholders", type: "output", description: "SendGrid/Resend", icon: <Mail className="w-4 h-4" />, duration: 1000 },
    ],
    edges: [
      { from: "trigger", to: "metrics" }, { from: "metrics", to: "generate" },
      { from: "generate", to: "email" },
    ],
  },
  "3": {
    id: "invoicing", name: "Invoice Processing Pipeline",
    nodes: [
      { id: "trigger", label: "Invoice Received", type: "trigger", description: "Email webhook", icon: <Zap className="w-4 h-4" />, duration: 800 },
      { id: "ocr", label: "Extract Data (OCR)", type: "action", description: "Google Vision/AWS", icon: <Database className="w-4 h-4" />, duration: 1800 },
      { id: "match", label: "Match PO Number", type: "condition", description: "ERP lookup", icon: <CheckCircle className="w-4 h-4" />, duration: 1200 },
      { id: "approve", label: "Route for Approval", type: "action", description: "Slack/Email", icon: <Mail className="w-4 h-4" />, duration: 1000 },
      { id: "record", label: "Record in Accounting", type: "output", description: "Xero/QuickBooks", icon: <FileText className="w-4 h-4" />, duration: 800 },
    ],
    edges: [
      { from: "trigger", to: "ocr" }, { from: "ocr", to: "match" },
      { from: "match", to: "approve" }, { from: "approve", to: "record" },
    ],
  },
  "4": {
    id: "leave", name: "Employee Leave Manager",
    nodes: [
      { id: "trigger", label: "Leave Request", type: "trigger", description: "Form submission", icon: <Zap className="w-4 h-4" />, duration: 800 },
      { id: "check", label: "Check Leave Balance", type: "action", description: "HR system", icon: <Database className="w-4 h-4" />, duration: 1000 },
      { id: "notify_mgr", label: "Notify Manager", type: "action", description: "Slack/Email", icon: <Mail className="w-4 h-4" />, duration: 800 },
      { id: "calendar", label: "Update Calendar", type: "action", description: "Google Calendar", icon: <Calendar className="w-4 h-4" />, duration: 700 },
      { id: "confirm", label: "Confirm to Employee", type: "output", description: "Email/SMS", icon: <CheckCircle className="w-4 h-4" />, duration: 600 },
    ],
    edges: [
      { from: "trigger", to: "check" }, { from: "check", to: "notify_mgr" },
      { from: "notify_mgr", to: "calendar" }, { from: "calendar", to: "confirm" },
    ],
  },
  "5": {
    id: "sync", name: "Data Sync Pipeline",
    nodes: [
      { id: "trigger", label: "Every 6 Hours", type: "trigger", description: "Cron schedule", icon: <Calendar className="w-4 h-4" />, duration: 800 },
      { id: "pull", label: "Pull from CRM", type: "action", description: "HubSpot API", icon: <Database className="w-4 h-4" />, duration: 1200 },
      { id: "transform", label: "Transform & Clean", type: "action", description: "Data normalization", icon: <RefreshCw className="w-4 h-4" />, duration: 1000 },
      { id: "mailchimp", label: "Push to Mailchimp", type: "action", description: "Email platform", icon: <Mail className="w-4 h-4" />, duration: 900 },
      { id: "analytics", label: "Update Analytics", type: "output", description: "BigQuery/Metabase", icon: <TrendingUp className="w-4 h-4" />, duration: 800 },
    ],
    edges: [
      { from: "trigger", to: "pull" }, { from: "pull", to: "transform" },
      { from: "transform", to: "mailchimp" }, { from: "mailchimp", to: "analytics" },
    ],
  },
};

// Need MessageSquare import

const initialWfs: WF[] = [];

const initialLogs: LogEntry[] = [];

const cats = ["All", "Client Management", "Reporting", "Finance", "HR", "Data"];

export default function OperationsPage() {
  const [tab, setTab] = useState("workflows");
  const [cat, setCat] = useState("All");
  const [showNew, setShowNew] = useState(false);
  const [sel, setSel] = useState<WF | null>(null);
  const [showVisual, setShowVisual] = useState<WF | null>(null);
  const [workflows, setWorkflows] = useState<WF[]>(initialWfs);
  const [logs, setLogs] = useState<LogEntry[]>(initialLogs);
  const [notif, setNotif] = useState("");

  const [wfName, setWfName] = useState("");
  const [wfDesc, setWfDesc] = useState("");
  const [wfCategory, setWfCategory] = useState("Client Management");
  const [wfTrigger, setWfTrigger] = useState("webhook");
  const [formError, setFormError] = useState("");

  const showNotification = (msg: string) => { setNotif(msg); setTimeout(() => setNotif(""), 3000); };

  const filtered = workflows.filter((w) => cat === "All" || w.category === cat);
  const totalHours = workflows.reduce((s, w) => s + parseInt(w.timeSaved), 0);
  const totalTasks = workflows.reduce((s, w) => s + w.tasksCompleted, 0);

  const toggleWorkflowStatus = (wfId: string) => {
    setWorkflows((prev) => prev.map((w) => {
      if (w.id !== wfId) return w;
      const newStatus = w.status === "active" ? "paused" : "active";
      setLogs((prevLogs) => [{ id: String(Date.now()), workflow: w.name, action: newStatus === "active" ? "Workflow resumed" : "Workflow paused", status: "success", timestamp: "Just now", duration: "0.1s" }, ...prevLogs]);
      return { ...w, status: newStatus as "active" | "paused" };
    }));
    const wf = workflows.find((w) => w.id === wfId);
    showNotification(`"${wf?.name}" ${wf?.status === "active" ? "paused" : "resumed"}!`);
  };

  const duplicateWorkflow = useCallback((wfId: string) => {
    const original = workflows.find((w) => w.id === wfId);
    if (!original) return;
    const ts = Date.now();
    const copyName = `${original.name} (Copy)`;
    const duplicate: WF = { ...original, id: String(ts), name: copyName, status: "paused", triggers: 0, tasksCompleted: 0, timeSaved: "0 hours", lastRun: "Never" };
    setWorkflows((prev) => [...prev, duplicate]);
    setLogs((prev) => [{ id: String(ts + 1), workflow: original.name, action: `Duplicated as \"${copyName}\"`, status: "success", timestamp: "Just now", duration: "0.1s" }, ...prev]);
    showNotification(`Workflow duplicated as "${copyName}"`);
    setSel(null);
  }, [workflows]);

  const deleteWorkflow = (wfId: string) => {
    const wf = workflows.find((w) => w.id === wfId);
    setWorkflows((prev) => prev.filter((w) => w.id !== wfId));
    showNotification(`"${wf?.name}" deleted`);
    setSel(null);
  };

  const createWorkflow = useCallback(() => {
    if (!wfName.trim()) { setFormError("Workflow name is required"); return; }
    setFormError("");
    const triggerLabel = { webhook: "Webhook received", schedule: "Scheduled trigger", event: "Event fired", manual: "Manual trigger" }[wfTrigger] || "Trigger";
    const newWf: WF = {
      id: String(Date.now()), name: wfName, description: wfDesc, category: wfCategory, status: "active",
      triggers: 0, tasksCompleted: 0, timeSaved: "0 hours", lastRun: "Never",
      steps: [{ type: "trigger", label: triggerLabel }, { type: "action", label: "Process data" }, { type: "action", label: "Send notification" }],
    };
    setWorkflows((prev) => [...prev, newWf]);
    setLogs((prev) => [{ id: String(Date.now()), workflow: newWf.name, action: "Workflow created", status: "success", timestamp: "Just now", duration: "0.1s" }, ...prev]);
    setWfName(""); setWfDesc("");
    setShowNew(false);
    showNotification(`Workflow "${newWf.name}" created!`);
  }, [wfName, wfDesc, wfCategory, wfTrigger]);

  return (
    <div className="animate-fade-in">
      {notif && <div className="fixed top-4 right-4 z-[100] px-4 py-3 rounded-lg bg-success/10 border border-success/20 text-success text-sm font-medium animate-fade-in shadow-lg">{notif}</div>}
      <PageHeader title="Operations Automation" description="Visual workflow automation with real-time test runs" icon={<Settings className="w-6 h-6" />} actions={<Button onClick={() => setShowNew(true)}><Plus className="w-4 h-4" />New Workflow</Button>} />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 stagger-children">
        <StatCard label="Active Workflows" value={workflows.filter((w) => w.status === "active").length} icon={<Workflow className="w-5 h-5" />} gradient="primary" />
        <StatCard label="Tasks Completed" value={totalTasks.toLocaleString()} icon={<CheckCircle className="w-5 h-5" />} gradient="success" />
        <StatCard label="Hours Saved Monthly" value={`${totalHours}`} icon={<Clock className="w-5 h-5" />} gradient="warning" />
        <StatCard label="Success Rate" value={`${workflows.length > 0 ? Math.round((workflows.filter((w) => w.status === "active").length / workflows.length) * 100) : 0}%`} icon={<TrendingUp className="w-5 h-5" />} gradient="success" />
      </div>

      <div className="flex items-center justify-between mb-6">
        <Tabs tabs={[{ id: "workflows", label: "Workflows", count: workflows.length }, { id: "visual", label: "Visual Runner", count: workflows.filter((w) => w.visual).length }, { id: "activity", label: "Activity Log", count: logs.length }]} activeTab={tab} onTabChange={setTab} />
        {tab === "workflows" && (
          <div className="flex gap-1 p-1 bg-secondary/50 rounded-lg">
            {cats.map((c) => <button key={c} onClick={() => setCat(c)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${cat === c ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>{c}</button>)}
          </div>
        )}
      </div>

      {tab === "workflows" ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((wf) => (
            <Card key={wf.id} hover className="cursor-pointer">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-cyan-400/10 flex items-center justify-center shrink-0"><Workflow className="w-5 h-5 text-cyan-400" /></div>
                  <div><h3 className="text-base font-semibold text-foreground">{wf.name}</h3><p className="text-xs text-muted-foreground">{wf.category}</p></div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={wf.status === "active" ? "success" : "warning"}>{wf.status}</Badge>
                  <button onClick={(e) => { e.stopPropagation(); toggleWorkflowStatus(wf.id); }} className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground cursor-pointer">
                    {wf.status === "active" ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{wf.description}</p>
              {/* Compact workflow visual */}
              {wf.visual && (
                <div className="mb-4 p-3 rounded-lg bg-secondary/20 border border-border/30">
                  <WorkflowVisualizer workflow={wf.visual} compact />
                </div>
              )}
              <div className="flex gap-4 pt-3 border-t border-border/50">
                <div><p className="text-xs text-muted-foreground">Runs</p><p className="text-sm font-semibold text-foreground">{wf.triggers}</p></div>
                <div><p className="text-xs text-muted-foreground">Tasks Done</p><p className="text-sm font-semibold text-foreground">{wf.tasksCompleted}</p></div>
                <div><p className="text-xs text-muted-foreground">Time Saved</p><p className="text-sm font-semibold text-success">{wf.timeSaved}</p></div>
                <div className="ml-auto flex gap-2">
                  {wf.visual && <Button variant="ghost" size="sm" onClick={() => setShowVisual(wf)}><Play className="w-3.5 h-3.5" />Test Run</Button>}
                  <Button variant="ghost" size="sm" onClick={() => setSel(wf)}>Details</Button>
                </div>
              </div>
            </Card>
          ))}
          <Card hover onClick={() => setShowNew(true)} className="border-dashed flex items-center justify-center min-h-[200px] cursor-pointer">
            <div className="text-center"><div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mx-auto mb-3"><Plus className="w-6 h-6 text-muted-foreground" /></div><p className="text-sm font-medium text-foreground">Create New Workflow</p><p className="text-xs text-muted-foreground mt-1">Build custom automation</p></div>
          </Card>
        </div>
      ) : tab === "visual" ? (
        <div className="space-y-6">
          <Card>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Play className="w-5 h-5 text-primary" /></div>
              <div>
                <h3 className="text-base font-semibold text-foreground">Visual Workflow Runner</h3>
                <p className="text-xs text-muted-foreground">Trigger test runs and watch processes move from node to node in real-time</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">Select a workflow below to see its visual flow and trigger a test run. Each node represents a step in the automation, and you can watch the process execute in real-time.</p>
          </Card>
          {workflows.filter((w) => w.visual).map((wf) => (
            <Card key={wf.id}>
              <WorkflowVisualizer
                workflow={wf.visual!}
                onRunComplete={(results) => {
                  const successCount = Object.values(results).filter((s) => s === "success").length;
                  const totalCount = Object.values(results).length;
                  setLogs((prev) => [{ id: String(Date.now()), workflow: wf.name, action: `Test run: ${successCount}/${totalCount} steps completed`, status: successCount === totalCount ? "success" : "failed", timestamp: "Just now", duration: `${(successCount * 0.8).toFixed(1)}s` }, ...prev]);
                  showNotification(`Test run completed: ${successCount}/${totalCount} steps succeeded`);
                }}
              />
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <h3 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider">Recent Activity</h3>
          <div className="space-y-2">
            {logs.map((log) => (
              <div key={log.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-secondary/30 transition-colors">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${log.status === "success" ? "bg-success/10" : log.status === "failed" ? "bg-destructive/10" : "bg-info/10"}`}>
                  {log.status === "success" ? <CheckCircle className="w-4 h-4 text-success" /> : log.status === "failed" ? <AlertTriangle className="w-4 h-4 text-destructive" /> : <RefreshCw className="w-4 h-4 text-info animate-spin" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">{log.action}</p>
                  <p className="text-xs text-muted-foreground">{log.workflow}</p>
                </div>
                <div className="text-right shrink-0"><p className="text-xs text-muted-foreground">{log.timestamp}</p><p className="text-xs text-muted-foreground/60">{log.duration}</p></div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Detail Modal */}
      <Modal open={!!sel} onClose={() => setSel(null)} title={sel?.name || ""}>
        {sel && (() => {
          const live = workflows.find((w) => w.id === sel.id) || sel;
          return (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{live.description}</p>
              {/* Inline visual */}
              {live.visual && (
                <div className="p-3 rounded-lg bg-secondary/20 border border-border/30">
                  <WorkflowVisualizer workflow={live.visual} compact />
                </div>
              )}
              <div className="grid grid-cols-3 gap-4 p-4 rounded-lg bg-secondary/30">
                <div className="text-center"><p className="text-lg font-bold text-foreground">{live.triggers}</p><p className="text-xs text-muted-foreground">Total Runs</p></div>
                <div className="text-center"><p className="text-lg font-bold text-foreground">{live.tasksCompleted}</p><p className="text-xs text-muted-foreground">Tasks Done</p></div>
                <div className="text-center"><p className="text-lg font-bold text-success">{live.timeSaved}</p><p className="text-xs text-muted-foreground">Time Saved</p></div>
              </div>
              <div className="flex gap-3">
                {live.visual && <Button className="flex-1" onClick={() => { setSel(null); setShowVisual(live); }}><Play className="w-4 h-4" />Test Run</Button>}
                <Button variant="secondary" className="flex-1" onClick={() => duplicateWorkflow(live.id)}><Copy className="w-4 h-4" />Duplicate</Button>
                <Button variant="danger" className="flex-1" onClick={() => deleteWorkflow(live.id)}><Trash2 className="w-4 h-4" />Delete</Button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* Create Workflow Modal */}
      <Modal open={showNew} onClose={() => { setShowNew(false); setFormError(""); }} title="Create Workflow">
        <div className="space-y-4">
          {formError && <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20"><p className="text-sm text-destructive">{formError}</p></div>}
          <Input label="Workflow Name *" placeholder="e.g. Client Welcome Flow" value={wfName} onChange={setWfName} />
          <Input label="Description" multiline placeholder="What does this workflow do?" rows={2} value={wfDesc} onChange={setWfDesc} />
          <Select label="Category" value={wfCategory} onChange={setWfCategory} options={[{ value: "Client Management", label: "Client Management" }, { value: "Reporting", label: "Reporting" }, { value: "Finance", label: "Finance" }, { value: "HR", label: "HR" }, { value: "Data", label: "Data" }]} />
          <Select label="Trigger" value={wfTrigger} onChange={setWfTrigger} options={[{ value: "webhook", label: "Webhook" }, { value: "schedule", label: "Scheduled" }, { value: "event", label: "Event" }, { value: "manual", label: "Manual" }]} />
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => { setShowNew(false); setFormError(""); }} className="flex-1">Cancel</Button>
            <Button onClick={createWorkflow} className="flex-1"><Workflow className="w-4 h-4" />Create Workflow</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
