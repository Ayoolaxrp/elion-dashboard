"use client";
import { useState, useCallback } from "react";
import { RotateCcw, Plus, Play, Pause, Users, DollarSign, CheckCircle, Trash2, TrendingUp, Target, Clock, Eye, Zap, Mail, MessageSquare } from "lucide-react";
import { PageHeader, Card, Badge, Button, Input, Select, Modal, Tabs, StatCard, ProgressBar } from "@/components/ui";
import { WorkflowVisualizer, WorkflowDefinition } from "@/components/workflow-visualizer";

const recoveryFlow: WorkflowDefinition = {
  id: "recovery",
  name: "Revenue Recovery Pipeline",
  nodes: [
    { id: "segment", label: "Segment Database", type: "trigger", description: "Identify dormant contacts", icon: <Users className="w-4 h-4" />, duration: 1000 },
    { id: "personalize", label: "AI Personalization", type: "action", description: "Tailor message per contact", icon: <Zap className="w-4 h-4" />, duration: 1200 },
    { id: "multi", label: "Multi-Channel Send", type: "action", description: "Email + WhatsApp + SMS", icon: <MessageSquare className="w-4 h-4" />, duration: 900 },
    { id: "track", label: "Response Detection", type: "condition", description: "Opened / Replied / Ignored", icon: <Target className="w-4 h-4" />, duration: 800 },
    { id: "followup", label: "Smart Follow-Up", type: "action", description: "Escalate or nurture", icon: <Mail className="w-4 h-4" />, duration: 900 },
    { id: "convert", label: "Booking / Payment", type: "output", description: "Convert to revenue", icon: <DollarSign className="w-4 h-4" />, duration: 1000 },
  ],
  edges: [
    { from: "segment", to: "personalize" },
    { from: "personalize", to: "multi" },
    { from: "multi", to: "track" },
    { from: "track", to: "followup" },
    { from: "followup", to: "convert" },
  ],
};

interface Segment { id: string; name: string; desc: string; count: number; avgValue: string; lastActivity: string; recoveryRate: number; }
interface Campaign { id: string; name: string; segmentId: string; channel: string; offerType: string; status: "sending" | "completed" | "scheduled" | "paused"; sent: number; recovered: number; revenue: string; createdAt: string; }

const initialSegs: Segment[] = [];

const initialCamps: Campaign[] = [];

