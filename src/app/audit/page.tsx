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
  critical: { color: "text-[var(--color-error)]", bg: "bg-[var(--color-error)]/10", border: "border-[var(--color-error)]/30", dot: "bg-[var(--color-error)]/100" },
  high: { color: "text-[var(--color-warning)]", bg: "bg-[var(--color-warning)]/10", border: "border-[var(--color-warning)]/30", dot: "bg-[var(--color-warning)]/100" },
  medium: { color: "text-[var(--color-accent)]", bg: "bg-[var(--color-accent)]/10", border: "border-[var(--color-accent)]/30", dot: "bg-[var(--color-accent)]/100" },
  low: { color: "text-[var(--color-text-muted)]", bg: "bg-[var(--color-surface)]", border: "border-[var(--color-border)]", dot: "bg-zinc-400" },
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
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestAutomation, setRequestAutomation] = useState("");
  const [requestPhone, setRequestPhone] = useState("");
  const [requestMessage, setRequestMessage] = useState("");
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  const [requestSubmitted, setRequestSubmitted] = useState(false);
  const [expandedLeakId, setExpandedLeakId] = useState<string | null>(null);
  const findingCounter = useRef(0);

  const addFinding = useCallback(
    (category: string, label: string, detail: string, status: "found" | "missing" | "warning", icon: string) => {
      findingCounter.current += 1;
      setFindings((prev) => [...prev, { id: `f-${findingCounter.current}`, category, label, detail, status, icon }]);
    },
    [],
  );

    /* ──── Request Implementation ──── */

  const submitImplementationRequest = async () => {
    if (!contactName || !contactEmail || !requestAutomation) return;
    setRequestSubmitting(true);
    try {
      const res = await fetch("/api/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: contactName,
          businessName: companyName,
          email: contactEmail,
          phone: requestPhone,
          website,
          selectedAutomation: requestAutomation,
          preferredContact: "email",
          message: requestMessage,
          auditId: auditResult ? `${companyName}-${auditResult.score}` : undefined,
          auditFindings: auditResult ? auditResult.leaks.map(l => `${l.area}: ${l.description}`).join("; ") : undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setRequestSubmitted(true);
      }
    } catch {
      setRequestSubmitted(true);
    } finally {
      setRequestSubmitting(false);
    }
  };

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

  const getScoreColor = (s: number) => (s < 40 ? "text-[var(--color-error)]" : s < 65 ? "text-[var(--color-warning)]" : "text-[var(--color-success)]");
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
.sev-critical{background:#fef2f2;color:#dc2626}.sev-high{background:#fffbeb;color:#d97706}.sev-medium{background:#eff6ff;color:#3B66E8}.sev-low{background:#f4f4f5;color:#71717a}
.footer{margin-top:40px;padding-top:16px;border-top:1px solid #e4e4e7;font-size:12px;color:#a1a1aa}
@media print{body{padding:20px}}</style></head><body>
<h1>${r.companyName}</h1><p style="color:#71717a">${r.industry} &bull; ${r.date} &bull; Automation Leak Audit</p>
<div class="score ${r.score < 40 ? "low" : r.score < 65 ? "mid" : "high"}">${r.score}/100</div>
<p>Overall automation readiness score. ${r.criticalLeaks} critical and ${r.highLeaks} high-severity gaps identified.</p>
<h2>Summary</h2><table><tr><td>Total leaks</td><td><strong>${r.totalLeaks}</strong></td></tr><tr><td>Critical</td><td>${r.criticalLeaks}</td></tr><tr><td>High</td><td>${r.highLeaks}</td></tr><tr><td>Estimated savings</td><td><strong>${r.estimatedAnnualSavings}/year</strong></td></tr></table>
<h2>Identified Gaps</h2><table><thead><tr><th>Area</th><th>Severity</th><th>What we found</th><th>Est. savings</th></tr></thead><tbody>${r.leaks.map((l) => `<tr><td>${l.area}</td><td><span class="severity sev-${l.severity}">${l.severity}</span></td><td>${l.description.slice(0, 160)}${l.description.length > 160 ? "..." : ""}</td><td>${l.estimatedSavings}</td></tr>`).join("")}</tbody></table>
${r.webResearch ? `<h2>What we found on ${r.companyName}'s website</h2><table><tr><td>Website</td><td>${r.webResearch.hasWebsite ? `Yes (${r.webResearch.websiteScore}/100)` : "None detected"}</td></tr><tr><td>Tech</td><td>${r.webResearch.websiteTech?.join(", ") || "Unknown"}</td></tr><tr><td>Social media</td><td>${r.webResearch.socialPlatforms.length > 0 ? r.webResearch.socialPlatforms.join(", ") : "None detected"}</td></tr><tr><td>WhatsApp</td><td>${r.webResearch.hasWhatsApp ? "Yes" : "No"}</td></tr><tr><td>Online booking</td><td>${r.webResearch.hasOnlineBooking ? "Yes" : "No"}</td></tr><tr><td>CRM</td><td>${r.webResearch.hasCRM ? "Yes" : "No"}</td></tr><tr><td>Email marketing</td><td>${r.webResearch.hasEmailMarketing ? "Yes" : "No"}</td></tr><tr><td>Live chat</td><td>${r.webResearch.hasLiveChat ? "Yes" : "No"}</td></tr></table>` : ""}
${r.automationRecommendations ? `<h2>Recommended automations</h2><ul>${r.automationRecommendations.needs.map((n) => `<li>${n}</li>`).join("")}</ul><h2>Priority actions</h2><ul>${r.automationRecommendations.priorityActions.map((a) => `<li>${a}</li>`).join("")}</ul>` : ""}
<div class="footer">Report generated by ELION Automation Audit &bull; elion.com.ng &bull; ${new Date().toLocaleDateString()}</div>
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
    <div>
      {/* Navigation */}
      <header className="sticky top-0 z-50 bg-[var(--color-surface)]/80 backdrop-blur-xl border-b border-[var(--color-border)]/50 -mx-4 sm:-mx-6 px-4 sm:px-6 mb-6">
        <div className="max-w-5xl mx-auto h-14 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <img src="/brand/elion-e-icon.svg" alt="ELION" width={24} height={24} />
            <span className="font-bold text-[var(--color-text-primary)] tracking-tight text-sm" style={{fontFamily:"Space Grotesk,sans-serif"}}>ELION</span>
          </a>
          <div className="hidden sm:flex items-center gap-6 text-sm">
            <a href="/audit#method" className="text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors">How It Works</a>
            <a href="/audit" className="text-[var(--color-accent)] font-medium">Audit</a>
            <a href="/demo" className="text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors">Demo</a>
            <a href="/landing/pricing" className="text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors">Pricing</a>
            <a href="/landing/about" className="text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors">About</a>
          </div>
          <a href="/audit" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-accent)] text-white text-sm font-semibold hover:bg-[var(--color-accent-hover)] transition-all">Start Free Audit</a>
        </div>
      </header>
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Automation Audit</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">Real web research with actionable assessment</p>
        </div>
        <div className="flex gap-2">
          {auditResult && (
            <>
              <button onClick={exportReport} className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-[var(--color-text-secondary)] bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded hover:bg-[var(--color-surface)] transition-colors">
                <Download className="w-4 h-4" /> Export
              </button>
              <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-[var(--color-text-secondary)] bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded hover:bg-[var(--color-surface)] transition-colors">
                <Printer className="w-4 h-4" /> Print
              </button>
            </>
          )}
          <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-[var(--color-surface)] rounded hover:bg-[var(--color-surface-raised)] transition-colors">
            <Search className="w-4 h-4" /> New Audit
          </button>
        </div>
      </div>

      {/* ──── Scanning Animation ──── */}
      {isScanning && (
        <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-lg p-6 mb-6">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-10 h-10 bg-[var(--color-surface-elevated)] rounded flex items-center justify-center">
              <Loader2 className="w-5 h-5 text-[var(--color-text-secondary)] animate-spin" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Scanning {companyName}</h3>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{scanPhase}</p>
            </div>
            <span className="text-sm font-mono font-bold text-[var(--color-text-primary)]">{scanProgress}%</span>
          </div>
          <div className="w-full bg-[var(--color-surface-elevated)] rounded-full h-1.5 mb-5">
            <div className="bg-[var(--color-surface)] h-1.5 rounded-full transition-all duration-300" style={{ width: `${scanProgress}%` }} />
          </div>
          <div className="space-y-1.5 max-h-[320px] overflow-y-auto pr-1">
            {findings.map((f) => (
              <div key={f.id} className="flex items-center gap-3 py-2 px-3 rounded bg-[var(--color-surface)] border border-[var(--color-border)] animate-fade-in">
                <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${
                  f.status === "found" ? "bg-[var(--color-success)]/10" : f.status === "missing" ? "bg-[var(--color-error)]/10" : "bg-[var(--color-warning)]/10"
                }`}>
                  {f.status === "found" ? (
                    <CheckCircle className="w-3 h-3 text-[var(--color-success)]" />
                  ) : f.status === "missing" ? (
                    <X className="w-3 h-3 text-[var(--color-error)]" />
                  ) : (
                    <AlertTriangle className="w-3 h-3 text-[var(--color-warning)]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-medium text-[var(--color-text-primary)]">{f.label}</span>
                  <p className="text-[11px] text-[var(--color-text-muted)] truncate">{f.detail}</p>
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
          <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-lg p-6 mb-6">
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
                  <span className="text-[10px] text-[var(--color-text-muted)]">/100</span>
                </div>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-[var(--color-text-primary)]">{auditResult.companyName}</h2>
                <p className="text-sm text-[var(--color-text-muted)] mt-0.5">{auditResult.industry} &bull; {auditResult.date}</p>
                <p className="text-sm text-[var(--color-text-secondary)] mt-2">
                  {auditResult.criticalLeaks > 0 && <span className="text-[var(--color-error)] font-medium">{auditResult.criticalLeaks} critical</span>}
                  {auditResult.criticalLeaks > 0 && auditResult.highLeaks > 0 && <span className="text-[var(--color-text-muted)]"> and </span>}
                  {auditResult.highLeaks > 0 && <span className="text-[var(--color-warning)] font-medium">{auditResult.highLeaks} high</span>}
                  {(auditResult.criticalLeaks > 0 || auditResult.highLeaks > 0) && <span className="text-[var(--color-text-muted)]"> gaps identified</span>}
                  {auditResult.criticalLeaks === 0 && auditResult.highLeaks === 0 && <span className="text-[var(--color-success)] font-medium">Strong digital presence</span>}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-2xl font-bold text-[var(--color-text-primary)]">{auditResult.estimatedAnnualSavings}</p>
                <p className="text-xs text-[var(--color-text-muted)]">potential annual savings (estimate)</p>
              </div>
            </div>
          </div>

          {/* ──── What We Found ──── */}
          <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-lg p-6 mb-6">
            <h3 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-4">Research Findings</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {findings.filter((f) => f.category !== "Assessment" && f.category !== "Industry").map((f) => (
                <div key={f.id} className="flex items-center gap-3 py-2.5 px-3 rounded border border-[var(--color-border)]">
                  <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 ${
                    f.status === "found" ? "bg-[var(--color-success)]/10" : f.status === "missing" ? "bg-[var(--color-error)]/10" : "bg-[var(--color-warning)]/10"
                  }`}>
                    {f.status === "found" ? <CheckCircle className="w-3.5 h-3.5 text-[var(--color-success)]" /> :
                     f.status === "missing" ? <X className="w-3.5 h-3.5 text-[var(--color-error)]" /> :
                     <AlertTriangle className="w-3.5 h-3.5 text-[var(--color-warning)]" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[var(--color-text-primary)]">{f.label}</p>
                    <p className="text-[11px] text-[var(--color-text-muted)] truncate">{f.detail}</p>
                  </div>
                  <span className={`text-[10px] font-semibold uppercase tracking-wider ${
                    f.status === "found" ? "text-[var(--color-success)]" : f.status === "missing" ? "text-[var(--color-error)]" : "text-[var(--color-warning)]"
                  }`}>{f.status === "found" ? "Found" : f.status === "missing" ? "Missing" : "Partial"}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ──── Identified Gaps ──── */}
          <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Leak Analysis</h3>
              <div className="flex items-center gap-3 text-[11px]">
                {auditResult.criticalLeaks > 0 && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[var(--color-error)]/100" />{auditResult.criticalLeaks} Critical</span>}
                {auditResult.highLeaks > 0 && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[var(--color-warning)]/100" />{auditResult.highLeaks} High</span>}
              </div>
            </div>
            <div className="space-y-2">
              {auditResult.leaks.map((leak) => {
                const sc = SEVERITY_CONFIG[leak.severity];
                const isExpanded = expandedLeakId === leak.id;
                return (
                  <div key={leak.id} className={`border rounded-lg transition-colors ${sc.border} ${isExpanded ? sc.bg : "bg-[var(--color-surface-raised)] hover:bg-[var(--color-surface)]"}`}>
                    <button
                      className="w-full text-left p-4"
                      onClick={() => setExpandedLeakId(isExpanded ? null : leak.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${sc.dot}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-semibold text-[var(--color-text-primary)]">{leak.area}</span>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${sc.bg} ${sc.color}`}>{leak.severity}</span>
                              <span className="text-xs font-medium text-[var(--color-text-secondary)]">{leak.estimatedSavings}</span>
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-[var(--color-text-muted)]" /> : <ChevronDown className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />}
                            </div>
                          </div>
                          <p className="text-xs text-[var(--color-text-secondary)] mt-1 line-clamp-2">{leak.description}</p>
                        </div>
                      </div>
                    </button>
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-0 ml-5 border-t border-[var(--color-border)] mt-0">
                        <div className="mt-3 space-y-3">
                          {/* OBSERVED: Evidence from website analysis */}
                          {leak.evidence && leak.evidence.length > 0 && (
                            <div className="bg-[var(--color-accent)]/10 rounded border border-blue-100 p-3">
                              <div className="flex items-center gap-2 mb-1.5">
                                <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-blue-100 text-[var(--color-accent)]">Observed</span>
                                <span className="text-[11px] text-[var(--color-accent)]">What we found on your website</span>
                              </div>
                              <ul className="space-y-1">
                                {leak.evidence.map((e, i) => (
                                  <li key={i} className="flex items-start gap-2 text-xs text-blue-800">
                                    <span className="w-1 h-1 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                                    {e}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {/* Why it matters */}
                          <div className="bg-[var(--color-surface-raised)] rounded border border-[var(--color-border)] p-3">
                            <p className="text-[11px] font-semibold text-[var(--color-text-muted)] uppercase mb-1">Why it matters</p>
                            <p className="text-xs text-[var(--color-text-secondary)]">{leak.impact}</p>
                          </div>
                          {/* RECOMMENDED: What to do about it */}
                          <div className="bg-[var(--color-success)]/10 rounded border border-emerald-100 p-3">
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-100 text-[var(--color-success)]">Recommended</span>
                              <span className="text-[11px] text-[var(--color-success)]">Suggested automation opportunity</span>
                            </div>
                            <p className="text-xs text-emerald-800">{leak.recommendation}</p>
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-[var(--color-text-muted)]">
                            <span>Source: {leak.source}</span>
                            <span className={`px-1.5 py-0.5 rounded font-medium ${
                              leak.severity === "critical" ? "bg-[var(--color-error)]/10 text-[var(--color-error)]" :
                              leak.severity === "high" ? "bg-[var(--color-warning)]/10 text-[var(--color-warning)]" :
                              "bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)]"
                            }`}>Priority: {leak.severity}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ──── Score Breakdown ──── */}
          <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-lg p-6 mb-6">
            <h3 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-4">Score Breakdown</h3>
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
                    <span className="text-[var(--color-text-muted)]">{item.label}</span>
                    <span className={`font-semibold ${item.score < 40 ? "text-[var(--color-error)]" : item.score < 65 ? "text-[var(--color-warning)]" : "text-[var(--color-success)]"}`}>{item.score}%</span>
                  </div>
                  <div className="w-full bg-[var(--color-surface-elevated)] rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-500 ${
                        item.score < 40 ? "bg-[var(--color-error)]/100" : item.score < 65 ? "bg-[var(--color-warning)]/100" : "bg-[var(--color-success)]/100"
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
            <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-lg p-6 mb-6">
              <h3 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-4">Recommended Automations</h3>
              <div className="flex flex-wrap gap-2 mb-5">
                {auditResult.automationRecommendations.needs.map((n) => (
                  <span key={n} className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] rounded">
                    <Zap className="w-3 h-3" />{n}
                  </span>
                ))}
              </div>
              <h4 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">Role-Based Task Assignments</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {auditResult.automationRecommendations.roles.map((role) => (
                  <div key={role.role} className="p-4 rounded border border-[var(--color-border)] bg-[var(--color-surface)]">
                    <h5 className="text-sm font-semibold text-[var(--color-text-primary)] mb-2">{role.role}</h5>
                    <ul className="space-y-1.5">
                      {role.tasks.map((task, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-[var(--color-text-secondary)]">
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
            <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-lg p-6 mb-6">
              <h3 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-4">Quick Wins</h3>
              <div className="space-y-2">
                {auditResult.webResearch.quickWins.map((qw, i) => (
                  <div key={i} className="flex items-start gap-3 py-2 px-3 rounded bg-[var(--color-surface)] border border-[var(--color-border)]">
                    <TrendingUp className="w-4 h-4 text-[var(--color-success)] shrink-0 mt-0.5" />
                    <p className="text-sm text-[var(--color-text-secondary)]">{qw}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ──── CTA ──── */}
          <div className="bg-[var(--color-surface)] rounded-lg p-8 text-center">
            <h3 className="text-lg font-bold text-white mb-2">Ready to fix these gaps?</h3>
            <p className="text-sm text-[var(--color-text-muted)] mb-5 max-w-md mx-auto">
              Book a free 15-minute call. We will implement the top priority automation for your business.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => setShowRequestModal(true)}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[var(--color-surface-raised)] text-[var(--color-text-primary)] text-sm font-medium rounded hover:bg-[var(--color-surface-elevated)] transition-colors"
              >
                <ClipboardList className="w-4 h-4" /> Request Implementation
              </button>
              <a
                href="/audit?ref=audit-results"
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[var(--color-accent)] text-white text-sm font-medium rounded hover:bg-[var(--color-accent-hover)] transition-colors"
              >
                <Share2 className="w-4 h-4" /> Get Started
              </a>
              <a
                href={`/landing/support?ref=audit-results&subject=Audit%20Results%20-%20${encodeURIComponent(auditResult.companyName)}`}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[var(--color-surface-raised)] text-[var(--color-text-primary)] text-sm font-medium rounded hover:bg-[var(--color-surface-elevated)] transition-colors"
              >
                <Mail className="w-4 h-4" /> Email Us
              </a>
            </div>
          </div>
        </>
      )}

      
      {/* ──── Sample Audit Example ──── */}
      {!auditResult && !isScanning && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="px-2 py-0.5 bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20 rounded text-[10px] font-semibold text-[var(--color-accent)] uppercase tracking-wider">Illustrative Example</div>
          </div>
          <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--color-border)]">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Sample: Lagos Real Estate Agency</h3>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5">This is what a real audit looks like - not a real client</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-[var(--color-warning)]">42</div>
                  <div className="text-[10px] text-[var(--color-text-muted)]">Automation Score</div>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="border border-[var(--color-border)] rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded bg-[var(--color-error)]/10 flex items-center justify-center shrink-0 mt-0.5"><span className="text-[var(--color-error)] text-xs font-bold">!</span></div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1"><span className="text-xs font-semibold text-[var(--color-text-primary)]">Lead Response Gap</span><span className="px-1.5 py-0.5 bg-[var(--color-error)]/10 text-[var(--color-error)] text-[10px] font-semibold rounded">Critical</span></div>
                    <p className="text-xs text-[var(--color-text-muted)] leading-relaxed mb-2"><strong className="text-[var(--color-text-secondary)]">Observation:</strong> Website visitors are directed to WhatsApp, but there is no automated qualification step before the conversation begins.</p>
                    <p className="text-xs text-[var(--color-text-muted)] leading-relaxed mb-2"><strong className="text-[var(--color-text-secondary)]">Evidence:</strong> Contact flow requires the visitor to manually initiate the conversation. No chatbot, no lead capture form, no instant response.</p>
                    <div className="bg-[var(--color-surface)] rounded p-3 mt-2"><p className="text-[11px] text-[var(--color-accent)] font-medium">Recommended: Lead capture - qualification - instant WhatsApp response - booking - follow-up</p></div>
                  </div>
                </div>
              </div>
              <div className="border border-[var(--color-border)] rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded bg-[var(--color-warning)]/10 flex items-center justify-center shrink-0 mt-0.5"><span className="text-[var(--color-warning)] text-xs font-bold">~</span></div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1"><span className="text-xs font-semibold text-[var(--color-text-primary)]">No Follow-Up System</span><span className="px-1.5 py-0.5 bg-[var(--color-warning)]/10 text-[var(--color-warning)] text-[10px] font-semibold rounded">High</span></div>
                    <p className="text-xs text-[var(--color-text-muted)] leading-relaxed"><strong className="text-[var(--color-text-secondary)]">Observation:</strong> No automated follow-up sequence detected. After initial contact, there is no systematic re-engagement for leads who do not convert immediately.</p>
                    <div className="bg-[var(--color-surface)] rounded p-3 mt-2"><p className="text-[11px] text-[var(--color-accent)] font-medium">Recommended: Automated follow-up sequences across WhatsApp and email at 1, 3, 7, and 14-day intervals</p></div>
                  </div>
                </div>
              </div>
              <div className="bg-[var(--color-surface)] rounded-lg p-4 border border-[var(--color-border)]">
                <h4 className="text-xs font-semibold text-[var(--color-text-primary)] mb-2">What ELION Would Build</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 rounded bg-[var(--color-surface-raised)]"><div className="text-lg font-bold text-[var(--color-accent)]">Lead Response</div><div className="text-[10px] text-[var(--color-text-muted)]">Capture + qualify + respond in seconds</div></div>
                  <div className="text-center p-3 rounded bg-[var(--color-surface-raised)]"><div className="text-lg font-bold text-[var(--color-accent)]">Follow-Up</div><div className="text-[10px] text-[var(--color-text-muted)]">Automated sequences across channels</div></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
{/* ──── Empty State ──── */}
      {!auditResult && !isScanning && (
        <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-lg py-16 px-6 text-center">
          <div className="w-14 h-14 bg-[var(--color-surface-elevated)] rounded-lg flex items-center justify-center mx-auto mb-4">
            <Search className="w-7 h-7 text-[var(--color-text-muted)]" />
          </div>
          <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-1.5">Run your first audit</h2>
          <p className="text-sm text-[var(--color-text-muted)] max-w-sm mx-auto mb-6">
            Enter a company name. We search the web, analyze their digital presence, and identify automation opportunities.
          </p>
          <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[var(--color-surface)] text-white text-sm font-medium rounded hover:bg-[var(--color-surface-raised)] transition-colors">
            <Search className="w-4 h-4" /> Start Free Audit
          </button>
        </div>
      )}

      {/* ──── Audit Form Modal ──── */}
      <Modal open={showForm} onClose={() => { setShowForm(false); setError(""); }} title="Run Automation Audit">
        <div className="space-y-4">
          {error && (
            <div className="p-3 rounded bg-[var(--color-error)]/10 border border-[var(--color-error)]/30 text-sm text-[var(--color-error)]">{error}</div>
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
            className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[var(--color-surface)] text-white text-sm font-medium rounded hover:bg-[var(--color-surface-raised)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
              <span className="text-sm font-medium text-[var(--color-text-secondary)]">{selectedLeak.estimatedSavings}</span>
            </div>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{selectedLeak.description}</p>
            <div className="bg-[var(--color-success)]/10 rounded border border-emerald-100 p-3">
              <p className="text-[11px] font-semibold text-[var(--color-success)] uppercase mb-1">Recommendation</p>
              <p className="text-sm text-emerald-800">{selectedLeak.recommendation}</p>
            </div>
            <div className="bg-[var(--color-surface)] rounded border border-[var(--color-border)] p-3">
              <p className="text-[11px] font-semibold text-[var(--color-text-muted)] uppercase mb-1">Business Impact</p>
              <p className="text-sm text-[var(--color-text-secondary)]">{selectedLeak.impact}</p>
            </div>
            <p className="text-[11px] text-[var(--color-text-muted)]">Source: {selectedLeak.source}</p>
          </div>
        )}
      </Modal>

      {/* ──── Audit History ──── */}
      {auditHistory.length > 1 && (
        <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-lg p-6 mt-6">
          <h3 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">Previous Audits</h3>
          <div className="space-y-1.5">
            {auditHistory.slice(1).map((h) => (
              <button
                key={h.date + h.companyName}
                className="w-full flex items-center justify-between py-2.5 px-3 rounded border border-[var(--color-border)] hover:bg-[var(--color-surface)] transition-colors text-left"
                onClick={() => { setAuditResult(h); setFindings([]); }}
              >
                <div>
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">{h.companyName}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{h.industry} &bull; {h.date}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-lg font-bold ${getScoreColor(h.score)}`}>{h.score}</span>
                  <ArrowRight className="w-4 h-4 text-[var(--color-text-muted)]" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ──── Implementation Request Modal ──── */}
      <Modal open={showRequestModal} onClose={() => { setShowRequestModal(false); setRequestSubmitted(false); }} title="Request Implementation">
        {requestSubmitted ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-6 h-6 text-[var(--color-success)]" />
            </div>
            <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-1">Request Received</h3>
            <p className="text-sm text-[var(--color-text-muted)] mb-4">We will contact you within 24 hours to discuss your automation needs.</p>
            <button onClick={() => { setShowRequestModal(false); setRequestSubmitted(false); }} className="px-4 py-2 bg-[var(--color-surface)] text-white text-sm font-medium rounded hover:bg-[var(--color-surface-raised)] transition-colors">Done</button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-[var(--color-text-muted)]">Based on your audit for <strong>{companyName}</strong>, tell us which automation you want to implement.</p>
            <Input label="Your Name" placeholder="Your name" value={contactName} onChange={setContactName} />
            <Input label="Email" placeholder="you@company.com" value={contactEmail} onChange={setContactEmail} />
            <Input label="Phone / WhatsApp" placeholder="e.g. 08012345678" value={requestPhone} onChange={setRequestPhone} />
            <Select
              label="Which automation?"
              value={requestAutomation}
              onChange={setRequestAutomation}
              options={[
                { value: "", label: "Select automation" },
                { value: "Lead Response System", label: "Lead Response System" },
                { value: "Follow-Up Engine", label: "Follow-Up Engine" },
                { value: "Revenue Recovery System", label: "Revenue Recovery System" },
                { value: "Booking Engine", label: "Booking Engine" },
                { value: "Operations Automation", label: "Operations Automation" },
                { value: "Full Audit Package", label: "Full Audit Package (all recommended)" },
              ]}
            />
            <div>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Additional message (optional)</label>
              <textarea
                rows={3}
                value={requestMessage}
                onChange={(e) => setRequestMessage(e.target.value)}
                placeholder="Anything else we should know?"
                className="w-full px-3 py-2 text-sm border border-[var(--color-border)] rounded bg-[var(--color-surface-raised)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-1 focus:ring-zinc-900 resize-none"
              />
            </div>
            <button
              onClick={submitImplementationRequest}
              disabled={requestSubmitting || !contactName || !contactEmail || !requestAutomation}
              className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[var(--color-surface)] text-white text-sm font-medium rounded hover:bg-[var(--color-surface-raised)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {requestSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              {requestSubmitting ? "Submitting..." : "Request Implementation"}
            </button>
          </div>
        )}
      </Modal>

    </div>
    </div>
  );
}
