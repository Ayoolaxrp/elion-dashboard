"use client";
import { useState, useCallback } from "react";
import { Mail, Plus, Play, Pause, Trash2, Clock, CheckCircle, MessageSquare, GripVertical, Users, ArrowRight, Eye, Zap } from "lucide-react";
import { PageHeader, Card, Badge, Button, Input, Select, Modal, Tabs, StatCard, ProgressBar } from "@/components/ui";
import { WorkflowVisualizer, WorkflowDefinition } from "@/components/workflow-visualizer";

const followUpFlow: WorkflowDefinition = {
  id: "followup",
  name: "Follow-Up Sequence Engine",
  nodes: [
    { id: "trigger", label: "Lead Enters CRM", type: "trigger", description: "New or existing lead", icon: <Zap className="w-4 h-4" />, duration: 800 },
    { id: "qualify", label: "Auto-Qualify", type: "condition", description: "Score check", icon: <CheckCircle className="w-4 h-4" />, duration: 1000 },
    { id: "email1", label: "Welcome Email", type: "action", description: "Immediate", icon: <Mail className="w-4 h-4" />, duration: 900 },
    { id: "delay1", label: "Wait 2 Days", type: "delay", description: "Smart delay", icon: <Clock className="w-4 h-4" />, duration: 600 },
    { id: "whatsapp", label: "WhatsApp Check-in", type: "action", description: "Personal message", icon: <MessageSquare className="w-4 h-4" />, duration: 1000 },
    { id: "delay2", label: "Wait 3 Days", type: "delay", description: "Smart delay", icon: <Clock className="w-4 h-4" />, duration: 600 },
    { id: "email2", label: "Value Email", type: "action", description: "Case study / offer", icon: <Mail className="w-4 h-4" />, duration: 900 },
    { id: "notify", label: "Human Handoff", type: "output", description: "If reply detected", icon: <Users className="w-4 h-4" />, duration: 700 },
  ],
  edges: [
    { from: "trigger", to: "qualify" },
    { from: "qualify", to: "email1" },
    { from: "email1", to: "delay1" },
    { from: "delay1", to: "whatsapp" },
    { from: "whatsapp", to: "delay2" },
    { from: "delay2", to: "email2" },
    { from: "email2", to: "notify" },
  ],
};

interface Step { id: string; type: string; label: string; delay: string; }
interface Seq { id: string; name: string; status: "active" | "paused"; steps: Step[]; enrolled: number; completed: number; replies: number; openRate: number; }
interface Campaign { id: string; name: string; seqId: string; status: "sending" | "completed" | "scheduled" | "paused"; sent: number; replied: number; createdAt: string; }

const stepColor: Record<string, string> = { email: "border-primary/30 text-primary bg-primary/5", whatsapp: "border-success/30 text-success bg-success/5", sms: "border-warning/30 text-warning bg-warning/5", delay: "border-border text-muted-foreground bg-secondary/30" };
const stepIcon: Record<string, typeof Mail> = { email: Mail, whatsapp: MessageSquare, sms: MessageSquare, delay: Clock };

const initialSeqs: Seq[] = [];

const initialCampaigns: Campaign[] = [];