export default function RecoveryPage() {
  const [tab, setTab] = useState("segments");
  const [showNew, setShowNew] = useState(false);
  const [segments, setSegments] = useState<Segment[]>(initialSegs);
  const [campaigns, setCampaigns] = useState<Campaign[]>(initialCamps);
  const [notif, setNotif] = useState("");
  const [showFlow, setShowFlow] = useState(false);

  const [campName, setCampName] = useState("");
  const [campSegment, setCampSegment] = useState(initialSegs[0]?.id || "");
  const [campChannel, setCampChannel] = useState("multi");
  const [campOffer, setCampOffer] = useState("discount");
  const [campMessage, setCampMessage] = useState("");

  const showNotification = (msg: string) => { setNotif(msg); setTimeout(() => setNotif(""), 3000); };

  const totalDormant = segments.reduce((s, seg) => s + seg.count, 0);
  const totalRecovered = campaigns.reduce((s, c) => s + c.recovered, 0);
  const totalRevenue = campaigns.reduce((s, c) => {
    const num = parseInt(c.revenue.replace(/[^0-9]/g, ""));
    return s + (isNaN(num) ? 0 : num);
  }, 0);
  const avgRecoveryRate = campaigns.filter((c) => c.sent > 0).reduce((s, c) => s + (c.recovered / c.sent) * 100, 0) / Math.max(campaigns.filter((c) => c.sent > 0).length, 1);

  const toggleCampaignStatus = (campId: string) => {
    setCampaigns((prev) => prev.map((c) => {
      if (c.id !== campId) return c;
      if (c.status === "sending") return { ...c, status: "paused" as const };
      if (c.status === "paused") return { ...c, status: "sending" as const };
      return c;
    }));
    const camp = campaigns.find((c) => c.id === campId);
    showNotification(`Campaign "${camp?.name}" ${camp?.status === "sending" ? "paused" : "resumed"}!`);
  };

  const deleteCampaign = (campId: string) => {
    const camp = campaigns.find((c) => c.id === campId);
    setCampaigns((prev) => prev.filter((c) => c.id !== campId));
    showNotification(`Campaign "${camp?.name}" deleted`);
  };

  const launchCampaign = useCallback(() => {
    if (!campName.trim()) return;
    const newCamp: Campaign = {
      id: String(Date.now()),
      name: campName,
      segmentId: campSegment,
      channel: campChannel,
      offerType: campOffer,
      status: "sending",
      sent: 0, recovered: 0, revenue: "NGN 0",
      createdAt: new Date().toISOString().split("T")[0],
    };
    setCampaigns((prev) => [...prev, newCamp]);
    setCampName("");
    setCampMessage("");
    setShowNew(false);
    showNotification(`Campaign "${newCamp.name}" launched!`);
    // Simulate sending over time
    setTimeout(() => {
      const sent = Math.floor(Math.random() * 300) + 100;
      const recovered = Math.floor(sent * (Math.random() * 0.2 + 0.05));
      const revenue = recovered * Math.floor(Math.random() * 40000 + 20000);
      setCampaigns((prev) => prev.map((c) => c.id === newCamp.id ? {
        ...c, status: "completed" as const, sent, recovered,
        revenue: `NGN ${revenue.toLocaleString()}`
      } : c));
    }, 8000);
  }, [campName, campSegment, campChannel, campOffer]);

  const formatCurrency = (n: number) => `NGN ${(n / 1000000).toFixed(1)}M`;

  return (
    <div className="animate-fade-in">
      {notif && <div className="fixed top-4 right-4 z-50 px-4 py-3 rounded-lg bg-success/10 border border-success/20 text-success text-sm font-medium animate-fade-in shadow-lg">{notif}</div>}
      {/* Workflow Visualization */}
      {showFlow && (
        <Card className="mb-6">
          <WorkflowVisualizer
            workflow={recoveryFlow}
            onRunComplete={(results) => {
              const ok = Object.values(results).filter((s) => s === "success").length;
              showNotification(`Recovery flow completed: ${ok}/${Object.values(results).length} steps`);
            }}
          />
        </Card>
      )}

      <PageHeader title="Revenue Recovery System" description="Reactivate dormant leads and recover revenue sitting in your database" icon={<RotateCcw className="w-6 h-6" />} actions={<div className="flex gap-3"><Button variant="secondary" onClick={() => setShowFlow(!showFlow)}><Eye className="w-4 h-4" />{showFlow ? "Hide Flow" : "View Flow"}</Button><Button onClick={() => setShowNew(true)}><Plus className="w-4 h-4" />New Campaign</Button></div>} />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 stagger-children">
        <StatCard label="Dormant Contacts" value={totalDormant.toLocaleString()} icon={<Users className="w-5 h-5" />} gradient="warning" />
        <StatCard label="Recovered" value={totalRecovered.toLocaleString()} icon={<CheckCircle className="w-5 h-5" />} gradient="success" />
        <StatCard label="Revenue Recovered" value={formatCurrency(totalRevenue)} icon={<DollarSign className="w-5 h-5" />} gradient="primary" />
        <StatCard label="Avg Recovery Rate" value={`${avgRecoveryRate.toFixed(1)}%`} icon={<TrendingUp className="w-5 h-5" />} gradient="primary" />
      </div>

      <Card className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Revenue Recovery Potential</h3>
          <Badge variant="info"><Target className="w-3 h-3 mr-1" />{segments.length} segments</Badge>
        </div>
        <div className="space-y-4">
          {segments.map((s) => (
            <div key={s.id} className="flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-foreground truncate">{s.name}</p>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-muted-foreground">{s.count.toLocaleString()}</span>
                    <Badge variant={s.recoveryRate > 20 ? "success" : s.recoveryRate > 10 ? "warning" : "outline"}>{s.recoveryRate}%</Badge>
                  </div>
                </div>
                <ProgressBar value={s.recoveryRate} max={40} color={s.recoveryRate > 20 ? "success" : s.recoveryRate > 10 ? "warning" : "primary"} size="sm" />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="flex items-center justify-between mb-6">
        <Tabs tabs={[{ id: "segments", label: "Segments", count: segments.length }, { id: "campaigns", label: "Campaigns", count: campaigns.length }]} activeTab={tab} onTabChange={setTab} />
      </div>

      {tab === "segments" ? (
        <div className="space-y-4">
          {segments.map((s) => (
            <Card key={s.id} hover>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-violet-400/10 flex items-center justify-center shrink-0"><Users className="w-5 h-5 text-violet-400" /></div>
                  <div>
                    <h3 className="text-base font-semibold text-foreground">{s.name}</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">{s.desc}</p>
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-muted-foreground" /><span className="text-xs text-muted-foreground">{s.lastActivity}</span></div>
                      <span className="text-xs text-muted-foreground">Avg: {s.avgValue}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right"><p className="text-2xl font-bold text-foreground">{s.count.toLocaleString()}</p><p className="text-xs text-muted-foreground">contacts</p></div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {campaigns.map((c) => {
            const seg = segments.find((s) => s.id === c.segmentId);
            return (
              <Card key={c.id}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-semibold text-foreground">{c.name}</h3>
                    <p className="text-xs text-muted-foreground">Segment: {seg?.name || "Unknown"} &bull; Channel: {c.channel} &bull; Created: {c.createdAt}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={c.status === "sending" ? "info" : c.status === "completed" ? "success" : c.status === "paused" ? "warning" : "outline"}>{c.status}</Badge>
                    {(c.status === "sending" || c.status === "paused") && (
                      <button onClick={() => toggleCampaignStatus(c.id)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground cursor-pointer">
                        {c.status === "sending" ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>
                    )}
                    <button onClick={() => deleteCampaign(c.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive cursor-pointer">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div className="p-3 rounded-lg bg-secondary/30"><p className="text-xs text-muted-foreground">Sent</p><p className="text-lg font-semibold text-foreground">{c.sent.toLocaleString()}</p></div>
                  <div className="p-3 rounded-lg bg-secondary/30"><p className="text-xs text-muted-foreground">Recovered</p><p className="text-lg font-semibold text-success">{c.recovered.toLocaleString()}</p></div>
                  <div className="p-3 rounded-lg bg-secondary/30"><p className="text-xs text-muted-foreground">Revenue</p><p className="text-lg font-semibold text-foreground">{c.revenue}</p></div>
                  <div className="p-3 rounded-lg bg-secondary/30"><p className="text-xs text-muted-foreground">Rate</p><p className="text-lg font-semibold text-foreground">{c.sent > 0 ? Math.round((c.recovered / c.sent) * 100) : 0}%</p></div>
                </div>
                {c.sent > 0 && <ProgressBar value={c.recovered} max={c.sent} color="success" size="sm" />}
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={showNew} onClose={() => setShowNew(false)} title="Create Recovery Campaign">
        <div className="space-y-4">
          <Input label="Campaign Name *" placeholder="e.g. Q4 Reactivation" value={campName} onChange={setCampName} />
          <Select label="Target Segment" value={campSegment} onChange={setCampSegment} options={segments.map((s) => ({ value: s.id, label: `${s.name} (${s.count.toLocaleString()})` }))} />
          <Select label="Channel" value={campChannel} onChange={setCampChannel} options={[{ value: "multi", label: "Multi-Channel (Recommended)" }, { value: "email", label: "Email" }, { value: "whatsapp", label: "WhatsApp" }, { value: "sms", label: "SMS" }]} />
          <Select label="Offer Type" value={campOffer} onChange={setCampOffer} options={[{ value: "discount", label: "Discount" }, { value: "free-trial", label: "Free Trial" }, { value: "consultation", label: "Free Consultation" }, { value: "exclusive", label: "Exclusive Access" }]} />
          <Input label="Personalization Message" multiline placeholder="Hi {{name}}, we noticed you haven't been active lately..." value={campMessage} onChange={setCampMessage} rows={3} />
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowNew(false)} className="flex-1">Cancel</Button>
            <Button onClick={launchCampaign} className="flex-1" disabled={!campName.trim()}><Play className="w-4 h-4" />Launch Campaign</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
