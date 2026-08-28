"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import { Search, FileText, AlertTriangle, CheckCircle, Download, Globe, Wifi, WifiOff, Mail, Calendar, Share2, Users, ClipboardList, Target, ExternalLink, ArrowRight, Eye } from "lucide-react";
import { PageHeader, Card, Badge, Button, Input, Select, Modal, ProgressBar, StatCard } from "@/components/ui";

interface ScanFinding {
  id: string;
  category: string;
  label: string;
  detail: string;
  status: "found" | "missing" | "warning";
  icon: string;
}

interface AuditResult {
  companyName: string;
  industry: string;
  date: string;
  totalLeaks: number;
  criticalLeaks: number;
  estimatedAnnualSavings: string;
  leaks: Array<{ id: string; area: string; severity: string; description: string; impact: string; recommendation: string; estimatedSavings: string; source?: string; }>;
  score: number;
  scores: { lead_response: number; follow_up: number; data_entry: number; scheduling: number; reactivation: number; reporting: number; digital_presence?: number; };
  webResearch?: {
    hasWebsite: boolean;
    websiteScore: number;
    websiteTech?: string[];
    hasWhatsApp: boolean;
    hasSocialMedia: boolean;
    socialPlatforms: string[];
    hasOnlineBooking: boolean;
    hasCRM: boolean;
    hasEmailMarketing: boolean;
    hasLiveChat?: boolean;
    hasEcommerce?: boolean;
    digitalPresenceScore: number;
    quickWins: string[];
  };
  automationRecommendations?: {
    needs: string[];
    roles: Array<{ role: string; tasks: string[] }>;
    priorityActions: string[];
  };
}

