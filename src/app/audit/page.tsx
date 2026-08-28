"use client";
import { useState, useCallback } from "react";
import { Search, FileText, AlertTriangle, CheckCircle, Download, Plus, BarChart3, ExternalLink, Loader2, Globe, Wifi, WifiOff, Mail, Calendar, Share2, Eye, Users, ClipboardList, Target } from "lucide-react";
import { PageHeader, Card, Badge, Button, Input, Select, Modal, ProgressBar, StatCard, EmptyState } from "@/components/ui";

interface Leak { id: string; area: string; severity: "critical" | "high" | "medium" | "low"; description: string; impact: string; recommendation: string; estimatedSavings: string; source?: string; }
interface WebResearch { hasWebsite: boolean; websiteScore: number; websiteTech?: string[]; hasWhatsApp: boolean; hasSocialMedia: boolean; socialPlatforms: string[]; hasOnlineBooking: boolean; hasCRM: boolean; hasEmailMarketing: boolean; hasLiveChat?: boolean; hasEcommerce?: boolean; digitalPresenceScore: number; quickWins: string[]; }
interface RoleAssignment { role: string; tasks: string[]; }
interface AuditResult {
  companyName: string; industry: string; date: string; totalLeaks: number; criticalLeaks: number;
  estimatedAnnualSavings: string; leaks: Leak[]; score: number;
  scores: { lead_response: number; follow_up: number; data_entry: number; scheduling: number; reactivation: number; reporting: number; digital_presence?: number; };
  webResearch?: WebResearch;
  automationRecommendations?: { needs: string[]; roles: RoleAssignment[]; priorityActions: string[]; };
}

