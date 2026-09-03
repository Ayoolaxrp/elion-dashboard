"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import {
  Search, FileText, AlertTriangle, CheckCircle, Download,
  Mail, Calendar, ClipboardList, Target, ArrowRight, Eye, TrendingUp,
  Zap, Printer, ChevronDown, ChevronUp, X, Loader2, Activity,
  Radio, ArrowDown, Settings,
} from "lucide-react";
import { Modal, Input, Select } from "@/components/ui";
import { SiteFooter } from "@/components/site-footer";
import { Reveal } from "@/components/reveal";

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
  critical: { color: "text-[#f87171]", bg: "bg-[#f87171]/10", border: "border-[#f87171]/30", dot: "bg-[#f87171]" },
  high: { color: "text-[var(--color-warning)]", bg: "bg-[var(--color-warning)]/10", border: "border-[var(--color-warning)]/30", dot: "bg-[var(--color-warning)]" },
  medium: { color: "text-[var(--color-accent-bright)]", bg: "bg-[var(--color-accent)]/10", border: "border-[var(--color-accent)]/30", dot: "bg-[var(--color-accent)]" },
  low: { color: "text-[var(--color-text-muted)]", bg: "bg-[var(--color-surface)]", border: "border-[var(--color-border)]", dot: "bg-zinc-400" },
};

const METHOD_CATEGORIES = [
  { icon: Zap, title: "Lead Response", q: "How quickly does a new enquiry receive a meaningful response?", tag: "response" },
  { icon: Mail, title: "Follow-Up", q: "What happens after the first interaction?", tag: "followup" },
  { icon: Calendar, title: "Booking", q: "How easily can a lead become an appointment?", tag: "booking" },
  { icon: TrendingUp, title: "Revenue Recovery", q: "What happens to opportunities that go cold?", tag: "recovery" },
  { icon: Settings, title: "Operations", q: "Where are humans repeatedly doing work software could handle?", tag: "operations" },
] as const;

/* ──────────── Component ──────────── */

const SCAN_PHASES = [
  { pct: 8, text: "Scanning public presence..." },
  { pct: 18, text: "Analyzing contact channels..." },
  { pct: 28, text: "Detecting website technology..." },
  { pct: 38, text: "Scanning social media profiles..." },
  { pct: 48, text: "Checking WhatsApp integration..." },
  { pct: 58, text: "Mapping booking flow..." },
  { pct: 68, text: "Checking CRM and email tools..." },
  { pct: 78, text: "Reviewing industry signals..." },
  { pct: 88, text: "Identifying follow-up gaps..." },
  { pct: 96, text: "Generating operational findings..." },
];