export default function FollowUpPage() {
  const [tab, setTab] = useState("sequences");
  const [showNew, setShowNew] = useState(false);
  const [showCampaign, setShowCampaign] = useState(false);
  const [seqs, setSeqs] = useState<Seq[]>(initialSeqs);
  const [campaigns, setCampaigns] = useState<Campaign[]>(initialCampaigns);
  const [steps, setSteps] = useState<Step[]>([{ id: "1", type: "email", label: "First Email", delay: "Immediate" }]);
  const [seqName, setSeqName] = useState("");
  const [notif, setNotif] = useState("");
  const [showFlow, setShowFlow] = useState(false);

  const [campName, setCampName] = useState("");
  const [campSeq, setCampSeq] = useState(initialSeqs[0]?.id || "");
  const [campAudience, setCampAudience] = useState("all");

  const showNotification = (msg: string) => { setNotif(msg); setTimeout(() => setNotif(""), 3000); };

  const toggleSeqStatus = (seqId: string) => {
    setSeqs((prev) => prev.map((s) => s.id === seqId ? { ...s, status: s.status === "active" ? "paused" : "active" } : s));
    const seq = seqs.find((s) => s.id === seqId);
    showNotification(`${seq?.name} ${seq?.status === "active" ? "paused" : "activated"}!`);
  };

  const addStep = () => setSteps([...steps, { id: String(steps.length + 1), type: "delay", label: "Wait", delay: "1 day" }]);
  const removeStep = (idx: number) => setSteps(steps.filter((_, j) => j !== idx));
  const updateStep = (idx: number, field: keyof Step, value: string) => {
    const updated = [...steps];
    updated[idx] = { ...updated[idx], [field]: value };
    setSteps(updated);
  };

  const createSequence = useCallback(() => {
    if (!seqName.trim()) return;
    const newSeq: Seq = {
      id: String(Date.now()),
      name: seqName,
      status: "active",
      steps: steps.map((s, i) => ({ ...s, id: String(i + 1) })),
      enrolled: 0, completed: 0, replies: 0, openRate: 0,
    };
    setSeqs((prev) => [...prev, newSeq]);
    setSeqName("");
    setSteps([{ id: "1", type: "email", label: "First Email", delay: "Immediate" }]);
    setShowNew(false);
    showNotification(`Sequence "${newSeq.name}" created with ${newSeq.steps.length} steps!`);
  }, [seqName, steps]);

  const deleteSequence = (seqId: string) => {
    const seq = seqs.find((s) => s.id === seqId);
    setSeqs((prev) => prev.filter((s) => s.id !== seqId));
    showNotification(`Sequence "${seq?.name}" deleted`);
  };

  const launchCampaign = useCallback(() => {
    if (!campName.trim()) return;
    const newCamp: Campaign = {
      id: String(Date.now()),
      name: campName,
      seqId: campSeq,
      status: "sending",
      sent: 0, replied: 0,
      createdAt: new Date().toISOString().split("T")[0],
    };
    setCampaigns((prev) => [...prev, newCamp]);
    setCampName("");
    setShowCampaign(false);
    showNotification(`Campaign "${newCamp.name}" launched!`);
    // Simulate sending
    setTimeout(() => {
      setCampaigns((prev) => prev.map((c) => c.id === newCamp.id ? { ...c, status: "completed" as const, sent: Math.floor(Math.random() * 200) + 50, replied: Math.floor(Math.random() * 40) + 5 } : c));
    }, 5000);
  }, [campName, campSeq]);

  const toggleCampaign = (campId: string) => {
    setCampaigns((prev) => prev.map((c) => c.id === campId ? { ...c, status: c.status === "sending" ? "paused" as const : "sending" as const } : c));
  };

  const totalSent = campaigns.reduce((s, c) => s + c.sent, 0);
  const totalReplies = campaigns.reduce((s, c) => s + c.replied, 0);
  const totalEnrolled = seqs.reduce((s, seq) => s + seq.enrolled, 0);

  return (
    <div className="animate-fade-in">
      {notif && <div className="fixed top-4 right-4 z-50 px-4 py-3 rounded-lg bg-success/10 border border-success/20 text-success text-sm font-medium animate-fade-in shadow-lg">{notif}</div>}
      {/* Workflow Visualization */}
      {showFlow && (
        <Card className="mb-6">
          <WorkflowVisualizer
            workflow={followUpFlow}
            onRunComplete={(results) => {
              const ok = Object.values(results).filter((s) => s === "success").length;
              showNotification(`Follow-up flow completed: ${ok}/${Object.values(results).length} steps`);
            }}
          />
        </Card>
      )}

      <PageHeader title="Follow-Up Engine" description="Automated multi-channel follow-up sequences that convert" icon={<Mail className="w-6 h-6" />} actions={<div className="flex gap-3"><Button variant="secondary" onClick={() => setShowFlow(!showFlow)}><Eye className="w-4 h-4" />{showFlow ? "Hide Flow" : "View Flow"}</Button><Button onClick={() => setShowNew(true)}><Plus className="w-4 h-4" />New Sequence</Button></div>} />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 stagger-children">
        <StatCard label="Active Sequences" value={seqs.filter((s) => s.status === "active").length} icon={<Mail className="w-5 h-5" />} gradient="primary" />
        <StatCard label="Messages Sent" value={totalSent.toLocaleString()} icon={<MessageSquare className="w-5 h-5" />} gradient="success" />
        <StatCard label="Reply Rate" value={`${totalSent > 0 ? Math.round((totalReplies / totalSent) * 100) : 0}%`} icon={<CheckCircle className="w-5 h-5" />} gradient="primary" />
        <StatCard label="Active Enrolled" value={totalEnrolled.toLocaleString()} icon={<Users className="w-5 h-5" />} gradient="warning" />
      </div>
      <div className="flex items-center justify-between mb-6">
        <Tabs tabs={[{ id: "sequences", label: "Sequences", count: seqs.length }, { id: "campaigns", label: "Campaigns", count: campaigns.length }]} activeTab={tab} onTabChange={setTab} />
      </div>

      {tab === "sequences" ? (
        <div className="space-y-4">
          {seqs.map((seq) => (
            <Card key={seq.id} hover>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Mail className="w-5 h-5 text-primary" /></div>
                  <div>
                    <h3 className="text-base font-semibold text-foreground">{seq.name}</h3>
                    <p className="text-xs text-muted-foreground">{seq.steps.length} steps &bull; {seq.enrolled.toLocaleString()} enrolled</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={seq.status === "active" ? "success" : "warning"}>{seq.status}</Badge>
                  <button onClick={() => toggleSeqStatus(seq.id)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground cursor-pointer" title={seq.status === "active" ? "Pause" : "Activate"}>
                    {seq.status === "active" ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                  <button onClick={() => deleteSequence(seq.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive cursor-pointer" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
                {seq.steps.map((step, i) => {
                  const Icon = stepIcon[step.type] || Mail;
                  return (
                    <div key={step.id} className="flex items-center gap-2 shrink-0">
                      <div className={`px-3 py-2 rounded-lg border text-xs font-medium flex items-center gap-2 ${stepColor[step.type] || stepColor.delay}`}>
                        <Icon className="w-3.5 h-3.5" />{step.label}<span className="text-muted-foreground/60">{step.delay}</span>
                      </div>
                      {i < seq.steps.length - 1 && <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />}
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-6 pt-3 border-t border-border/50">
                <div><p className="text-xs text-muted-foreground">Enrolled</p><p className="text-sm font-semibold text-foreground">{seq.enrolled}</p></div>
                <div><p className="text-xs text-muted-foreground">Completed</p><p className="text-sm font-semibold text-foreground">{seq.completed}</p></div>
                <div><p className="text-xs text-muted-foreground">Replies</p><p className="text-sm font-semibold text-foreground">{seq.replies}</p></div>
                <div><p className="text-xs text-muted-foreground">Open Rate</p><p className="text-sm font-semibold text-foreground">{seq.openRate}%</p></div>
                <div className="ml-auto">
                  <ProgressBar value={seq.completed} max={seq.enrolled} color="primary" size="sm" />
                  <p className="text-xs text-muted-foreground mt-1 text-right">{Math.round((seq.completed / seq.enrolled) * 100)}% completion</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {campaigns.map((c) => {
            const seq = seqs.find((s) => s.id === c.seqId);
            return (
              <Card key={c.id}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-base font-semibold text-foreground">{c.name}</h3>
                    <p className="text-xs text-muted-foreground">Using: {seq?.name || "Unknown sequence"} &bull; Created: {c.createdAt}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={c.status === "sending" ? "info" : c.status === "completed" ? "success" : c.status === "paused" ? "warning" : "outline"}>{c.status}</Badge>
                    {(c.status === "sending" || c.status === "paused") && (
                      <button onClick={() => toggleCampaign(c.id)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground cursor-pointer">
                        {c.status === "sending" ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-3 rounded-lg bg-secondary/30"><p className="text-xs text-muted-foreground">Sent</p><p className="text-lg font-semibold text-foreground">{c.sent.toLocaleString()}</p></div>
                  <div className="p-3 rounded-lg bg-secondary/30"><p className="text-xs text-muted-foreground">Replied</p><p className="text-lg font-semibold text-success">{c.replied}</p></div>
                  <div className="p-3 rounded-lg bg-secondary/30"><p className="text-xs text-muted-foreground">Reply Rate</p><p className="text-lg font-semibold text-foreground">{c.sent > 0 ? Math.round((c.replied / c.sent) * 100) : 0}%</p></div>
                </div>
                {c.sent > 0 && <div className="mt-3"><ProgressBar value={c.replied} max={c.sent} color="success" size="sm" /></div>}
              </Card>
            );
          })}
          <Button variant="secondary" onClick={() => setShowCampaign(true)} className="w-full"><Plus className="w-4 h-4" />New Campaign</Button>
        </div>
      )}

      <Modal open={showNew} onClose={() => setShowNew(false)} title="Create Follow-Up Sequence">
        <div className="space-y-4">
          <Input label="Sequence Name *" placeholder="e.g. New Lead Welcome" value={seqName} onChange={setSeqName} />
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Sequence Steps</label>
            <div className="space-y-2">
              {steps.map((step, i) => (
                <div key={step.id} className="flex items-center gap-2 p-3 rounded-lg bg-secondary/30 border border-border">
                  <GripVertical className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                  <span className="text-xs text-muted-foreground w-6 shrink-0">{i + 1}.</span>
                  <select value={step.type} onChange={(e) => updateStep(i, "type", e.target.value)} className="px-2 py-1 bg-secondary border border-border rounded text-xs text-foreground cursor-pointer">
                    <option value="email">Email</option><option value="whatsapp">WhatsApp</option><option value="sms">SMS</option><option value="delay">Delay</option>
                  </select>
                  <input type="text" value={step.label} onChange={(e) => updateStep(i, "label", e.target.value)} className="flex-1 px-2 py-1 bg-secondary border border-border rounded text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring" placeholder="Label" />
                  <input type="text" value={step.delay} onChange={(e) => updateStep(i, "delay", e.target.value)} className="w-28 px-2 py-1 bg-secondary border border-border rounded text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring" placeholder="Delay" />
                  {steps.length > 1 && <button onClick={() => removeStep(i)} className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>}
                </div>
              ))}
            </div>
            <Button variant="ghost" size="sm" onClick={addStep} className="mt-2"><Plus className="w-3.5 h-3.5" />Add Step</Button>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowNew(false)} className="flex-1">Cancel</Button>
            <Button onClick={createSequence} className="flex-1" disabled={!seqName.trim()}><CheckCircle className="w-4 h-4" />Create Sequence</Button>
          </div>
        </div>
      </Modal>

      <Modal open={showCampaign} onClose={() => setShowCampaign(false)} title="Launch Campaign">
        <div className="space-y-4">
          <Input label="Campaign Name *" placeholder="e.g. Q3 Outreach" value={campName} onChange={setCampName} />
          <Select label="Sequence" value={campSeq} onChange={setCampSeq} options={seqs.map((s) => ({ value: s.id, label: `${s.name} (${s.steps.length} steps)` }))} />
          <Select label="Audience" value={campAudience} onChange={setCampAudience} options={[{ value: "all", label: `All Qualified Leads (${totalEnrolled.toLocaleString()})` }, { value: "new", label: "New Leads" }, { value: "dormant", label: "Dormant Contacts" }]} />
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowCampaign(false)} className="flex-1">Cancel</Button>
            <Button onClick={launchCampaign} className="flex-1" disabled={!campName.trim()}><Play className="w-4 h-4" />Launch Campaign</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