function generatePDFReport(result: AuditResult) {
  const now = new Date();
  const html = `<!DOCTYPE html>
<html><head><title>Elion Automation Audit - ${result.companyName}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', system-ui, sans-serif; color: #1a1a2e; padding: 40px; line-height: 1.6; }
  .header { text-align: center; margin-bottom: 40px; border-bottom: 3px solid #6366f1; padding-bottom: 20px; }
  .header h1 { font-size: 28px; color: #6366f1; margin-bottom: 8px; }
  .header p { color: #6b7280; font-size: 14px; }
  h2 { font-size: 20px; color: #374151; margin: 30px 0 16px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; }
  h3 { font-size: 16px; color: #4b5563; margin: 20px 0 12px; }
  .score-box { display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; font-size: 32px; font-weight: bold; }
  .score-label { color: #6b7280; font-size: 12px; }
  table { width: 100%; border-collapse: collapse; margin: 16px 0; }
  th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
  th { background: #f3f4f6; font-weight: 600; font-size: 12px; text-transform: uppercase; }
  .metric { background: #f3f4f6; padding: 16px; border-radius: 8px; text-align: center; display: inline-block; margin: 8px; min-width: 120px; }
  .metric h3 { font-size: 24px; color: #6366f1; margin: 0; }
  .metric p { font-size: 11px; color: #6b7280; margin: 4px 0 0; }
  .critical { color: #ef4444; font-weight: 600; }
  .high { color: #f59e0b; font-weight: 600; }
  .medium { color: #3b82f6; font-weight: 600; }
  .low { color: #6b7280; }
  .role-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 12px 0; }
  .role-card h4 { color: #6366f1; font-size: 14px; margin-bottom: 8px; }
  .task-list { list-style: none; padding: 0; }
  .task-list li { padding: 4px 0; font-size: 13px; color: #374151; }
  .task-list li::before { content: "□ "; color: #6366f1; font-weight: bold; }
  .footer { margin-top: 40px; padding-top: 16px; border-top: 2px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 12px; }
  @media print { body { padding: 20px; } }
</style></head><body>
  <div class="header">
    <h1>Automation Leak Audit Report</h1>
    <p>${result.companyName} | ${result.industry} | Generated ${now.toLocaleDateString()}</p>
  </div>
  <div style="text-align:center;margin:20px 0">
    <div class="score-box">${result.score}</div>
    <div class="score-label">out of 100</div>
  </div>
  <div style="text-align:center">
    <div class="metric"><h3>${result.totalLeaks}</h3><p>Leaks Found</p></div>
    <div class="metric"><h3>${result.criticalLeaks}</h3><p>Critical Issues</p></div>
    <div class="metric"><h3>NGN ${result.estimatedAnnualSavings}</h3><p>Est. Annual Savings</p></div>
  </div>
  ${result.webResearch ? `<h2>Web Research Findings</h2>
  <table>
    <tr><th>Check</th><th>Result</th></tr>
    <tr><td>Website</td><td>${result.webResearch.hasWebsite ? `Yes (Score: ${result.webResearch.websiteScore}/100)` : "Not found"}</td></tr>
    <tr><td>WhatsApp Business</td><td>${result.webResearch.hasWhatsApp ? "Integrated" : "Not detected"}</td></tr>
    <tr><td>Social Media</td><td>${result.webResearch.hasSocialMedia ? result.webResearch.socialPlatforms.join(", ") : "Not detected"}</td></tr>
    <tr><td>Online Booking</td><td>${result.webResearch.hasOnlineBooking ? "Available" : "Not detected"}</td></tr>
    <tr><td>Email Marketing</td><td>${result.webResearch.hasEmailMarketing ? "Active" : "Not detected"}</td></tr>
    <tr><td>CRM</td><td>${result.webResearch.hasCRM ? "Integrated" : "Not detected"}</td></tr>
    <tr><td>Digital Presence Score</td><td>${result.webResearch.digitalPresenceScore}/100</td></tr>
  </table>` : ""}
  <h2>Identified Leaks</h2>
  <table>
    <tr><th>Area</th><th>Severity</th><th>Impact</th><th>Savings</th></tr>
    ${result.leaks.map((l) => `<tr><td><strong>${l.area}</strong><br><small>${l.description.substring(0, 100)}...</small></td><td class="${l.severity}">${l.severity}</td><td>${l.impact}</td><td>${l.estimatedSavings}</td></tr>`).join("")}
  </table>
  ${result.automationRecommendations ? `<h2>Recommended Automations</h2>
  <p style="color:#6b7280;margin-bottom:16px">Based on your industry (${result.industry}) and web research, here are the automations we recommend:</p>
  ${result.automationRecommendations.needs.map((n) => `<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:8px 12px;margin:4px 0;display:inline-block;font-size:13px;color:#166534">✓ ${n}</div>`).join(" ")}
  <h2>Role-Based Task Assignments</h2>
  <p style="color:#6b7280;margin-bottom:16px">Here are the specific tasks each role should be assigned once automations are implemented:</p>
  ${result.automationRecommendations.roles.map((r) => `<div class="role-card"><h4>${r.role}</h4><ul class="task-list">${r.tasks.map((t) => `<li>${t}</li>`).join("")}</ul></div>`).join("")}
  <h2>Priority Actions</h2>
  <ol style="padding-left:20px">${result.automationRecommendations.priorityActions.map((a) => `<li style="padding:4px 0;font-size:13px">${a}</li>`).join("")}</ol>` : ""}
  <div class="footer">
    <p>Generated by Elion AI Agency | elion.ng | ${now.toLocaleString()}</p>
    <p>This audit is based on industry benchmarks and web research. Actual savings may vary based on implementation.</p>
  </div>
</body></html>`;
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `elion-audit-${result.companyName.toLowerCase().replace(/\s+/g, "-")}-${now.toISOString().split("T")[0]}.html`; a.click();
  URL.revokeObjectURL(url);
}