export default function AuditPage() {
  const [showForm, setShowForm] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [website, setWebsite] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanPhase, setScanPhase] = useState("");
  const [findings, setFindings] = useState<ScanFinding[]>([]);
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [error, setError] = useState("");
  const [selectedLeak, setSelectedLeak] = useState<AuditResult["leaks"][0] | null>(null);
  const [auditHistory, setAuditHistory] = useState<AuditResult[]>([]);
  const findingCounter = useRef(0);

  const addFinding = useCallback((category: string, label: string, detail: string, status: "found" | "missing" | "warning", icon: string) => {
    findingCounter.current += 1;
    setFindings((prev) => [...prev, { id: `f-${findingCounter.current}`, category, label, detail, status, icon }]);
  }, []);

  const runAudit = useCallback(async () => {
    if (!companyName.trim()) { setError("Company name is required"); return; }
    setError("");
    setIsScanning(true);
    setScanProgress(0);
    setFindings([]);
    findingCounter.current = 0;

    const phases = [
      { pct: 5, text: "Searching for business online...", action: () => addFinding("Search", "Business lookup", `Searching for "${companyName}" across the web`, "found", "search") },
      { pct: 15, text: "Checking website...", action: () => addFinding("Website", "Website detection", website ? `Checking ${website}` : "Looking for website URL", "found", "globe") },
      { pct: 25, text: "Analyzing website technology...", action: () => addFinding("Technology", "Tech stack analysis", "Detecting frameworks, CMS, analytics tools", "found", "code") },
      { pct: 35, text: "Scanning social media profiles...", action: () => addFinding("Social Media", "Platform detection", "Checking Instagram, Facebook, LinkedIn, Twitter/X, TikTok", "found", "share") },
      { pct: 45, text: "Checking WhatsApp integration...", action: () => addFinding("WhatsApp", "Business API", "Checking for wa.me links or WhatsApp widget", "found", "message") },
      { pct: 55, text: "Checking booking systems...", action: () => addFinding("Booking", "Appointment system", "Looking for Calendly, scheduling tools, or booking forms", "found", "calendar") },
      { pct: 65, text: "Checking CRM and email tools...", action: () => addFinding("CRM", "Customer management", "Detecting HubSpot, Salesforce, Mailchimp, SendGrid", "found", "database") },
      { pct: 75, text: "Reviewing industry benchmarks...", action: () => addFinding("Industry", "Benchmark analysis", `Comparing against ${industry || "general"} industry data`, "found", "chart") },
      { pct: 85, text: "Identifying automation opportunities...", action: () => addFinding("Automation", "Opportunity scan", "Finding processes suitable for automation", "found", "zap") },
      { pct: 95, text: "Generating assessment...", action: () => addFinding("Assessment", "Final analysis", "Compiling findings into actionable report", "found", "file") },
    ];

    let phaseIdx = 0;
    const interval = setInterval(() => {
      if (phaseIdx < phases.length) {
        setScanProgress(phases[phaseIdx].pct);
        setScanPhase(phases[phaseIdx].text);
        phases[phaseIdx].action();
        phaseIdx++;
      }
    }, 600);

    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company_name: companyName, industry, website, name: contactName, email: contactEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Audit failed");

      clearInterval(interval);
      setScanProgress(100);
      setScanPhase("Analysis complete!");
      await new Promise((r) => setTimeout(r, 500));

      const result: AuditResult = {
        companyName: data.company,
        industry: data.industry,
        date: new Date().toISOString().split("T")[0],
        totalLeaks: data.leaks.length,
        criticalLeaks: data.criticalLeaks,
        estimatedAnnualSavings: `NGN ${data.totalSavings}`,
        leaks: data.leaks,
        score: data.overallScore,
        scores: data.scores,
        webResearch: data.webResearch,
        automationRecommendations: data.automationRecommendations,
      };

      setAuditResult(result);
      setAuditHistory((prev) => [result, ...prev]);
      setShowForm(false);
    } catch (err) {
      clearInterval(interval);
      setError(err instanceof Error ? err.message : "Audit failed");
    } finally {
      setIsScanning(false);
    }
  }, [companyName, industry, website, contactName, contactEmail, addFinding]);

  // Update findings when audit result comes in with real data
  useEffect(() => {
    if (auditResult?.webResearch) {
      const wr = auditResult.webResearch;
      // Update website finding
      setFindings((prev) => prev.map((f) =>
        f.label === "Website detection"
          ? { ...f, detail: wr.hasWebsite ? `Website found (score: ${wr.websiteScore}/100)` : "No website detected", status: wr.hasWebsite ? "found" : "missing" }
          : f.label === "Tech stack analysis"
          ? { ...f, detail: wr.websiteTech && wr.websiteTech.length > 0 ? `Detected: ${wr.websiteTech.join(", ")}` : "No specific tech detected", status: wr.websiteTech && wr.websiteTech.length > 0 ? "found" : "warning" }
          : f.label === "Platform detection"
          ? { ...f, detail: wr.socialPlatforms.length > 0 ? `Found: ${wr.socialPlatforms.join(", ")}` : "No social media detected on website", status: wr.socialPlatforms.length > 0 ? "found" : "missing" }
          : f.label === "Business API"
          ? { ...f, detail: wr.hasWhatsApp ? "WhatsApp Business detected" : "No WhatsApp integration found", status: wr.hasWhatsApp ? "found" : "missing" }
          : f.label === "Appointment system"
          ? { ...f, detail: wr.hasOnlineBooking ? "Booking system detected" : "No online booking found", status: wr.hasOnlineBooking ? "found" : "missing" }
          : f.label === "Customer management"
          ? { ...f, detail: `CRM: ${wr.hasCRM ? "Detected" : "None"}, Email: ${wr.hasEmailMarketing ? "Active" : "None"}, Chat: ${wr.hasLiveChat ? "Active" : "None"}`, status: (wr.hasCRM || wr.hasEmailMarketing) ? "found" : "warning" }
          : f
      ));
    }
  }, [auditResult]);

  const getScoreColor = (score: number) => score < 40 ? "text-red-400" : score < 70 ? "text-amber-400" : "text-emerald-400";
  const getScoreBg = (score: number) => score < 40 ? "bg-red-500" : score < 70 ? "bg-amber-500" : "bg-emerald-500";

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Automation Leak Audit"
        description="Real web research with actionable assessment"
        icon={<Search className="w-6 h-6" />}
        actions={
          <div className="flex gap-3">
            {auditResult && <Button variant="secondary" onClick={() => window.print()}><Download className="w-4 h-4" />Export</Button>}
            <Button onClick={() => setShowForm(true)}><Plus className="w-4 h-4" />New Audit</Button>
          </div>
        }
      />

      {/* Scanning Animation */}
      {isScanning && (
        <Card className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
              <Search className="w-5 h-5 text-primary animate-pulse" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold">Analyzing {companyName}</h3>
              <p className="text-xs text-zinc-500">{scanPhase}</p>
            </div>
            <span className="text-sm font-bold text-primary">{scanProgress}%</span>
          </div>
          <ProgressBar value={scanProgress} color="primary" size="md" />

          {/* Real-time findings */}
          <div className="mt-6 space-y-2 max-h-[400px] overflow-y-auto">
            {findings.map((f) => (
              <div key={f.id} className="flex items-center gap-3 p-3 rounded-lg bg-zinc-900/50 border border-zinc-800 animate-fade-in">
                <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 ${f.status === "found" ? "bg-emerald-500/10" : f.status === "missing" ? "bg-red-500/10" : "bg-amber-500/10"}`}>
                  {f.status === "found" ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> :
                   f.status === "missing" ? <span className="w-2 h-2 rounded-full bg-red-400" /> :
                   <span className="w-2 h-2 rounded-full bg-amber-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-zinc-300">{f.label}</span>
                    <span className="text-[10px] text-zinc-600 uppercase">{f.category}</span>
                  </div>
                  <p className="text-xs text-zinc-500 truncate">{f.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Audit Results */}
      {auditResult && !isScanning && (
        <>
          {/* Score Header */}
          <Card className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold">{auditResult.companyName}</h2>
                <p className="text-sm text-zinc-500">{auditResult.industry} &bull; {auditResult.date}</p>
              </div>
              <div className="text-right">
                <p className={`text-4xl font-bold ${getScoreColor(auditResult.score)}`}>{auditResult.score}</p>
                <p className="text-xs text-zinc-500">out of 100</p>
              </div>
            </div>
            <ProgressBar value={auditResult.score} color={auditResult.score < 40 ? "danger" : auditResult.score < 70 ? "warning" : "success"} size="md" />
          </Card>

          {/* Scan Findings Summary */}
          <Card className="mb-6">
            <h3 className="text-sm font-semibold mb-4 uppercase tracking-wider flex items-center gap-2">
              <Eye className="w-4 h-4 text-primary" /> What We Found
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {findings.filter((f) => f.category !== "Assessment" && f.category !== "Industry").map((f) => (
                <div key={f.id} className="flex items-center gap-3 p-3 rounded-lg border border-zinc-800">
                  <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 ${f.status === "found" ? "bg-emerald-500/10" : f.status === "missing" ? "bg-red-500/10" : "bg-amber-500/10"}`}>
                    {f.status === "found" ? <CheckCircle className="w-4 h-4 text-emerald-400" /> :
                     f.status === "missing" ? <span className="w-2.5 h-2.5 rounded-full bg-red-400" /> :
                     <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{f.label}</p>
                    <p className="text-xs text-zinc-500 truncate">{f.detail}</p>
                  </div>
                  <Badge variant={f.status === "found" ? "success" : f.status === "missing" ? "danger" : "warning"}>
                    {f.status === "found" ? "Found" : f.status === "missing" ? "Missing" : "Partial"}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard label="Leaks Found" value={auditResult.totalLeaks} icon={<AlertTriangle className="w-5 h-5" />} gradient="danger" />
            <StatCard label="Critical" value={auditResult.criticalLeaks} icon={<AlertTriangle className="w-5 h-5" />} gradient="danger" />
            <StatCard label="Est. Savings/yr" value={auditResult.estimatedAnnualSavings} icon={<FileText className="w-5 h-5" />} gradient="success" />
            <StatCard label="Digital Score" value={`${auditResult.webResearch?.digitalPresenceScore || 0}/100`} icon={<Globe className="w-5 h-5" />} gradient="primary" />
          </div>

          {/* Identified Leaks */}
          <Card className="mb-6">
            <h3 className="text-sm font-semibold mb-4 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" /> Identified Leaks
            </h3>
            <div className="space-y-3">
              {auditResult.leaks.map((leak) => (
                <div key={leak.id} className="p-4 rounded-lg border border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer" onClick={() => setSelectedLeak(leak)}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={leak.severity === "critical" ? "danger" : leak.severity === "high" ? "warning" : "outline"}>{leak.severity}</Badge>
                      <span className="text-sm font-semibold">{leak.area}</span>
                    </div>
                    <span className="text-xs text-zinc-500">{leak.estimatedSavings}</span>
                  </div>
                  <p className="text-xs text-zinc-400 mb-2">{leak.description}</p>
                  <p className="text-xs font-medium text-primary">{leak.recommendation}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Automation Recommendations */}
          {auditResult.automationRecommendations && (
            <Card className="mb-6">
              <h3 className="text-sm font-semibold mb-4 uppercase tracking-wider flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" /> Recommended Automations
              </h3>
              <div className="flex flex-wrap gap-2 mb-6">
                {auditResult.automationRecommendations.needs.map((n) => <Badge key={n} variant="info">{n}</Badge>)}
              </div>

              <h4 className="text-sm font-semibold mb-3 uppercase tracking-wider">Role-Based Task Assignments</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {auditResult.automationRecommendations.roles.map((role) => (
                  <div key={role.role} className="p-4 rounded-lg bg-zinc-900/50 border border-zinc-800">
                    <h5 className="text-sm font-semibold text-primary mb-3">{role.role}</h5>
                    <ul className="space-y-2">
                      {role.tasks.map((task, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-zinc-300">
                          <ClipboardList className="w-3.5 h-3.5 text-zinc-500 shrink-0 mt-0.5" />
                          {task}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Score Breakdown */}
          <Card className="mb-6">
            <h3 className="text-sm font-semibold mb-4 uppercase tracking-wider">Score Breakdown</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Lead Response", score: auditResult.scores.lead_response },
                { label: "Follow-Up", score: auditResult.scores.follow_up },
                { label: "Data Entry", score: auditResult.scores.data_entry },
                { label: "Scheduling", score: auditResult.scores.scheduling },
                { label: "Reactivation", score: auditResult.scores.reactivation },
                { label: "Reporting", score: auditResult.scores.reporting },
                { label: "Digital Presence", score: auditResult.scores.digital_presence || 50 },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-zinc-500">{item.label}</span>
                    <span className="font-medium">{item.score}%</span>
                  </div>
                  <ProgressBar value={item.score} color={item.score < 40 ? "danger" : item.score < 70 ? "warning" : "success"} size="sm" />
                </div>
              ))}
            </div>
          </Card>

          {/* CTA */}
          <Card className="text-center">
            <h3 className="text-lg font-bold mb-2">Ready to Fix These Leaks?</h3>
            <p className="text-sm text-zinc-400 mb-4">Book a free 15-minute call and we will implement the top priority automation for your business.</p>
            <div className="flex gap-3 justify-center">
              <a href="https://wa.me/2348012345678?text=Hi%20Elion%2C%20I%20just%20completed%20an%20audit%20for%20my%20business" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded font-medium hover:bg-emerald-700 transition-colors">
                <Share2 className="w-4 h-4" /> WhatsApp Us
              </a>
              <a href="mailto:hello@elion.ng?subject=Audit%20Results%20-%20" className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-800 text-white rounded font-medium hover:bg-zinc-700 transition-colors">
                <Mail className="w-4 h-4" /> Email Us
              </a>
            </div>
          </Card>
        </>
      )}

      {/* Empty State */}
      {!auditResult && !isScanning && (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded bg-zinc-800 flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-zinc-600" />
          </div>
          <h2 className="text-xl font-bold mb-2">Run Your First Audit</h2>
          <p className="text-sm text-zinc-500 max-w-md mx-auto mb-6">Enter a company name and we will search the web, analyze their digital presence, and identify automation opportunities.</p>
          <Button onClick={() => setShowForm(true)}><Search className="w-4 h-4" />Start Free Audit</Button>
        </div>
      )}

      {/* Audit Form Modal */}
      <Modal open={showForm} onClose={() => { setShowForm(false); setError(""); }} title="Run Automation Audit">
        <div className="space-y-4">
          {error && <div className="p-3 rounded bg-red-500/10 border border-red-500/20 text-sm text-red-400">{error}</div>}
          <Input label="Company Name *" placeholder="e.g. Shoprite Nigeria" value={companyName} onChange={setCompanyName} />
          <Input label="Website" placeholder="e.g. shoprite.com.ng" value={website} onChange={setWebsite} />
          <Select label="Industry" value={industry} onChange={setIndustry} options={[
            { value: "", label: "Select industry" },
            { value: "Real Estate", label: "Real Estate" },
            { value: "Healthcare", label: "Healthcare" },
            { value: "Education", label: "Education" },
            { value: "E-Commerce", label: "E-Commerce" },
            { value: "Professional Services", label: "Professional Services" },
            { value: "Financial Services", label: "Financial Services" },
            { value: "Recruitment", label: "Recruitment" },
            { value: "General", label: "Other" },
          ]} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Your Name" placeholder="Your name" value={contactName} onChange={setContactName} />
            <Input label="Your Email" placeholder="you@company.com" value={contactEmail} onChange={setContactEmail} />
          </div>
          <Button onClick={runAudit} disabled={isScanning || !companyName.trim()} className="w-full">
            <Search className="w-4 h-4" />{isScanning ? "Scanning..." : "Run Audit"}
          </Button>
        </div>
      </Modal>

      {/* Leak Detail Modal */}
      <Modal open={!!selectedLeak} onClose={() => setSelectedLeak(null)} title={selectedLeak?.area || ""}>
        {selectedLeak && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant={selectedLeak.severity === "critical" ? "danger" : selectedLeak.severity === "high" ? "warning" : "outline"}>{selectedLeak.severity}</Badge>
              <span className="text-sm font-semibold">{selectedLeak.estimatedSavings}</span>
            </div>
            <p className="text-sm text-zinc-300">{selectedLeak.description}</p>
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
              <p className="text-xs font-semibold text-primary mb-1">Recommendation</p>
              <p className="text-sm text-zinc-300">{selectedLeak.recommendation}</p>
            </div>
            <div className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800">
              <p className="text-xs font-semibold text-zinc-400 mb-1">Business Impact</p>
              <p className="text-sm text-zinc-300">{selectedLeak.impact}</p>
            </div>
            {selectedLeak.source && (
              <p className="text-[11px] text-zinc-600">Source: {selectedLeak.source}</p>
            )}
          </div>
        )}
      </Modal>

      {/* Audit History */}
      {auditHistory.length > 1 && (
        <Card className="mt-6">
          <h3 className="text-sm font-semibold mb-3 uppercase tracking-wider">Previous Audits</h3>
          <div className="space-y-2">
            {auditHistory.slice(1).map((h) => (
              <div key={h.date + h.companyName} className="flex items-center justify-between p-3 rounded-lg border border-zinc-800 hover:border-zinc-700 cursor-pointer transition-colors" onClick={() => { setAuditResult(h); setFindings([]); }}>
                <div>
                  <p className="text-sm font-medium">{h.companyName}</p>
                  <p className="text-xs text-zinc-500">{h.industry} &bull; {h.date}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-lg font-bold ${getScoreColor(h.score)}`}>{h.score}</span>
                  <ArrowRight className="w-4 h-4 text-zinc-600" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function Plus({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
