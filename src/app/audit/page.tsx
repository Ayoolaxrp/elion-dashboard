"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import {
  Search, FileText, AlertTriangle, CheckCircle, Download, Globe,
  Mail, Calendar, Share2, Users, ClipboardList, Target, ExternalLink,
  ArrowRight, Eye, TrendingDown, TrendingUp, Shield, Zap, BarChart3,
  Printer, ChevronDown, ChevronUp, X, Loader2,
} from "lucide-react";
import { PageHeader, Card, Badge, Button, Input, Select, Modal, ProgressBar, StatCard } from "@/components/ui";

/* ──────────── Types ──────────── */

interface ScanFinding {
  id: string;
  category: string;
  label: string;
  detail: string;
  status: "found" | "missing" | "warning";
  icon: string;
}

interface Leak {
  id: string;
  area: string;
  severity: "critical" | "high" | "medium" | "low";
  description: string;
  impact: string;
  recommendation: string;
  estimatedSavings: string;
  source: string;
  evidence?: string[];
}

interface AuditResult {
  companyName: string;
  industry: string;
  date: string;
  totalLeaks: number;
  criticalLeaks: number;
  highLeaks: number;
  estimatedAnnualSavings: string;
  leaks: Leak[];
  score: number;
  scores: {
    lead_response: number;
    follow_up: number;
    data_entry: number;
    scheduling: number;
    reactivation: number;
    reporting: number;
    digital_presence?: number;
  };
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

/* ──────────── Helper: severity config ──────────── */

const SEVERITY_CONFIG = {
  critical: { color: "text-red-600", bg: "bg-red-50", border: "border-red-200", dot: "bg-red-500" },
  high: { color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", dot: "bg-amber-500" },
  medium: { color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", dot: "bg-blue-500" },
  low: { color: "text-zinc-500", bg: "bg-zinc-50", border: "border-zinc-200", dot: "bg-zinc-400" },
};

/* ──────────── Component ──────────── */

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
  const [selectedLeak, setSelectedLeak] = useState<Leak | null>(null);
  const [auditHistory, setAuditHistory] = useState<AuditResult[]>([]);
  const [expandedLeakId, setExpandedLeakId] = useState<string | null>(null);
  const findingCounter = useRef(0);

  const addFinding = useCallback(
    (category: string, label: string, detail: string, status: "found" | "missing" | "warning", icon: string) => {
      findingCounter.current += 1;
      setFindings((prev) => [...prev, { id: `f-${findingCounter.current}`, category, label, detail, status, icon }]);
    },
    [],
  );

  /* ──── Run Audit ──── */

  const runAudit = useCallback(async () => {
    if (!companyName.trim()) {
      setError("Company name is required");
      return;
    }
    setError("");
    setIsScanning(true);
    setScanProgress(0);
    setFindings([]);
    findingCounter.current = 0;

    const phases = [
      { pct: 8, text: "Searching for business online...", action: () => addFinding("Search", "Business lookup", `Searching for "${companyName}" across the web`, "found", "search") },
      { pct: 18, text: "Checking website...", action: () => addFinding("Website", "Website detection", website ? `Checking ${website}` : "Looking for website URL", "found", "globe") },
      { pct: 28, text: "Analyzing website technology...", action: () => addFinding("Technology", "Tech stack analysis", "Detecting frameworks, CMS, analytics tools", "found", "code") },
      { pct: 38, text: "Scanning social media profiles...", action: () => addFinding("Social Media", "Platform detection", "Checking Instagram, Facebook, LinkedIn, Twitter/X, TikTok", "found", "share") },
      { pct: 48, text: "Checking WhatsApp integration...", action: () => addFinding("WhatsApp", "Business API", "Checking for wa.me links or WhatsApp widget", "found", "message") },
      { pct: 58, text: "Checking booking systems...", action: () => addFinding("Booking", "Appointment system", "Looking for Calendly, scheduling tools, or booking forms", "found", "calendar") },
      { pct: 68, text: "Checking CRM and email tools...", action: () => addFinding("CRM", "Customer management", "Detecting HubSpot, Salesforce, Mailchimp, SendGrid", "found", "database") },
      { pct: 78, text: "Reviewing industry benchmarks...", action: () => addFinding("Industry", "Benchmark analysis", `Comparing against ${industry || "general"} industry data`, "found", "chart") },
      { pct: 88, text: "Identifying automation opportunities...", action: () => addFinding("Automation", "Opportunity scan", "Finding processes suitable for automation", "found", "zap") },
      { pct: 96, text: "Compiling assessment...", action: () => addFinding("Assessment", "Final analysis", "Building your personalized report", "found", "file") },
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
        body: JSON.stringify({
          company_name: companyName,
          industry,
          website,
          name: contactName,
          email: contactEmail,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Audit failed");

      clearInterval(interval);
      setScanProgress(100);
      setScanPhase("Analysis complete");
      await new Promise((r) => setTimeout(r, 500));

      const result: AuditResult = {
        companyName: data.company,
        industry: data.industry,
        date: new Date().toISOString().split("T")[0],
        totalLeaks: data.leaks.length,
        criticalLeaks: data.criticalLeaks,
        highLeaks: data.highLeaks,
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

  /* ──── Update findings when audit result arrives ──── */

  useEffect(() => {
    if (auditResult?.webResearch) {
      const wr = auditResult.webResearch;
      setFindings((prev) =>
        prev.map((f) => {
          if (f.label === "Website detection") {
            return { ...f, detail: wr.hasWebsite ? `Scored ${wr.websiteScore}/100` : "No website detected", status: wr.hasWebsite ? "found" : "missing" };
          }
          if (f.label === "Tech stack analysis") {
            return { ...f, detail: wr.websiteTech && wr.websiteTech.length > 0 ? wr.websiteTech.join(", ") : "No specific tech detected", status: wr.websiteTech && wr.websiteTech.length > 0 ? "found" : "warning" };
          }
          if (f.label === "Platform detection") {
            return { ...f, detail: wr.socialPlatforms.length > 0 ? wr.socialPlatforms.join(", ") : "No social media detected", status: wr.socialPlatforms.length > 0 ? "found" : "missing" };
          }
          if (f.label === "Business API") {
            return { ...f, detail: wr.hasWhatsApp ? "WhatsApp detected" : "No WhatsApp integration", status: wr.hasWhatsApp ? "found" : "missing" };
          }
          if (f.label === "Appointment system") {
            return { ...f, detail: wr.hasOnlineBooking ? "Booking system detected" : "No online booking found", status: wr.hasOnlineBooking ? "found" : "missing" };
          }
          if (f.label === "Customer management") {
            const tools = [wr.hasCRM ? "CRM" : null, wr.hasEmailMarketing ? "Email" : null, wr.hasLiveChat ? "Live Chat" : null].filter(Boolean);
            return { ...f, detail: tools.length > 0 ? `Detected: ${tools.join(", ")}` : "No CRM, email, or chat tools found", status: tools.length > 0 ? "found" : "warning" };
          }
          return f;
        }),
      );
    }
  }, [auditResult]);

  /* ──── Helpers ──── */

  const getScoreColor = (s: number) => (s < 40 ? "text-red-600" : s < 65 ? "text-amber-600" : "text-emerald-600");
  const getScoreRing = (s: number) => {
    const circumference = 2 * Math.PI * 45;
    const offset = circumference - (s / 100) * circumference;
    const color = s < 40 ? "#dc2626" : s < 65 ? "#d97706" : "#059669";
    return { circumference, offset, color };
  };

  const exportReport = () => {
    if (!auditResult) return;
    const r = auditResult;
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Audit Report - ${r.companyName}</title><style>
body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:800px;margin:0 auto;padding:40px 24px;color:#18181b;line-height:1.6}
h1{font-size:24px;margin-bottom:4px}h2{font-size:18px;margin-top:32px;border-bottom:2px solid #e4e4e7;padding-bottom:8px}
h3{font-size:14px;text-transform:uppercase;letter-spacing:0.05em;color:#71717a;margin-top:24px}
.score{font-size:48px;font-weight:700}.score.low{color:#dc2626}.score.mid{color:#d97706}.score.high{color:#059669}
table{width:100%;border-collapse:collapse;margin-top:8px}td,th{padding:8px 12px;text-align:left;border-bottom:1px solid #e4e4e7;font-size:13px}
th{background:#f4f4f5;font-weight:600;text-transform:uppercase;font-size:11px;letter-spacing:0.05em;color:#71717a}
.severity{display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;text-transform:uppercase}
.sev-critical{background:#fef2f2;color:#dc2626}.sev-high{background:#fffbeb;color:#d97706}.sev-medium{background:#eff6ff;color:#2563eb}.sev-low{background:#f4f4f5;color:#71717a}
.footer{margin-top:40px;padding-top:16px;border-top:1px solid #e4e4e7;font-size:12px;color:#a1a1aa}
@media print{body{padding:20px}}</style></head><body>
<h1>${r.companyName}</h1><p style="color:#71717a">${r.industry} &bull; ${r.date} &bull; Automation Leak Audit</p>
<div class="score ${r.score < 40 ? "low" : r.score < 65 ? "mid" : "high"}">${r.score}/100</div>
<p>Overall automation readiness score. ${r.criticalLeaks} critical and ${r.highLeaks} high-severity gaps identified.</p>
<h2>Summary</h2><table><tr><td>Total leaks</td><td><strong>${r.totalLeaks}</strong></td></tr><tr><td>Critical</td><td>${r.criticalLeaks}</td></tr><tr><td>High</td><td>${r.highLeaks}</td></tr><tr><td>Estimated savings</td><td><strong>${r.estimatedAnnualSavings}/year</strong></td></tr></table>
<h2>Identified Gaps</h2><table><thead><tr><th>Area</th><th>Severity</th><th>What we found</th><th>Est. savings</th></tr></thead><tbody>${r.leaks.map((l) => `<tr><td>${l.area}</td><td><span class="severity sev-${l.severity}">${l.severity}</span></td><td>${l.description.slice(0, 160)}${l.description.length > 160 ? "..." : ""}</td><td>${l.estimatedSavings}</td></tr>`).join("")}</tbody></table>
${r.webResearch ? `<h2>What we found on ${r.companyName}'s website</h2><table><tr><td>Website</td><td>${r.webResearch.hasWebsite ? `Yes (${r.webResearch.websiteScore}/100)` : "None detected"}</td></tr><tr><td>Tech</td><td>${r.webResearch.websiteTech?.join(", ") || "Unknown"}</td></tr><tr><td>Social media</td><td>${r.webResearch.socialPlatforms.length > 0 ? r.webResearch.socialPlatforms.join(", ") : "None detected"}</td></tr><tr><td>WhatsApp</td><td>${r.webResearch.hasWhatsApp ? "Yes" : "No"}</td></tr><tr><td>Online booking</td><td>${r.webResearch.hasOnlineBooking ? "Yes" : "No"}</td></tr><tr><td>CRM</td><td>${r.webResearch.hasCRM ? "Yes" : "No"}</td></tr><tr><td>Email marketing</td><td>${r.webResearch.hasEmailMarketing ? "Yes" : "No"}</td></tr><tr><td>Live chat</td><td>${r.webResearch.hasLiveChat ? "Yes" : "No"}</td></tr></table>` : ""}
${r.automationRecommendations ? `<h2>Recommended automations</h2><ul>${r.automationRecommendations.needs.map((n) => `<li>${n}</li>`).join("")}</ul><h2>Priority actions</h2><ul>${r.automationRecommendations.priorityActions.map((a) => `<li>${a}</li>`).join("")}</ul>` : ""}
<div class="footer">Report generated by ELIAN Automation Audit &bull; elian.ng &bull; ${new Date().toLocaleDateString()}</div>
</body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-${r.companyName.toLowerCase().replace(/\s+/g, "-")}-${r.date}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ──── Render ──── */

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Automation Audit</h1>
          <p className="text-sm text-zinc-500 mt-1">Real web research with actionable assessment</p>
        </div>
        <div className="flex gap-2">
          {auditResult && (
            <>
              <button onClick={exportReport} className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-200 rounded hover:bg-zinc-50 transition-colors">
                <Download className="w-4 h-4" /> Export
              </button>
              <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-200 rounded hover:bg-zinc-50 transition-colors">
                <Printer className="w-4 h-4" /> Print
              </button>
            </>
          )}
          <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-zinc-900 rounded hover:bg-zinc-800 transition-colors">
            <Search className="w-4 h-4" /> New Audit
          </button>
        </div>
      </div>

      {/* ──── Scanning Animation ──── */}
      {isScanning && (
        <div className="bg-white border border-zinc-200 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-10 h-10 bg-zinc-100 rounded flex items-center justify-center">
              <Loader2 className="w-5 h-5 text-zinc-600 animate-spin" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-zinc-900">Scanning {companyName}</h3>
              <p className="text-xs text-zinc-500 mt-0.5">{scanPhase}</p>
            </div>
            <span className="text-sm font-mono font-bold text-zinc-900">{scanProgress}%</span>
          </div>
          <div className="w-full bg-zinc-100 rounded-full h-1.5 mb-5">
            <div className="bg-zinc-900 h-1.5 rounded-full transition-all duration-300" style={{ width: `${scanProgress}%` }} />
          </div>
          <div className="space-y-1.5 max-h-[320px] overflow-y-auto pr-1">
            {findings.map((f) => (
              <div key={f.id} className="flex items-center gap-3 py-2 px-3 rounded bg-zinc-50 border border-zinc-100 animate-fade-in">
                <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${
                  f.status === "found" ? "bg-emerald-50" : f.status === "missing" ? "bg-red-50" : "bg-amber-50"
                }`}>
                  {f.status === "found" ? (
                    <CheckCircle className="w-3 h-3 text-emerald-600" />
                  ) : f.status === "missing" ? (
                    <X className="w-3 h-3 text-red-500" />
                  ) : (
                    <AlertTriangle className="w-3 h-3 text-amber-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-medium text-zinc-800">{f.label}</span>
                  <p className="text-[11px] text-zinc-500 truncate">{f.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ──── Audit Results ──── */}
      {auditResult && !isScanning && (
        <>
          {/* Score Card */}
          <div className="bg-white border border-zinc-200 rounded-lg p-6 mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              {/* Circular score */}
              <div className="relative shrink-0">
                <svg width="100" height="100" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="#f4f4f5" strokeWidth="6" />
                  <circle
                    cx="50" cy="50" r="45" fill="none"
                    stroke={getScoreRing(auditResult.score).color}
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={getScoreRing(auditResult.score).circumference}
                    strokeDashoffset={getScoreRing(auditResult.score).offset}
                    transform="rotate(-90 50 50)"
                    className="transition-all duration-700"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-2xl font-bold ${getScoreColor(auditResult.score)}`}>{auditResult.score}</span>
                  <span className="text-[10px] text-zinc-400">/100</span>
                </div>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-zinc-900">{auditResult.companyName}</h2>
                <p className="text-sm text-zinc-500 mt-0.5">{auditResult.industry} &bull; {auditResult.date}</p>
                <p className="text-sm text-zinc-600 mt-2">
                  {auditResult.criticalLeaks > 0 && <span className="text-red-600 font-medium">{auditResult.criticalLeaks} critical</span>}
                  {auditResult.criticalLeaks > 0 && auditResult.highLeaks > 0 && <span className="text-zinc-400"> and </span>}
                  {auditResult.highLeaks > 0 && <span className="text-amber-600 font-medium">{auditResult.highLeaks} high</span>}
                  {(auditResult.criticalLeaks > 0 || auditResult.highLeaks > 0) && <span className="text-zinc-400"> gaps identified</span>}
                  {auditResult.criticalLeaks === 0 && auditResult.highLeaks === 0 && <span className="text-emerald-600 font-medium">Strong digital presence</span>}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-2xl font-bold text-zinc-900">{auditResult.estimatedAnnualSavings}</p>
                <p className="text-xs text-zinc-500">estimated recoverable/year</p>
              </div>
            </div>
          </div>

          {/* ──── What We Found ──── */}
          <div className="bg-white border border-zinc-200 rounded-lg p-6 mb-6">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">Research Findings</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {findings.filter((f) => f.category !== "Assessment" && f.category !== "Industry").map((f) => (
                <div key={f.id} className="flex items-center gap-3 py-2.5 px-3 rounded border border-zinc-100">
                  <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 ${
                    f.status === "found" ? "bg-emerald-50" : f.status === "missing" ? "bg-red-50" : "bg-amber-50"
                  }`}>
                    {f.status === "found" ? <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> :
                     f.status === "missing" ? <X className="w-3.5 h-3.5 text-red-400" /> :
                     <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-zinc-800">{f.label}</p>
                    <p className="text-[11px] text-zinc-500 truncate">{f.detail}</p>
                  </div>
                  <span className={`text-[10px] font-semibold uppercase tracking-wider ${
                    f.status === "found" ? "text-emerald-600" : f.status === "missing" ? "text-red-500" : "text-amber-600"
                  }`}>{f.status === "found" ? "Found" : f.status === "missing" ? "Missing" : "Partial"}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ──── Identified Gaps ──── */}
          <div className="bg-white border border-zinc-200 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Identified Gaps</h3>
              <div className="flex items-center gap-3 text-[11px]">
                {auditResult.criticalLeaks > 0 && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" />{auditResult.criticalLeaks} Critical</span>}
                {auditResult.highLeaks > 0 && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" />{auditResult.highLeaks} High</span>}
              </div>
            </div>
            <div className="space-y-2">
              {auditResult.leaks.map((leak) => {
                const sc = SEVERITY_CONFIG[leak.severity];
                const isExpanded = expandedLeakId === leak.id;
                return (
                  <div key={leak.id} className={`border rounded-lg transition-colors ${sc.border} ${isExpanded ? sc.bg : "bg-white hover:bg-zinc-50"}`}>
                    <button
                      className="w-full text-left p-4"
                      onClick={() => setExpandedLeakId(isExpanded ? null : leak.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${sc.dot}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-semibold text-zinc-900">{leak.area}</span>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${sc.bg} ${sc.color}`}>{leak.severity}</span>
                              <span className="text-xs font-medium text-zinc-600">{leak.estimatedSavings}</span>
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-zinc-400" /> : <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />}
                            </div>
                          </div>
                          <p className="text-xs text-zinc-600 mt-1 line-clamp-2">{leak.description}</p>
                        </div>
                      </div>
                    </button>
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-0 ml-5 border-t border-zinc-100 mt-0">
                        <div className="mt-3 space-y-3">
                          <div className="bg-white rounded border border-zinc-100 p-3">
                            <p className="text-[11px] font-semibold text-zinc-500 uppercase mb-1">What this means</p>
                            <p className="text-xs text-zinc-700">{leak.impact}</p>
                          </div>
                          <div className="bg-emerald-50 rounded border border-emerald-100 p-3">
                            <p className="text-[11px] font-semibold text-emerald-700 uppercase mb-1">Recommended action</p>
                            <p className="text-xs text-emerald-800">{leak.recommendation}</p>
                          </div>
                          <p className="text-[11px] text-zinc-400">Source: {leak.source}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ──── Score Breakdown ──── */}
          <div className="bg-white border border-zinc-200 rounded-lg p-6 mb-6">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">Score Breakdown</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
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
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-zinc-500">{item.label}</span>
                    <span className={`font-semibold ${item.score < 40 ? "text-red-600" : item.score < 65 ? "text-amber-600" : "text-emerald-600"}`}>{item.score}%</span>
                  </div>
                  <div className="w-full bg-zinc-100 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-500 ${
                        item.score < 40 ? "bg-red-500" : item.score < 65 ? "bg-amber-500" : "bg-emerald-500"
                      }`}
                      style={{ width: `${item.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ──── Recommended Automations ──── */}
          {auditResult.automationRecommendations && (
            <div className="bg-white border border-zinc-200 rounded-lg p-6 mb-6">
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">Recommended Automations</h3>
              <div className="flex flex-wrap gap-2 mb-5">
                {auditResult.automationRecommendations.needs.map((n) => (
                  <span key={n} className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-zinc-100 text-zinc-700 rounded">
                    <Zap className="w-3 h-3" />{n}
                  </span>
                ))}
              </div>
              <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Role-Based Task Assignments</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {auditResult.automationRecommendations.roles.map((role) => (
                  <div key={role.role} className="p-4 rounded border border-zinc-100 bg-zinc-50">
                    <h5 className="text-sm font-semibold text-zinc-900 mb-2">{role.role}</h5>
                    <ul className="space-y-1.5">
                      {role.tasks.map((task, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-zinc-600">
                          <span className="w-1 h-1 rounded-full bg-zinc-400 mt-1.5 shrink-0" />
                          {task}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ──── Quick Wins ──── */}
          {auditResult.webResearch?.quickWins && auditResult.webResearch.quickWins.length > 0 && (
            <div className="bg-white border border-zinc-200 rounded-lg p-6 mb-6">
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">Quick Wins</h3>
              <div className="space-y-2">
                {auditResult.webResearch.quickWins.map((qw, i) => (
                  <div key={i} className="flex items-start gap-3 py-2 px-3 rounded bg-zinc-50 border border-zinc-100">
                    <TrendingUp className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <p className="text-sm text-zinc-700">{qw}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ──── CTA ──── */}
          <div className="bg-zinc-900 rounded-lg p-8 text-center">
            <h3 className="text-lg font-bold text-white mb-2">Ready to fix these gaps?</h3>
            <p className="text-sm text-zinc-400 mb-5 max-w-md mx-auto">
              Book a free 15-minute call. We will implement the top priority automation for your business.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href={`https://wa.me/2348012345678?text=Hi%20ELIAN%2C%20I%20just%20completed%20an%20audit%20for%20${encodeURIComponent(auditResult.companyName)}`}
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded hover:bg-emerald-700 transition-colors"
              >
                <Share2 className="w-4 h-4" /> WhatsApp Us
              </a>
              <a
                href={`mailto:hello@elian.ng?subject=Audit%20Results%20-%20${encodeURIComponent(auditResult.companyName)}`}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-zinc-900 text-sm font-medium rounded hover:bg-zinc-100 transition-colors"
              >
                <Mail className="w-4 h-4" /> Email Us
              </a>
            </div>
          </div>
        </>
      )}

      {/* ──── Empty State ──── */}
      {!auditResult && !isScanning && (
        <div className="bg-white border border-zinc-200 rounded-lg py-16 px-6 text-center">
          <div className="w-14 h-14 bg-zinc-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Search className="w-7 h-7 text-zinc-400" />
          </div>
          <h2 className="text-lg font-bold text-zinc-900 mb-1.5">Run your first audit</h2>
          <p className="text-sm text-zinc-500 max-w-sm mx-auto mb-6">
            Enter a company name. We search the web, analyze their digital presence, and identify automation opportunities.
          </p>
          <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-zinc-900 text-white text-sm font-medium rounded hover:bg-zinc-800 transition-colors">
            <Search className="w-4 h-4" /> Start Free Audit
          </button>
        </div>
      )}

      {/* ──── Audit Form Modal ──── */}
      <Modal open={showForm} onClose={() => { setShowForm(false); setError(""); }} title="Run Automation Audit">
        <div className="space-y-4">
          {error && (
            <div className="p-3 rounded bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>
          )}
          <Input label="Company Name" placeholder="e.g. Shoprite Nigeria" value={companyName} onChange={setCompanyName} />
          <Input label="Website (optional)" placeholder="e.g. shoprite.com.ng" value={website} onChange={setWebsite} />
          <Select
            label="Industry"
            value={industry}
            onChange={setIndustry}
            options={[
              { value: "", label: "Select industry" },
              { value: "Real Estate", label: "Real Estate" },
              { value: "Healthcare", label: "Healthcare" },
              { value: "Education", label: "Education" },
              { value: "E-Commerce", label: "E-Commerce" },
              { value: "Professional Services", label: "Professional Services" },
              { value: "Financial Services", label: "Financial Services" },
              { value: "Recruitment", label: "Recruitment" },
              { value: "General", label: "Other" },
            ]}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Your Name" placeholder="Your name" value={contactName} onChange={setContactName} />
            <Input label="Your Email" placeholder="you@company.com" value={contactEmail} onChange={setContactEmail} />
          </div>
          <button
            onClick={runAudit}
            disabled={isScanning || !companyName.trim()}
            className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-zinc-900 text-white text-sm font-medium rounded hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isScanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {isScanning ? "Scanning..." : "Run Audit"}
          </button>
        </div>
      </Modal>

      {/* ──── Leak Detail Modal ──── */}
      <Modal open={!!selectedLeak} onClose={() => setSelectedLeak(null)} title={selectedLeak?.area || ""}>
        {selectedLeak && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${SEVERITY_CONFIG[selectedLeak.severity].bg} ${SEVERITY_CONFIG[selectedLeak.severity].color}`}>
                {selectedLeak.severity}
              </span>
              <span className="text-sm font-medium text-zinc-700">{selectedLeak.estimatedSavings}</span>
            </div>
            <p className="text-sm text-zinc-700 leading-relaxed">{selectedLeak.description}</p>
            <div className="bg-emerald-50 rounded border border-emerald-100 p-3">
              <p className="text-[11px] font-semibold text-emerald-700 uppercase mb-1">Recommendation</p>
              <p className="text-sm text-emerald-800">{selectedLeak.recommendation}</p>
            </div>
            <div className="bg-zinc-50 rounded border border-zinc-100 p-3">
              <p className="text-[11px] font-semibold text-zinc-500 uppercase mb-1">Business Impact</p>
              <p className="text-sm text-zinc-700">{selectedLeak.impact}</p>
            </div>
            <p className="text-[11px] text-zinc-400">Source: {selectedLeak.source}</p>
          </div>
        )}
      </Modal>

      {/* ──── Audit History ──── */}
      {auditHistory.length > 1 && (
        <div className="bg-white border border-zinc-200 rounded-lg p-6 mt-6">
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Previous Audits</h3>
          <div className="space-y-1.5">
            {auditHistory.slice(1).map((h) => (
              <button
                key={h.date + h.companyName}
                className="w-full flex items-center justify-between py-2.5 px-3 rounded border border-zinc-100 hover:bg-zinc-50 transition-colors text-left"
                onClick={() => { setAuditResult(h); setFindings([]); }}
              >
                <div>
                  <p className="text-sm font-medium text-zinc-900">{h.companyName}</p>
                  <p className="text-xs text-zinc-500">{h.industry} &bull; {h.date}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-lg font-bold ${getScoreColor(h.score)}`}>{h.score}</span>
                  <ArrowRight className="w-4 h-4 text-zinc-300" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