export default function AuditPage() {
  const [showNewAudit, setShowNewAudit] = useState(false);
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [auditHistory, setAuditHistory] = useState<AuditResult[]>([]);
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [website, setWebsite] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanPhase, setScanPhase] = useState("");
  const [error, setError] = useState("");
  const [selectedLeakDetail, setSelectedLeakDetail] = useState<Leak | null>(null);

  const runAudit = useCallback(async () => {
    if (!companyName.trim()) { setError("Company name is required"); return; }
    setError(""); setIsScanning(true); setScanProgress(0);

    const phases = [
      { pct: 10, text: "Searching for business online..." },
      { pct: 25, text: "Analyzing website and digital presence..." },
      { pct: 40, text: "Checking social media profiles..." },
      { pct: 55, text: "Reviewing industry benchmarks..." },
      { pct: 70, text: "Analyzing lead flow patterns..." },
      { pct: 85, text: "Identifying automation opportunities..." },
      { pct: 95, text: "Generating recommendations..." },
    ];

    let phaseIdx = 0;
    const interval = setInterval(() => {
      if (phaseIdx < phases.length) { setScanProgress(phases[phaseIdx].pct); setScanPhase(phases[phaseIdx].text); phaseIdx++; }
    }, 500);

    try {
      const res = await fetch("/api/audit", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company_name: companyName, industry, website, name: contactName, email: contactEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Audit failed");

      clearInterval(interval); setScanProgress(100); setScanPhase("Complete!");
      await new Promise((r) => setTimeout(r, 500));

      const result: AuditResult = {
        companyName: data.company, industry: data.industry,
        date: new Date().toISOString().split("T")[0],
        totalLeaks: data.leaks.length, criticalLeaks: data.criticalLeaks,
        estimatedAnnualSavings: `NGN ${data.totalSavings}`,
        leaks: data.leaks.map((l: Record<string, string>) => ({ ...l })),
        score: data.overallScore, scores: data.scores,
        webResearch: data.webResearch, automationRecommendations: data.automationRecommendations,
      };

      setAuditResult(result);
      setAuditHistory((prev) => [result, ...prev]);
      setShowNewAudit(false);
    } catch (err) {
      clearInterval(interval); setError(err instanceof Error ? err.message : "Audit failed");
    } finally { setIsScanning(false); }
  }, [companyName, industry, website, contactName, contactEmail]);

  return (
    <div className="animate-fade-in">
      <PageHeader title="Automation Leak Audit" description="Research-powered analysis with role-based task assignments" icon={<Search className="w-6 h-6" />}
        actions={<div className="flex gap-3">
          {auditResult && <Button variant="secondary" onClick={() => { generatePDFReport(auditResult); }}><Download className="w-4 h-4" />Export Report</Button>}
          <Button onClick={() => setShowNewAudit(true)}><Plus className="w-4 h-4" />New Audit</Button>
        </div>} />

      {auditResult ? (
        <>
          {/* Company Header */}
          <Card className="mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center"><FileText className="w-6 h-6 text-primary" /></div>
                <div><h3 className="text-lg font-semibold text-foreground">{auditResult.companyName}</h3><p className="text-sm text-muted-foreground">{auditResult.industry} &bull; Audit completed {auditResult.date}</p></div>
              </div>
              <div className="flex gap-3 no-print">
                <Button variant="secondary" size="sm" onClick={() => generatePDFReport(auditResult)}><Download className="w-4 h-4" />Export Report</Button>
                <Button size="sm" onClick={() => window.open(process.env.NEXT_PUBLIC_N8N_URL || "http://localhost:5678", "_blank")}><ExternalLink className="w-4 h-4" />Start Implementation</Button>
              </div>
            </div>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 stagger-children">
            <StatCard label="Automation Score" value={`${auditResult.score}/100`} icon={<BarChart3 className="w-5 h-5" />} gradient={auditResult.score < 40 ? "danger" : auditResult.score < 70 ? "warning" : "success"} />
            <StatCard label="Leaks Found" value={auditResult.totalLeaks} icon={<AlertTriangle className="w-5 h-5" />} gradient="danger" />
            <StatCard label="Critical Issues" value={auditResult.criticalLeaks} icon={<AlertTriangle className="w-5 h-5" />} gradient="danger" />
            <StatCard label="Est. Annual Savings" value={auditResult.estimatedAnnualSavings} icon={<FileText className="w-5 h-5" />} gradient="success" />
          </div>

          {/* Web Research Findings */}
          {auditResult.webResearch && (
            <Card className="mb-6">
              <h3 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider flex items-center gap-2"><Globe className="w-4 h-4 text-primary" /> Web Research Findings</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className={`p-3 rounded-lg ${auditResult.webResearch.hasWebsite ? "bg-success/5 border border-success/20" : "bg-destructive/5 border border-destructive/20"}`}>
                  <div className="flex items-center gap-2 mb-1"><Globe className={`w-4 h-4 ${auditResult.webResearch.hasWebsite ? "text-success" : "text-destructive"}`} /><span className="text-sm font-medium text-foreground">Website</span></div>
                  <p className="text-xs text-muted-foreground">{auditResult.webResearch.hasWebsite ? `Score: ${auditResult.webResearch.websiteScore}/100` : "Not found"}</p>
                </div>
                <div className={`p-3 rounded-lg ${auditResult.webResearch.hasWhatsApp ? "bg-success/5 border border-success/20" : "bg-destructive/5 border border-destructive/20"}`}>
                  <div className="flex items-center gap-2 mb-1">{auditResult.webResearch.hasWhatsApp ? <Wifi className="w-4 h-4 text-success" /> : <WifiOff className="w-4 h-4 text-destructive" />}<span className="text-sm font-medium text-foreground">WhatsApp</span></div>
                  <p className="text-xs text-muted-foreground">{auditResult.webResearch.hasWhatsApp ? "Integrated" : "Not detected"}</p>
                </div>
                <div className={`p-3 rounded-lg ${auditResult.webResearch.hasOnlineBooking ? "bg-success/5 border border-success/20" : "bg-warning/5 border border-warning/20"}`}>
                  <div className="flex items-center gap-2 mb-1"><Calendar className={`w-4 h-4 ${auditResult.webResearch.hasOnlineBooking ? "text-success" : "text-warning"}`} /><span className="text-sm font-medium text-foreground">Booking</span></div>
                  <p className="text-xs text-muted-foreground">{auditResult.webResearch.hasOnlineBooking ? "Available" : "Not detected"}</p>
                </div>
                <div className={`p-3 rounded-lg ${auditResult.webResearch.hasEmailMarketing ? "bg-success/5 border border-success/20" : "bg-warning/5 border border-warning/20"}`}>
                  <div className="flex items-center gap-2 mb-1"><Mail className={`w-4 h-4 ${auditResult.webResearch.hasEmailMarketing ? "text-success" : "text-warning"}`} /><span className="text-sm font-medium text-foreground">Email Marketing</span></div>
                  <p className="text-xs text-muted-foreground">{auditResult.webResearch.hasEmailMarketing ? "Active" : "Not detected"}</p>
                </div>
              </div>
              {auditResult.webResearch.socialPlatforms.length > 0 && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30"><Share2 className="w-4 h-4 text-muted-foreground" /><span className="text-sm text-foreground">Social Media: </span><div className="flex gap-2">{auditResult.webResearch.socialPlatforms.map((p) => <Badge key={p} variant="info">{p}</Badge>)}</div></div>
              )}
              {auditResult.webResearch.quickWins.length > 0 && (
                <div className="mt-4"><p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Quick Wins from Research</p>
                  <div className="space-y-2">{auditResult.webResearch.quickWins.map((rec, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-primary/5 border border-primary/10"><CheckCircle className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" /><p className="text-xs text-foreground">{rec}</p></div>
                  ))}</div>
                </div>
              )}
            </Card>
          )}

          {/* Score & Priority */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
            <Card className="lg:col-span-2">
              <h3 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider">Automation Readiness Score</h3>
              <div className="flex items-end gap-6 mb-6">
                <div><p className="text-5xl font-bold text-foreground">{auditResult.score}</p><p className="text-sm text-muted-foreground mt-1">out of 100</p></div>
                <div className="flex-1 pb-2"><ProgressBar value={auditResult.score} color={auditResult.score < 40 ? "danger" : auditResult.score < 70 ? "warning" : "success"} size="md" /></div>
              </div>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
                {[{ label: "Lead Response", score: auditResult.scores.lead_response }, { label: "Follow-Up", score: auditResult.scores.follow_up },
                  { label: "Data Entry", score: auditResult.scores.data_entry }, { label: "Scheduling", score: auditResult.scores.scheduling },
                  { label: "Reactivation", score: auditResult.scores.reactivation }, { label: "Reporting", score: auditResult.scores.reporting },
                  { label: "Digital Presence", score: auditResult.scores.digital_presence || 50 },
                ].map((item) => (
                  <div key={item.label}><div className="flex justify-between text-xs mb-1"><span className="text-muted-foreground">{item.label}</span><span className="text-foreground font-medium">{item.score}%</span></div><ProgressBar value={item.score} color={item.score < 40 ? "danger" : item.score < 70 ? "warning" : "success"} size="sm" /></div>
                ))}
              </div>
            </Card>
            <Card>
              <h3 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider">Priority Actions</h3>
              <div className="space-y-3">
                {auditResult.leaks.filter((l) => l.severity === "critical" || l.severity === "high").slice(0, 4).map((leak) => (
                  <div key={leak.id} className={`p-3 rounded-lg border cursor-pointer transition-all hover:scale-[1.01] ${leak.severity === "critical" ? "bg-destructive/5 border-destructive/20 hover:border-destructive/40" : "bg-warning/5 border-warning/20 hover:border-warning/40"}`} onClick={() => setSelectedLeakDetail(leak)}>
                    <div className="flex items-center gap-2 mb-1"><AlertTriangle className={`w-3.5 h-3.5 ${leak.severity === "critical" ? "text-destructive" : "text-warning"}`} /><span className="text-sm font-medium text-foreground">{leak.area}</span></div>
                    <p className="text-xs text-muted-foreground">{leak.impact}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Automation Recommendations */}
          {auditResult.automationRecommendations && (
            <Card className="mb-6">
              <h3 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider flex items-center gap-2"><Target className="w-4 h-4 text-primary" /> Recommended Automations</h3>
              <div className="flex flex-wrap gap-2 mb-6">{auditResult.automationRecommendations.needs.map((n) => <Badge key={n} variant="info">{n}</Badge>)}</div>

              <h4 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wider flex items-center gap-2"><Users className="w-4 h-4 text-primary" /> Role-Based Task Assignments</h4>
              <p className="text-xs text-muted-foreground mb-4">Once automations are implemented, these are the tasks each role should be assigned:</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {auditResult.automationRecommendations.roles.map((role) => (
                  <div key={role.role} className="p-4 rounded-xl bg-secondary/30 border border-border/50">
                    <h5 className="text-sm font-semibold text-primary mb-3">{role.role}</h5>
                    <ul className="space-y-2">{role.tasks.map((task, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-foreground"><ClipboardList className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />{task}</li>
                    ))}</ul>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* All Leaks Table */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">All Identified Leaks</h3>
              <div className="flex gap-2">
                <Badge variant="danger">{auditResult.leaks.filter((l) => l.severity === "critical").length} Critical</Badge>
                <Badge variant="warning">{auditResult.leaks.filter((l) => l.severity === "high").length} High</Badge>
                <Badge variant="info">{auditResult.leaks.filter((l) => l.severity === "medium").length} Medium</Badge>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-border"><th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-4">Area</th><th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-4">Severity</th><th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-4">Description</th><th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-4">Savings</th><th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-4">Source</th></tr></thead>
                <tbody>{auditResult.leaks.map((leak) => (
                  <tr key={leak.id} className="border-b border-border/50 hover:bg-secondary/30 cursor-pointer" onClick={() => setSelectedLeakDetail(leak)}>
                    <td className="py-3 px-4 text-sm font-medium text-foreground">{leak.area}</td>
                    <td className="py-3 px-4"><Badge variant={leak.severity === "critical" ? "danger" : leak.severity === "high" ? "warning" : "info"}>{leak.severity}</Badge></td>
                    <td className="py-3 px-4 text-xs text-muted-foreground max-w-xs">{leak.description.substring(0, 120)}...</td>
                    <td className="py-3 px-4 text-sm font-semibold text-success">{leak.estimatedSavings}</td>
                    <td className="py-3 px-4 text-xs text-muted-foreground">{leak.source || "Industry benchmark"}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </Card>

          {/* Audit History */}
          {auditHistory.length > 1 && (
            <Card className="mt-6">
              <h3 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider">Audit History</h3>
              <div className="space-y-2">{auditHistory.map((a, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-secondary/20 hover:bg-secondary/40 transition-colors cursor-pointer" onClick={() => setAuditResult(a)}>
                  <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center"><FileText className="w-4 h-4 text-primary" /></div><div><p className="text-sm font-medium text-foreground">{a.companyName}</p><p className="text-xs text-muted-foreground">{a.industry} &bull; {a.date}</p></div></div>
                  <div className="flex items-center gap-4"><div className="text-right"><p className="text-sm font-semibold text-foreground">{a.score}/100</p><p className="text-xs text-muted-foreground">{a.totalLeaks} leaks</p></div><Badge variant={a.score < 40 ? "danger" : a.score < 70 ? "warning" : "success"}>{a.score < 40 ? "Poor" : a.score < 70 ? "Fair" : "Good"}</Badge></div>
                </div>
              ))}</div>
            </Card>
          )}
        </>
      ) : (
        <EmptyState icon={<Search className="w-8 h-8" />} title="No audits yet" description="Run your first automation leak audit. We research your business online, identify leaks, and recommend specific automations with role-based task assignments." action={<Button onClick={() => setShowNewAudit(true)}><Plus className="w-4 h-4" />Start First Audit</Button>} />
      )}

      {/* New Audit Modal */}
      <Modal open={showNewAudit} onClose={() => { setShowNewAudit(false); setIsScanning(false); }} title="New Automation Audit">
        {isScanning ? (
          <div className="py-8">
            <div className="text-center mb-6"><div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div><h3 className="text-lg font-semibold text-foreground mb-1">Researching {companyName}...</h3><p className="text-sm text-muted-foreground">{scanPhase}</p></div>
            <ProgressBar value={scanProgress} color="primary" /><p className="text-xs text-muted-foreground text-center mt-3">{scanProgress}% complete</p>
          </div>
        ) : (
          <div className="space-y-4">
            {error && <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20"><p className="text-sm text-destructive">{error}</p></div>}
            <Input label="Company Name *" placeholder="e.g. Lagos Properties Ltd" value={companyName} onChange={setCompanyName} />
            <Select label="Industry" value={industry} onChange={setIndustry} options={[{ value: "", label: "Select industry..." }, { value: "Real Estate", label: "Real Estate" }, { value: "Healthcare", label: "Healthcare" }, { value: "Education", label: "Education" }, { value: "Recruitment", label: "Recruitment" }, { value: "E-Commerce", label: "E-Commerce" }, { value: "Professional Services", label: "Professional Services" }, { value: "Financial Services", label: "Financial Services" }]} />
            <Input label="Website (optional)" placeholder="https://example.com" value={website} onChange={setWebsite} />
            <div className="grid grid-cols-2 gap-4"><Input label="Your Name" placeholder="Full name" value={contactName} onChange={setContactName} /><Input label="Your Email" placeholder="email@company.com" value={contactEmail} onChange={setContactEmail} /></div>
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/10"><p className="text-xs text-primary font-medium mb-1">What we research & deliver</p><ul className="text-xs text-muted-foreground space-y-1"><li>• Website analysis and quality score</li><li>• WhatsApp, social media, booking detection</li><li>• Industry-specific automation recommendations</li><li>• Role-based task assignments for each team member</li><li>• Exportable PDF report with all findings</li></ul></div>
            <div className="flex gap-3 pt-2"><Button variant="secondary" onClick={() => { setShowNewAudit(false); setError(""); }} className="flex-1">Cancel</Button><Button onClick={runAudit} className="flex-1" disabled={!companyName.trim()}><Search className="w-4 h-4" />Run Audit</Button></div>
          </div>
        )}
      </Modal>

      {/* Leak Detail Modal */}
      <Modal open={!!selectedLeakDetail} onClose={() => setSelectedLeakDetail(null)} title="Leak Details">
        {selectedLeakDetail && (() => {
          const live = auditResult?.leaks.find((l) => l.id === selectedLeakDetail.id) || selectedLeakDetail;
          return (
            <div className="space-y-4">
              <div className="flex items-center gap-3"><Badge variant={live.severity === "critical" ? "danger" : live.severity === "high" ? "warning" : "info"}>{live.severity}</Badge><h3 className="text-lg font-semibold text-foreground">{live.area}</h3></div>
              <div className="p-4 rounded-lg bg-secondary/30"><p className="text-sm text-foreground leading-relaxed">{live.description}</p></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/20"><p className="text-xs text-muted-foreground mb-1">Business Impact</p><p className="text-sm font-semibold text-destructive">{live.impact}</p></div>
                <div className="p-3 rounded-lg bg-success/5 border border-success/20"><p className="text-xs text-muted-foreground mb-1">Potential Savings</p><p className="text-sm font-semibold text-success">{live.estimatedSavings}</p></div>
              </div>
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/10"><p className="text-xs font-medium text-primary mb-1">Recommended Action</p><p className="text-sm text-foreground">{live.recommendation}</p></div>
              {live.source && <div className="p-3 rounded-lg bg-secondary/20"><p className="text-xs text-muted-foreground"><span className="font-medium">Data Source:</span> {live.source}</p></div>}
              <Button className="w-full" onClick={() => window.open(process.env.NEXT_PUBLIC_N8N_URL || "http://localhost:5678", "_blank")}><ExternalLink className="w-4 h-4" />Start Implementation in n8n</Button>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}