export default function AuditPage() {
  const [showForm, setShowForm] = useState(true);
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [website, setWebsite] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [showMore, setShowMore] = useState(false);
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
  const consoleRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const findingCounter = useRef(0);

  /* ── Hero scroll transformation: console slides up over the hero ── */
  useEffect(() => {
    const hero = heroRef.current;
    const consoleEl = consoleRef.current;
    if (!hero || !consoleEl) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let ticking = false;
    const update = () => {
      ticking = false;
      const r = consoleEl.getBoundingClientRect();
      const vh = window.innerHeight;
      const progress = Math.min(1, Math.max(0, (vh * 0.55 - r.top) / (vh * 0.45)));
      hero.style.opacity = String(1 - progress * 0.85);
      hero.style.transform = `translateY(${-progress * 28}px) scale(${1 - progress * 0.04})`;
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

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
    setScanPhase(SCAN_PHASES[0].text);
    setFindings([]);
    findingCounter.current = 0;

    const phaseActions: Array<{ pct: number; text: string; action: () => void }> = [
      { pct: 8, text: "Scanning public presence...", action: () => addFinding("Search", "Business lookup", `Searching for "${companyName}" across the web`, "found", "search") },
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
      if (phaseIdx < phaseActions.length) {
        setScanProgress(phaseActions[phaseIdx].pct);
        setScanPhase(phaseActions[phaseIdx].text);
        phaseActions[phaseIdx].action();
        phaseIdx++;
      }
    }, 480);

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
      await new Promise((r) => setTimeout(r, 450));

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
      requestAnimationFrame(() => {
        document.getElementById("results")?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
      });
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

  const getScoreColor = (s: number) => (s < 40 ? "text-[#f87171]" : s < 65 ? "text-[var(--color-warning)]" : "text-[var(--color-success)]");
  const getScoreRing = (s: number) => {
    const circumference = 2 * Math.PI * 54;
    const offset = circumference - (s / 100) * circumference;
    const color = s < 40 ? "#f87171" : s < 65 ? "#fbbf24" : "#34d399";
    return { circumference, offset, color };
  };

  const resetAudit = () => {
    setAuditResult(null);
    setFindings([]);
    setScanPhase("");
    setScanProgress(0);
    setShowForm(true);
    setError("");
    requestAnimationFrame(() => {
      document.getElementById("audit")?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
    });
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

  const idle = !auditResult && !isScanning;

  /* ──── Render ──── */

  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      <a href="#audit" className="skip-to-content">Skip to audit</a>

      {/* ──── Navigation ──── */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-nav">
        <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2" aria-label="ELION home">
            <img src="/brand/elion-e-icon.svg" alt="" width={26} height={26} />
            <span className="font-bold text-[var(--color-text-primary)] tracking-tight text-sm" style={{ fontFamily: "Space Grotesk, sans-serif" }}>ELION</span>
          </a>
          <div className="hidden md:flex items-center gap-7 text-sm">
            <a href="/audit" className="text-[var(--color-accent-bright)] font-medium">Audit</a>
            <a href="/demo" className="text-[var(--color-text-secondary)] hover:text-white transition-colors">Demo</a>
            <a href="/landing/pricing" className="text-[var(--color-text-secondary)] hover:text-white transition-colors">Pricing</a>
            <a href="/landing/about" className="text-[var(--color-text-secondary)] hover:text-white transition-colors">About</a>
          </div>
          <a
            href="#audit"
            onClick={(e) => {
              e.preventDefault();
              if (!idle) { resetAudit(); } else {
                document.getElementById("audit")?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
              }
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--color-accent)] text-white text-sm font-semibold hover:bg-[var(--color-accent-hover)] transition-all active:scale-[0.97]"
          >
            Run Free Audit
          </a>
        </nav>
      </header>

      <main id="main">
        {/* ──── 01 · CINEMATIC HERO ──── */}
        <section ref={heroRef} className="relative pt-36 pb-28 md:pt-44 md:pb-40 px-6 overflow-hidden will-change-transform">
          {/* faint data grid */}
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage:
                "linear-gradient(to right, rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.5) 1px, transparent 1px)",
              backgroundSize: "56px 56px",
            }}
          />
          {/* restrained radial glows (no blur filters) */}
          <div aria-hidden="true" className="absolute top-10 left-1/2 -translate-x-1/2 w-[860px] h-[520px] pointer-events-none" style={{ background: "radial-gradient(closest-side, rgba(79,124,255,0.09), transparent 70%)" }} />
          <div aria-hidden="true" className="absolute bottom-0 left-[12%] w-[380px] h-[300px] pointer-events-none" style={{ background: "radial-gradient(closest-side, rgba(0,212,255,0.05), transparent 70%)" }} />

          <div className="relative max-w-3xl mx-auto text-center">
            <div className="animate-hero-in">
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[var(--color-accent)]/20 bg-[var(--color-accent)]/10">
                <Radio className="w-3.5 h-3.5 text-[var(--color-accent-bright)]" />
                <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--color-accent-bright)]">Operational Diagnostic</span>
              </span>
            </div>

            <h1 className="animate-hero-slide mt-8 text-5xl md:text-7xl font-bold text-[var(--color-text-primary)] leading-[1.04] tracking-[-0.03em]">
              Find what&apos;s leaking
              <br />
              <span className="bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-cyan)] bg-clip-text text-transparent">from your business.</span>
            </h1>

            <p className="animate-hero-in mt-7 text-lg md:text-xl text-[var(--color-text-secondary)] max-w-2xl mx-auto leading-relaxed" style={{ animationDelay: "120ms" }}>
              ELION scans your public digital presence to uncover operational gaps that may be costing you leads, bookings and revenue.
            </p>

            <div className="animate-hero-in mt-10 flex flex-col sm:flex-row items-center justify-center gap-4" style={{ animationDelay: "200ms" }}>
              <a
                href="#audit"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById("audit")?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
                }}
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--color-accent)] text-white font-semibold hover:bg-[var(--color-accent-hover)] transition-all shadow-lg shadow-[var(--color-accent)]/20 active:scale-[0.97] px-8 py-4 text-base"
              >
                Run Free Audit
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
              <a
                href="#example"
                onClick={(e) => {
                  e.preventDefault();
                  const el = document.getElementById("example");
                  if (el) el.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
                  else document.getElementById("method")?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-light)] hover:text-white transition-all active:scale-[0.97] px-8 py-4 text-base"
              >
                <Eye className="w-4 h-4" />
                See an Example
              </a>
            </div>

            {/* status strip — communicates analysis, not live results */}
            <div className="animate-hero-in mt-14 inline-flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] text-[var(--color-text-muted)] font-medium tracking-wide" style={{ animationDelay: "280ms" }}>
              <span className="inline-flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)]" />
                Public digital presence
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)]" />
                5 leak categories
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-text-muted)]" />
                No credit card
              </span>
            </div>
          </div>
        </section>

        {/* ──── 02 · AUDIT CONSOLE (revealed from beneath the hero) ──── */}
        <section id="audit" className="relative z-10 -mt-20 md:-mt-24 px-6 pb-10 scroll-mt-20">
          <div ref={consoleRef} className="max-w-3xl mx-auto">
            {/* Loading / live-diagnostic panel */}
            {isScanning && (
              <div className="rounded-2xl border border-[var(--color-border)]/60 bg-[var(--color-surface-raised)] shadow-2xl shadow-black/40 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-3.5 border-b border-[var(--color-border)]/50">
                  <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--color-accent-bright)]" />
                    Live analysis
                  </div>
                  <span className="font-mono text-xs font-bold text-[var(--color-accent-bright)]">{scanProgress}%</span>
                </div>
                <div className="p-6 md:p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg font-bold text-[var(--color-text-primary)] tracking-tight">Analyzing {companyName}</h2>
                      <p className="text-sm text-[var(--color-accent-bright)] mt-0.5 font-medium">{scanPhase}</p>
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-[var(--color-surface-elevated)] rounded-full overflow-hidden mb-6">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${scanProgress}%`,
                        background: "linear-gradient(90deg, var(--color-accent), var(--color-accent-cyan))",
                      }}
                    />
                  </div>
                  <ul className="space-y-2 max-h-[300px] overflow-y-auto pr-1" aria-live="polite">
                    {findings.map((f) => (
                      <li key={f.id} className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]/60 animate-fade-in">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                          f.status === "found" ? "bg-[var(--color-success)]/15" : f.status === "missing" ? "bg-[#f87171]/15" : "bg-[var(--color-warning)]/15"
                        }`}>
                          {f.status === "found" ? (
                            <CheckCircle className="w-3 h-3 text-[var(--color-success)]" />
                          ) : f.status === "missing" ? (
                            <X className="w-3 h-3 text-[#f87171]" />
                          ) : (
                            <AlertTriangle className="w-3 h-3 text-[var(--color-warning)]" />
                          )}
                        </span>
                        <span className="text-xs font-medium text-[var(--color-text-primary)]">{f.label}</span>
                        <span className="ml-auto text-[11px] text-[var(--color-text-muted)] truncate max-w-[45%]">{f.detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Input console */}
            {idle && (
              <div className="rounded-2xl border border-[var(--color-border)]/60 bg-[var(--color-surface-raised)] shadow-2xl shadow-black/40 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-3.5 border-b border-[var(--color-border)]/50">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-border-light)]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-border-light)]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-border-light)]" />
                    <span className="ml-2 text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--color-text-muted)]">ELION Business Audit</span>
                  </div>
                  <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] text-[var(--color-text-muted)]">
                    <Activity className="w-3 h-3" />
                    Public intelligence
                  </span>
                </div>

                <div className="p-6 md:p-8">
                  {error && (
                    <div className="mb-5 p-3.5 rounded-xl bg-[#f87171]/10 border border-[#f87171]/30 text-sm text-[#f87171]" role="alert">
                      {error}
                    </div>
                  )}

                  <div className="mb-2">
                    <label htmlFor="audit-company" className="block text-sm font-semibold text-[var(--color-text-primary)] mb-1">
                      What business should we analyze?
                    </label>
                    <p className="text-xs text-[var(--color-text-muted)] mb-4">
                      We analyze publicly available information across the business&apos;s digital presence. Nothing is private or intrusive.
                    </p>
                  </div>

                  <div className="space-y-3.5">
                    <Input
                      label="Company name"
                      placeholder="e.g. Lagos Real Estate Agency"
                      value={companyName}
                      onChange={setCompanyName}
                    />
                    <Input
                      label="Website (optional)"
                      placeholder="e.g. business.com.ng"
                      value={website}
                      onChange={setWebsite}
                    />

                    {showMore && (
                      <div className="rounded-xl border border-[var(--color-border)]/60 bg-[var(--color-surface)] p-4 space-y-3.5 animate-fade-in">
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          <Input label="Your name (optional)" placeholder="Your name" value={contactName} onChange={setContactName} />
                          <Input label="Email (optional)" placeholder="you@company.com" value={contactEmail} onChange={setContactEmail} />
                        </div>
                        <p className="text-[11px] text-[var(--color-text-muted)] leading-relaxed">
                          Adding your contact lets us send you the full written report and tailored recommendations.
                        </p>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => setShowMore(!showMore)}
                      className="text-xs font-medium text-[var(--color-accent-bright)] hover:text-white transition-colors inline-flex items-center gap-1"
                    >
                      {showMore ? "Hide optional details" : "Add optional details"}
                      {showMore ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      onClick={runAudit}
                      disabled={isScanning || !companyName.trim()}
                      className="w-full group inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-[var(--color-accent)] text-white font-semibold hover:bg-[var(--color-accent-hover)] transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[var(--color-accent)]/20"
                    >
                      {isScanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                      {isScanning ? "Scanning..." : "Run Free Audit"}
                    </button>
                    <p className="text-[11px] text-[var(--color-text-muted)] text-center">
                      No credit card &middot; No commitment &middot; Evidence-based findings
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ──── Results console ──── */}
            {auditResult && !isScanning && (
              <div className="rounded-2xl border border-[var(--color-border)]/60 bg-[var(--color-surface-raised)] shadow-2xl shadow-black/40 overflow-hidden" id="results">
                {/* toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3.5 border-b border-[var(--color-border)]/50">
                  <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
                    <FileText className="w-3.5 h-3.5 text-[var(--color-accent-bright)]" />
                    Intelligence Report
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={exportReport} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg hover:text-white hover:border-[var(--color-border-light)] transition-colors">
                      <Download className="w-3.5 h-3.5" /> Export
                    </button>
                    <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg hover:text-white hover:border-[var(--color-border-light)] transition-colors">
                      <Printer className="w-3.5 h-3.5" /> Print
                    </button>
                    <button onClick={resetAudit} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[var(--color-accent)] rounded-lg hover:bg-[var(--color-accent-hover)] transition-colors">
                      <Search className="w-3.5 h-3.5" /> New Audit
                    </button>
                  </div>
                </div>

                <div className="p-6 md:p-8 space-y-8">
                  {/* Score hero */}
                  <div className="flex flex-col sm:flex-row items-center gap-8">
                    <div className="relative shrink-0">
                      <svg width="140" height="140" viewBox="0 0 140 140">
                        <circle cx="70" cy="70" r="54" fill="none" stroke="var(--color-surface-elevated)" strokeWidth="8" />
                        <circle
                          cx="70" cy="70" r="54" fill="none"
                          stroke={getScoreRing(auditResult.score).color}
                          strokeWidth="8"
                          strokeLinecap="round"
                          strokeDasharray={getScoreRing(auditResult.score).circumference}
                          strokeDashoffset={getScoreRing(auditResult.score).offset}
                          transform="rotate(-90 70 70)"
                          className="transition-all duration-1000"
                          style={{ filter: `drop-shadow(0 0 12px ${getScoreRing(auditResult.score).color}55)` }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className={`text-4xl font-bold tracking-tight ${getScoreColor(auditResult.score)}`}>{auditResult.score}</span>
                        <span className="text-[11px] text-[var(--color-text-muted)]">/100</span>
                      </div>
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--color-text-muted)] mb-1">Automation Score</p>
                      <h2 className="text-2xl md:text-3xl font-bold text-[var(--color-text-primary)] tracking-tight">{auditResult.companyName}</h2>
                      <p className="text-sm text-[var(--color-text-muted)] mt-1">{auditResult.industry} &middot; {auditResult.date}</p>
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-4">
                        {auditResult.criticalLeaks > 0 && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f87171]/10 border border-[#f87171]/25 text-xs font-semibold text-[#f87171]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#f87171]" /> {auditResult.criticalLeaks} Critical finding{auditResult.criticalLeaks > 1 ? "s" : ""}
                          </span>
                        )}
                        {auditResult.highLeaks > 0 && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/25 text-xs font-semibold text-[var(--color-warning)]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-warning)]" /> {auditResult.highLeaks} High priority
                          </span>
                        )}
                        {auditResult.criticalLeaks === 0 && auditResult.highLeaks === 0 && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--color-success)]/10 border border-[var(--color-success)]/25 text-xs font-semibold text-[var(--color-success)]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)]" /> Strong digital presence
                          </span>
                        )}
                      </div>
                      <div className="mt-5 rounded-xl border border-[var(--color-border)]/60 bg-[var(--color-surface)] px-5 py-3.5 inline-flex flex-col sm:flex-row items-center gap-1 sm:gap-3">
                        <span className="text-xl font-bold text-[var(--color-text-primary)]">{auditResult.estimatedAnnualSavings}</span>
                        <span className="text-[11px] text-[var(--color-text-muted)]">potential annual savings (estimate)</span>
                      </div>
                    </div>
                  </div>

                  {/* What we found */}
                  <div>
                    <h3 className="text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-[0.16em] mb-4">Research Findings</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {findings.filter((f) => f.category !== "Assessment" && f.category !== "Industry").map((f) => (
                        <div key={f.id} className="flex items-center gap-3 py-2.5 px-3.5 rounded-xl border border-[var(--color-border)]/60 bg-[var(--color-surface)]">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                            f.status === "found" ? "bg-[var(--color-success)]/15" : f.status === "missing" ? "bg-[#f87171]/15" : "bg-[var(--color-warning)]/15"
                          }`}>
                            {f.status === "found" ? <CheckCircle className="w-3.5 h-3.5 text-[var(--color-success)]" /> :
                             f.status === "missing" ? <X className="w-3.5 h-3.5 text-[#f87171]" /> :
                             <AlertTriangle className="w-3.5 h-3.5 text-[var(--color-warning)]" />}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-[var(--color-text-primary)]">{f.label}</p>
                            <p className="text-[11px] text-[var(--color-text-muted)] truncate">{f.detail}</p>
                          </div>
                          <span className={`text-[10px] font-semibold uppercase tracking-wider shrink-0 ${
                            f.status === "found" ? "text-[var(--color-success)]" : f.status === "missing" ? "text-[#f87171]" : "text-[var(--color-warning)]"
                          }`}>{f.status === "found" ? "Found" : f.status === "missing" ? "Missing" : "Partial"}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Leak analysis */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-[0.16em]">Leak Analysis</h3>
                      <div className="flex items-center gap-3 text-[11px] text-[var(--color-text-muted)]">
                        {auditResult.criticalLeaks > 0 && <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#f87171]" />Critical</span>}
                        {auditResult.highLeaks > 0 && <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[var(--color-warning)]" />High</span>}
                      </div>
                    </div>
                    <div className="space-y-2.5">
                      {auditResult.leaks.map((leak) => {
                        const sc = SEVERITY_CONFIG[leak.severity];
                        const isExpanded = expandedLeakId === leak.id;
                        return (
                          <div key={leak.id} className={`border rounded-xl transition-colors ${sc.border} ${isExpanded ? sc.bg : "bg-[var(--color-surface)] hover:border-[var(--color-border-light)]"}`}>
                            <button
                              className="w-full text-left p-4.5 px-5 py-4"
                              onClick={() => setExpandedLeakId(isExpanded ? null : leak.id)}
                              aria-expanded={isExpanded}
                            >
                              <div className="flex items-start gap-3.5">
                                <span className={`w-2 h-2 rounded-full mt-2 shrink-0 ${sc.dot}`} />
                                <div className="flex-1 min-w-0">
                                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                                    <span className="text-sm font-semibold text-[var(--color-text-primary)]">{leak.area}</span>
                                    <div className="flex items-center gap-2.5 shrink-0">
                                      <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${sc.bg} ${sc.color}`}>{leak.severity}</span>
                                      <span className="text-xs font-medium text-[var(--color-text-secondary)]">{leak.estimatedSavings}</span>
                                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-[var(--color-text-muted)]" /> : <ChevronDown className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />}
                                    </div>
                                  </div>
                                  <p className="text-xs text-[var(--color-text-secondary)] mt-1.5 line-clamp-2 leading-relaxed">{leak.description}</p>
                                </div>
                              </div>
                            </button>
                            {isExpanded && (
                              <div className="px-5 pb-5 ml-5 border-t border-[var(--color-border)]/60">
                                <div className="mt-4 space-y-3.5">
                                  {leak.evidence && leak.evidence.length > 0 && (
                                    <div className="bg-[var(--color-accent)]/8 rounded-xl border border-[var(--color-accent)]/15 p-4">
                                      <div className="flex items-center gap-2 mb-2">
                                        <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-[var(--color-accent)]/15 text-[var(--color-accent-bright)]">Observed</span>
                                        <span className="text-[11px] text-[var(--color-accent-bright)]">What we found</span>
                                      </div>
                                      <ul className="space-y-1.5">
                                        {leak.evidence.map((e, i) => (
                                          <li key={i} className="flex items-start gap-2 text-xs text-[var(--color-text-secondary)]">
                                            <span className="w-1 h-1 rounded-full bg-[var(--color-accent)] mt-1.5 shrink-0" />
                                            {e}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                  <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]/60 p-4">
                                    <p className="text-[11px] font-semibold text-[var(--color-text-muted)] uppercase mb-1.5">Why it matters</p>
                                    <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">{leak.impact}</p>
                                  </div>
                                  <div className="bg-[var(--color-success)]/8 rounded-xl border border-[var(--color-success)]/15 p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-[var(--color-success)]/15 text-[var(--color-success)]">Recommended</span>
                                      <span className="text-[11px] text-[var(--color-success)]">Suggested automation opportunity</span>
                                    </div>
                                    <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">{leak.recommendation}</p>
                                  </div>
                                  <p className="text-[11px] text-[var(--color-text-muted)]">Source: {leak.source} &middot; Priority: {leak.severity}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Score breakdown */}
                  <div>
                    <h3 className="text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-[0.16em] mb-5">Score Breakdown</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
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
                            <span className="text-[var(--color-text-secondary)]">{item.label}</span>
                            <span className={`font-semibold ${item.score < 40 ? "text-[#f87171]" : item.score < 65 ? "text-[var(--color-warning)]" : "text-[var(--color-success)]"}`}>{item.score}%</span>
                          </div>
                          <div className="w-full bg-[var(--color-surface-elevated)] rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full transition-all duration-700 ${
                                item.score < 40 ? "bg-[#f87171]" : item.score < 65 ? "bg-[var(--color-warning)]" : "bg-[var(--color-success)]"
                              }`}
                              style={{ width: `${item.score}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recommended automations */}
                  {auditResult.automationRecommendations && (
                    <div>
                      <h3 className="text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-[0.16em] mb-4">Recommended Automations</h3>
                      <div className="flex flex-wrap gap-2 mb-6">
                        {auditResult.automationRecommendations.needs.map((n) => (
                          <span key={n} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[var(--color-surface-elevated)] text-[var(--color-text-primary)] rounded-full border border-[var(--color-border)]/60">
                            <Zap className="w-3 h-3 text-[var(--color-accent-bright)]" />{n}
                          </span>
                        ))}
                      </div>
                      <h4 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">Who does what, after ELION</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {auditResult.automationRecommendations.roles.map((role) => (
                          <div key={role.role} className="p-4 rounded-xl border border-[var(--color-border)]/60 bg-[var(--color-surface)]">
                            <p className="text-sm font-semibold text-[var(--color-text-primary)] mb-2.5">{role.role}</p>
                            <ul className="space-y-1.5">
                              {role.tasks.map((task, i) => (
                                <li key={i} className="flex items-start gap-2 text-xs text-[var(--color-text-secondary)]">
                                  <span className="w-1 h-1 rounded-full bg-[var(--color-accent)] mt-1.5 shrink-0" />
                                  {task}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quick wins */}
                  {auditResult.webResearch?.quickWins && auditResult.webResearch.quickWins.length > 0 && (
                    <div>
                      <h3 className="text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-[0.16em] mb-4">Quick Wins</h3>
                      <div className="space-y-2">
                        {auditResult.webResearch.quickWins.map((qw, i) => (
                          <div key={i} className="flex items-start gap-3 px-4 py-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]/60">
                            <TrendingUp className="w-4 h-4 text-[var(--color-success)] shrink-0 mt-0.5" />
                            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{qw}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* CTA */}
                  <div className="rounded-2xl border border-[var(--color-accent)]/20 bg-gradient-to-b from-[var(--color-accent)]/[0.08] to-transparent p-7 md:p-9 text-center">
                    <h3 className="text-xl md:text-2xl font-bold text-white mb-2 tracking-tight">Ready to fix these gaps?</h3>
                    <p className="text-sm text-[var(--color-text-muted)] mb-6 max-w-md mx-auto leading-relaxed">
                      Book a free discovery call. We will implement the top-priority automation for your business.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <button
                        onClick={() => setShowRequestModal(true)}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[var(--color-accent)] text-white text-sm font-semibold hover:bg-[var(--color-accent-hover)] transition-all active:scale-[0.97]"
                      >
                        <ClipboardList className="w-4 h-4" /> Request Implementation
                      </button>
                      <a
                        href="/landing/support"
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-[var(--color-border)] text-[var(--color-text-secondary)] text-sm font-medium hover:border-[var(--color-border-light)] hover:text-white transition-all active:scale-[0.97]"
                      >
                        <Mail className="w-4 h-4" /> Email Us
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Audit history */}
            {auditHistory.length > 1 && !isScanning && (
              <div className="mt-6 rounded-2xl border border-[var(--color-border)]/40 bg-[var(--color-surface)]/60 p-6">
                <h3 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-[0.16em] mb-4">Previous Audits</h3>
                <div className="space-y-2">
                  {auditHistory.slice(1).map((h) => (
                    <button
                      key={h.date + h.companyName}
                      className="w-full flex items-center justify-between py-3 px-4 rounded-xl border border-[var(--color-border)]/50 hover:border-[var(--color-border-light)] hover:bg-[var(--color-surface)] transition-colors text-left"
                      onClick={() => { setAuditResult(h); setFindings([]); setShowForm(false); }}
                    >
                      <div>
                        <p className="text-sm font-medium text-[var(--color-text-primary)]">{h.companyName}</p>
                        <p className="text-xs text-[var(--color-text-muted)]">{h.industry} &middot; {h.date}</p>
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
          </div>
        </section>

        {/* ──── 03 · WHAT ELION SEES (idle only) ──── */}
        {idle && (
          <section id="method" className="px-6 pt-24 md:pt-32 pb-8 scroll-mt-20">
            <div className="max-w-5xl mx-auto">
              <Reveal>
                <div className="text-center max-w-2xl mx-auto mb-14">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-accent-bright)] font-semibold mb-3">Diagnostic scope</p>
                  <h2 className="text-3xl md:text-5xl font-bold text-[var(--color-text-primary)] tracking-[-0.025em] leading-[1.1]">
                    What ELION looks for
                  </h2>
                  <p className="text-base text-[var(--color-text-secondary)] mt-4 leading-relaxed">
                    Five operational categories. Each one is a place where leads, time and revenue commonly leak.
                  </p>
                </div>
              </Reveal>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {METHOD_CATEGORIES.map((c, i) => (
                  <Reveal key={c.title} delay={i * 60} className={i === 0 ? "md:col-span-2 lg:col-span-1" : ""}>
                    <div className="group h-full rounded-2xl border border-[var(--color-border)]/50 bg-[var(--color-surface-raised)] p-6 hover:border-[var(--color-accent)]/40 transition-colors">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="w-9 h-9 rounded-xl bg-[var(--color-accent)]/10 flex items-center justify-center shrink-0">
                          <c.icon className="w-[18px] h-[18px] text-[var(--color-accent-bright)]" />
                        </span>
                        <h3 className="text-base font-bold text-[var(--color-text-primary)] tracking-tight">{c.title}</h3>
                      </div>
                      <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{c.q}</p>
                    </div>
                  </Reveal>
                ))}
                {/* spacer card CTA to complete the grid */}
                <Reveal delay={5 * 60}>
                  <div className="h-full rounded-2xl border border-[var(--color-accent)]/25 bg-gradient-to-b from-[var(--color-accent)]/[0.07] to-transparent p-6 flex flex-col justify-between min-h-[160px]">
                    <p className="text-sm font-semibold text-white">Every leak becomes an automation opportunity.</p>
                    <a
                      href="#audit"
                      onClick={(e) => {
                        e.preventDefault();
                        document.getElementById("audit")?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
                      }}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-accent-bright)] hover:text-white transition-colors"
                    >
                      Run your free audit <ArrowRight className="w-4 h-4" />
                    </a>
                  </div>
                </Reveal>
              </div>
            </div>
          </section>
        )}

        {/* ──── 04 · STICKY SCROLL STORY (idle only, vertical stack on mobile) ──── */}
        {idle && (
          <section className="px-6 py-24 md:py-32">
            <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16">
              {/* Sticky left rail (desktop) */}
              <div className="lg:sticky lg:top-32 lg:self-start">
                <Reveal>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-accent-bright)] font-semibold mb-3">The leak</p>
                  <h2 className="text-3xl md:text-5xl font-bold text-[var(--color-text-primary)] tracking-[-0.025em] leading-[1.08]">
                    The leak isn&apos;t always obvious.
                  </h2>
                  <p className="text-base text-[var(--color-text-secondary)] mt-5 leading-relaxed max-w-md">
                    A lead arrives and waits. A follow-up gets forgotten. A booking needs another message. Opportunity by opportunity, revenue disappears quietly.
                  </p>
                </Reveal>
              </div>

              {/* Right column sequence */}
              <div>
                <div className="space-y-3 mb-10">
                  {["A lead arrives", "No instant response", "The lead waits", "Follow-up never happens", "The opportunity disappears"].map((step, i) => (
                    <Reveal key={step} delay={i * 70}>
                      <div className="flex items-center gap-4 rounded-2xl border border-[var(--color-border)]/40 bg-[var(--color-surface-raised)] px-5 py-4">
                        <span className="w-7 h-7 rounded-lg bg-[#f87171]/10 border border-[#f87171]/20 text-[#f87171] text-xs font-bold flex items-center justify-center shrink-0">
                          {i + 1}
                        </span>
                        <span className="text-sm text-[var(--color-text-secondary)]">{step}</span>
                      </div>
                    </Reveal>
                  ))}
                </div>

                <div className="rounded-2xl border border-[var(--color-accent)]/25 bg-gradient-to-b from-[var(--color-accent)]/[0.08] to-transparent p-6 md:p-8">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-accent-bright)] font-semibold mb-5">With ELION</p>
                  <div className="space-y-2.5">
                    {["Lead captured", "Qualified", "Responded instantly", "Followed up automatically", "Booked", "Measured"].map((step, i) => (
                      <div key={step} className="flex items-center gap-4">
                        <span className="w-7 h-7 rounded-lg bg-[var(--color-success)]/10 border border-[var(--color-success)]/25 flex items-center justify-center shrink-0">
                          <CheckCircle className="w-3.5 h-3.5 text-[var(--color-success)]" />
                        </span>
                        <span className="text-sm font-medium text-[var(--color-text-primary)]">{step}</span>
                        {i < 5 && <ArrowDown className="w-3.5 h-3.5 text-[var(--color-text-muted)]/50 ml-auto" />}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ──── 05 · ILLUSTRATIVE EXAMPLE ──── */}
        {idle && (
          <section id="example" className="px-6 pb-24 scroll-mt-20">
            <div className="max-w-5xl mx-auto">
              <Reveal>
                <div className="text-center mb-10">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-accent-bright)] font-semibold mb-3">Sample findings</p>
                  <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-text-primary)] tracking-[-0.025em]">See what an audit finds</h2>
                  <p className="text-sm text-[var(--color-text-muted)] mt-3">Illustrative example &middot; Not a real client</p>
                </div>
              </Reveal>

              <Reveal delay={80}>
                <div className="rounded-2xl border border-[var(--color-border)]/50 bg-[var(--color-surface-raised)] shadow-2xl shadow-black/30 overflow-hidden">
                  <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]/50 bg-[var(--color-surface)]/50">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20 flex items-center justify-center">
                        <Target className="w-4 h-4 text-[var(--color-accent-bright)]" />
                      </span>
                      <div>
                        <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Sample: Lagos Real Estate Agency</h3>
                        <p className="text-[11px] text-[var(--color-text-muted)]">Illustrative example &middot; not a real client</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-2xl font-bold text-[var(--color-warning)]">42</div>
                      <div className="text-[10px] text-[var(--color-text-muted)]">Automation Score</div>
                    </div>
                  </div>

                  <div className="p-6 md:p-8 space-y-4">
                    <div className="rounded-xl border border-[#f87171]/20 bg-[#f87171]/[0.04] p-5">
                      <div className="flex items-start gap-4">
                        <span className="w-8 h-8 rounded-lg bg-[#f87171]/10 border border-[#f87171]/25 flex items-center justify-center shrink-0">
                          <AlertTriangle className="w-4 h-4 text-[#f87171]" />
                        </span>
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="text-sm font-semibold text-[var(--color-text-primary)]">Lead Response Gap</span>
                            <span className="px-2 py-0.5 bg-[#f87171]/10 text-[#f87171] text-[10px] font-semibold rounded uppercase">Critical</span>
                          </div>
                          <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed mb-2">
                            Website visitors are directed to WhatsApp, but there is no automated qualification step before the conversation begins.
                          </p>
                          <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                            <strong className="text-[var(--color-text-secondary)]">Evidence:</strong> No chatbot, no lead capture form, no instant response mechanism detected.
                          </p>
                          <div className="mt-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)]/50 p-3">
                            <p className="text-[11px] text-[var(--color-accent-bright)] font-medium">Recommended: Lead capture &rarr; qualification &rarr; instant WhatsApp response &rarr; booking &rarr; follow-up</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-[var(--color-warning)]/20 bg-[var(--color-warning)]/[0.04] p-5">
                      <div className="flex items-start gap-4">
                        <span className="w-8 h-8 rounded-lg bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/25 flex items-center justify-center shrink-0">
                          <AlertTriangle className="w-4 h-4 text-[var(--color-warning)]" />
                        </span>
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="text-sm font-semibold text-[var(--color-text-primary)]">No Follow-Up System</span>
                            <span className="px-2 py-0.5 bg-[var(--color-warning)]/10 text-[var(--color-warning)] text-[10px] font-semibold rounded uppercase">High</span>
                          </div>
                          <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed mb-3">
                            No automated follow-up sequence detected. After initial contact there is no systematic re-engagement for leads who do not convert immediately.
                          </p>
                          <div className="rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)]/50 p-3">
                            <p className="text-[11px] text-[var(--color-accent-bright)] font-medium">Recommended: Automated sequences across WhatsApp and email at 1, 3, 7 and 14-day intervals</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-[var(--color-border)]/60 bg-[var(--color-surface)] p-5">
                      <p className="text-xs font-semibold text-[var(--color-text-primary)] mb-4">What ELION would build</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="rounded-xl border border-[var(--color-border)]/50 bg-[var(--color-surface-raised)] p-4 text-center">
                          <p className="text-sm font-bold text-[var(--color-accent-bright)] mb-1">Lead Response</p>
                          <p className="text-[11px] text-[var(--color-text-muted)]">Capture, qualify and respond in seconds</p>
                        </div>
                        <div className="rounded-xl border border-[var(--color-border)]/50 bg-[var(--color-surface-raised)] p-4 text-center">
                          <p className="text-sm font-bold text-[var(--color-accent-bright)] mb-1">Follow-Up</p>
                          <p className="text-[11px] text-[var(--color-text-muted)]">Automated sequences across channels</p>
                        </div>
                      </div>
                    </div>

                    <div className="text-center pt-4">
                      <a
                        href="#audit"
                        onClick={(e) => {
                          e.preventDefault();
                          document.getElementById("audit")?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
                        }}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[var(--color-accent)] text-white text-sm font-semibold hover:bg-[var(--color-accent-hover)] transition-all active:scale-[0.97]"
                      >
                        Run your free audit <ArrowRight className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </div>
              </Reveal>
            </div>
          </section>
        )}
      </main>

      <SiteFooter />

      {/* ──── Implementation Request Modal ──── */}
      <Modal open={showRequestModal} onClose={() => { setShowRequestModal(false); setRequestSubmitted(false); }} title="Request Implementation">
        {requestSubmitted ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 rounded-full bg-[var(--color-success)]/15 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-6 h-6 text-[var(--color-success)]" />
            </div>
            <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-1">Request Received</h3>
            <p className="text-sm text-[var(--color-text-muted)] mb-4">We will contact you within 24 hours to discuss your automation needs.</p>
            <button onClick={() => { setShowRequestModal(false); setRequestSubmitted(false); }} className="px-4 py-2 bg-[var(--color-accent)] text-white text-sm font-medium rounded-lg hover:bg-[var(--color-accent-hover)] transition-colors">Done</button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-[var(--color-text-muted)]">Based on your audit for <strong className="text-[var(--color-text-primary)]">{companyName}</strong>, tell us which automation you want to implement.</p>
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
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">Additional message (optional)</label>
              <textarea
                rows={3}
                value={requestMessage}
                onChange={(e) => setRequestMessage(e.target.value)}
                placeholder="Anything else we should know?"
                className="w-full px-3.5 py-2.5 text-sm border border-[var(--color-border)] rounded-xl bg-[var(--color-surface-raised)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] resize-none"
              />
            </div>
            <button
              onClick={submitImplementationRequest}
              disabled={requestSubmitting || !contactName || !contactEmail || !requestAutomation}
              className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-3 bg-[var(--color-accent)] text-white text-sm font-semibold rounded-xl hover:bg-[var(--color-accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
            >
              {requestSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              {requestSubmitting ? "Submitting..." : "Request Implementation"}
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}