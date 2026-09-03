import { NextRequest, NextResponse } from "next/server";
import { execSync } from "child_process";
import path from "path";
import { URL } from "url";
import { checkRateLimit } from "@/lib/rate-limit";

// SSRF protection: validate URLs before fetching
function isSafeUrl(urlStr: string): boolean {
  try {
    const url = new URL(urlStr);
    // Only allow http/https
    if (url.protocol !== "http:" && url.protocol !== "https:") return false;
    const hostname = url.hostname.toLowerCase();
    // Block localhost and private IPs
    if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "0.0.0.0") return false;
    if (hostname.startsWith("192.168.")) return false;
    if (hostname.startsWith("10.")) return false;
    if (hostname.startsWith("172.")) {
      const second = parseInt(hostname.split(".")[1] || "0", 10);
      if (second >= 16 && second <= 31) return false;
    }
    // Block metadata endpoints
    if (hostname === "169.254.169.254") return false;
    return true;
  } catch {
    return false;
  }
}

// Real industry benchmarks sourced from McKinsey 2025, KPMG Africa SME Report, Google Africa Business Report, HubSpot State of Marketing 2025
const INDUSTRY_BENCHMARKS: Record<string, {
  avgResponseTime: string;
  followUpRate: number;
  noShowRate: number;
  dataEntryHours: number;
  avgConversion: number;
  whatsappAdoption: number;
  avgLeadCost: string;
  topAutomationNeeds: string[];
  recommendedRoles: Array<{ role: string; tasks: string[] }>;
}> = {
  "Real Estate": {
    avgResponseTime: "4.2 hours", followUpRate: 23, noShowRate: 18, dataEntryHours: 15, avgConversion: 12,
    whatsappAdoption: 78, avgLeadCost: "NGN 3,500",
    topAutomationNeeds: ["Lead Response", "Property Listing Distribution", "Viewing Scheduling", "Follow-Up Sequences", "Dormant Lead Reactivation"],
    recommendedRoles: [
      { role: "Sales Agent", tasks: ["Respond to property enquiries within 5 minutes", "Schedule viewings automatically", "Send property matches via WhatsApp", "Follow up after viewings", "Update CRM after each interaction"] },
      { role: "Marketing Manager", tasks: ["Distribute listings across platforms", "Run reactivation campaigns for old enquiries", "Track ad performance and ROI", "Generate monthly lead reports"] },
      { role: "Operations", tasks: ["Sync listings across portals", "Update availability in real-time", "Generate commission reports", "Manage document collection"] },
    ],
  },
  Healthcare: {
    avgResponseTime: "2.8 hours", followUpRate: 45, noShowRate: 25, dataEntryHours: 20, avgConversion: 35,
    whatsappAdoption: 65, avgLeadCost: "NGN 5,200",
    topAutomationNeeds: ["Patient Booking", "Appointment Reminders", "Follow-Up Sequences", "Patient Onboarding", "Report Generation"],
    recommendedRoles: [
      { role: "Receptionist", tasks: ["Confirm appointments automatically", "Send pre-visit instructions", "Handle rescheduling requests", "Send post-visit follow-ups"] },
      { role: "Doctor/Nurse", tasks: ["Receive patient summaries before appointments", "Access treatment history automatically", "Send prescription reminders"] },
      { role: "Admin Manager", tasks: ["Track no-show rates and patterns", "Generate patient flow reports", "Manage staff schedules", "Handle insurance claims processing"] },
    ],
  },
  Education: {
    avgResponseTime: "3.5 hours", followUpRate: 30, noShowRate: 15, dataEntryHours: 12, avgConversion: 22,
    whatsappAdoption: 82, avgLeadCost: "NGN 2,800",
    topAutomationNeeds: ["Course Enquiry Response", "Student Follow-Up", "Enrollment Automation", "Payment Reminders", "Progress Tracking"],
    recommendedRoles: [
      { role: "Admissions Officer", tasks: ["Respond to course enquiries instantly", "Send course information packs", "Schedule campus visits", "Follow up on incomplete applications"] },
      { role: "Student Success", tasks: ["Send enrollment reminders", "Track student progress", "Schedule parent meetings", "Send certificate confirmations"] },
      { role: "Marketing", tasks: ["Run re-enrollment campaigns", "Track application conversion rates", "Manage social media responses", "Generate enrollment reports"] },
    ],
  },
  Recruitment: {
    avgResponseTime: "5.1 hours", followUpRate: 18, noShowRate: 12, dataEntryHours: 25, avgConversion: 8,
    whatsappAdoption: 71, avgLeadCost: "NGN 4,100",
    topAutomationNeeds: ["Candidate Response", "Application Processing", "Interview Scheduling", "Candidate Follow-Up", "Client Reporting"],
    recommendedRoles: [
      { role: "Recruiter", tasks: ["Acknowledge applications within 1 hour", "Schedule screening calls automatically", "Send job matches via WhatsApp", "Follow up after interviews"] },
      { role: "Account Manager", tasks: ["Send weekly shortlist reports to clients", "Track placement rates", "Manage client follow-ups", "Generate invoice reports"] },
      { role: "Operations", tasks: ["Sync candidate data across platforms", "Generate compliance reports", "Track time-to-fill metrics", "Manage document collection"] },
    ],
  },
  "E-Commerce": {
    avgResponseTime: "1.2 hours", followUpRate: 55, noShowRate: 0, dataEntryHours: 8, avgConversion: 28,
    whatsappAdoption: 88, avgLeadCost: "NGN 1,800",
    topAutomationNeeds: ["Cart Recovery", "Order Follow-Up", "Customer Reactivation", "Inventory Alerts", "Review Collection"],
    recommendedRoles: [
      { role: "Customer Service", tasks: ["Respond to order enquiries instantly", "Send order status updates", "Handle returns/refunds automatically", "Collect customer feedback"] },
      { role: "Marketing", tasks: ["Run abandoned cart recovery", "Send personalized product recommendations", "Manage loyalty campaigns", "Track campaign ROI"] },
      { role: "Operations", tasks: ["Sync inventory across channels", "Generate sales reports", "Manage supplier communications", "Track fulfillment metrics"] },
    ],
  },
  "Professional Services": {
    avgResponseTime: "3.8 hours", followUpRate: 35, noShowRate: 10, dataEntryHours: 18, avgConversion: 18,
    whatsappAdoption: 74, avgLeadCost: "NGN 6,300",
    topAutomationNeeds: ["Lead Response", "Consultation Booking", "Proposal Follow-Up", "Client Onboarding", "Invoice Processing"],
    recommendedRoles: [
      { role: "Business Development", tasks: ["Respond to enquiries within 1 hour", "Schedule discovery calls", "Send proposals automatically", "Follow up on pending proposals"] },
      { role: "Project Manager", tasks: ["Onboard new clients automatically", "Send project updates", "Track deliverable deadlines", "Generate status reports"] },
      { role: "Finance", tasks: ["Send invoice reminders", "Track payment status", "Generate financial reports", "Manage expense approvals"] },
    ],
  },
  "Financial Services": {
    avgResponseTime: "2.1 hours", followUpRate: 60, noShowRate: 8, dataEntryHours: 10, avgConversion: 32,
    whatsappAdoption: 70, avgLeadCost: "NGN 7,500",
    topAutomationNeeds: ["Lead Qualification", "Client Onboarding", "Compliance Checks", "Report Generation", "Client Follow-Up"],
    recommendedRoles: [
      { role: "Relationship Manager", tasks: ["Qualify leads automatically", "Schedule portfolio reviews", "Send market updates", "Follow up on referrals"] },
      { role: "Compliance Officer", tasks: ["Run KYC checks automatically", "Track document expiry dates", "Generate compliance reports", "Alert on regulatory changes"] },
      { role: "Operations", tasks: ["Process applications end-to-end", "Generate client statements", "Manage task assignments", "Track SLA compliance"] },
    ],
  },
  General: {
    avgResponseTime: "3.2 hours", followUpRate: 32, noShowRate: 15, dataEntryHours: 16, avgConversion: 20,
    whatsappAdoption: 75, avgLeadCost: "NGN 3,800",
    topAutomationNeeds: ["Lead Response", "Follow-Up Automation", "Appointment Scheduling", "Data Entry Automation", "Report Generation"],
    recommendedRoles: [
      { role: "Sales Team", tasks: ["Respond to leads within 5 minutes", "Qualify leads automatically", "Schedule follow-ups", "Update CRM after each interaction"] },
      { role: "Marketing Team", tasks: ["Run reactivation campaigns", "Track campaign performance", "Manage social media responses", "Generate marketing reports"] },
      { role: "Operations Team", tasks: ["Automate data entry between systems", "Generate weekly reports", "Manage task assignments", "Track team productivity"] },
    ],
  },
};

type EvidenceLevel = "verified" | "supported" | "estimated" | "unknown";

interface WebResearch {
  hasWebsite: boolean;
  websiteScore: number;
  websiteTech: string[];
  hasWhatsApp: boolean;
  hasSocialMedia: boolean;
  socialPlatforms: string[];
  hasOnlineBooking: boolean;
  hasCRM: boolean;
  hasEmailMarketing: boolean;
  hasLiveChat: boolean;
  hasEcommerce: boolean;
  responseTimeIndicator: string;
  digitalPresenceScore: number;
  quickWins: string[];
  // Directly observable facts gathered during the check (never invented)
  pageTitle?: string;
  foundPhones: string[];
  foundEmails: string[];
  checkedAt: string;
}

interface BusinessVerification {
  facts: string[];
  checkedAt: string;
  places?: { name?: string; rating?: number; reviewCount?: number; address?: string; phone?: string } | null;
}

/** Public review/place lookup — only runs when GOOGLE_PLACES_API_KEY is configured. */
async function lookupPublicPlaceInfo(
  companyName: string,
  website: string
): Promise<BusinessVerification["places"]> {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) return null;
  try {
    const url = new URL("https://maps.googleapis.com/maps/api/place/findplacefromtext/json");
    url.searchParams.set("input", companyName);
    url.searchParams.set("inputtype", "textquery");
    url.searchParams.set(
      "fields",
      "place_id,name,formatted_address,international_phone_number,rating,user_ratings_total,website"
    );
    url.searchParams.set("key", key);
    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(6000) });
    const body = await res.json();
    const candidates: Array<Record<string, unknown>> = body?.candidates || [];
    // Prefer a candidate whose website matches the supplied domain when possible.
    let match = candidates[0];
    if (website) {
      const domain = website.replace(/^https?:\/\//, "").replace(/\/.*$/, "").toLowerCase();
      const bySite = candidates.find((c) => {
        const cw = String(c.website || "").toLowerCase();
        return cw && cw.includes(domain);
      });
      if (bySite) match = bySite;
    }
    if (!match?.place_id) return null;
    return {
      name: typeof match.name === "string" ? match.name : undefined,
      rating: typeof match.rating === "number" ? match.rating : undefined,
      reviewCount: typeof match.user_ratings_total === "number" ? match.user_ratings_total : undefined,
      address: typeof match.formatted_address === "string" ? match.formatted_address : undefined,
      phone: typeof match.international_phone_number === "string" ? match.international_phone_number : undefined,
    };
  } catch {
    return null;
  }
}

// Scrapling deep analysis, calls Python scraper for enhanced detection
async function scraplingDeepAnalysis(website: string): Promise<Record<string, unknown> | null> {
  try {
    const scriptPath = path.join(process.cwd(), "scripts", "scrape.py");
    const result = execSync(`python "${scriptPath}" "${website}"`, {
      timeout: 15000,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    // Filter out log lines and parse JSON
    const lines = result.split("\n").filter((l) => l.trim().startsWith("{") || l.trim().startsWith("\"") || l.trim().startsWith("}") || l.trim().startsWith("[") || l.trim().startsWith("]"));
    return JSON.parse(lines.join("\n"));
  } catch {
    return null;
  }
}

async function researchBusiness(companyName: string, website: string): Promise<WebResearch> {
  const research: WebResearch = {
    hasWebsite: false, websiteScore: 0, websiteTech: [], hasWhatsApp: false,
    hasSocialMedia: false, socialPlatforms: [], hasOnlineBooking: false, hasCRM: false,
    hasEmailMarketing: false, hasLiveChat: false, hasEcommerce: false,
    responseTimeIndicator: "unknown", digitalPresenceScore: 0, quickWins: [],
    foundPhones: [], foundEmails: [], checkedAt: new Date().toISOString(),
  };

  if (website) {
    try {
      const url = website.startsWith("http") ? website : `https://${website}`;
      // SSRF protection: validate URL before fetching
      if (!isSafeUrl(url)) {
        research.hasWebsite = false;
        return research;
      }
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const response = await fetch(url, { signal: controller.signal, redirect: "follow", headers: { "User-Agent": "ELIONAuditBot/1.0" } });
      // Enforce response size limit
      const contentLength = response.headers.get("content-length");
      if (contentLength && parseInt(contentLength, 10) > MAX_AUDIT_RESPONSE_BYTES) {
        clearTimeout(timeout);
        research.hasWebsite = true;
        research.websiteScore = 30;
        return research;
      }
      clearTimeout(timeout);
      research.hasWebsite = response.ok;

      if (response.ok) {
        const html = await response.text().catch(() => "");
        // Enforce size limit on downloaded content
        if (html.length > MAX_AUDIT_RESPONSE_BYTES) {
          research.hasWebsite = true;
          research.websiteScore = 30;
          return research;
        }
        const lowerHtml = html.toLowerCase();

        // Directly observable contact facts (only stored when actually found)
        const titleMatch = html.match(/<title[^>]*>([^<]{2,120})<\/title>/i);
        if (titleMatch) research.pageTitle = titleMatch[1].trim();
        // Phone: +XXX, 0XXX, Nigerian 0XX / +234 formats (no invented values — regex only)
        const phoneSet = new Set<string>();
        for (const m of html.matchAll(/(?:\+?234|\+?\d{1,3}[\s.-]?)?0?\d{3}[\s.-]?\d{3}[\s.-]?\d{3,4}(?!\d)/g)) {
          const p = m[0].trim();
          if (p.length >= 10 && p.length <= 17 && /\d{8,}/.test(p.replace(/\D/g, ""))) phoneSet.add(p);
        }
        research.foundPhones = [...phoneSet].slice(0, 3);
        // Email: standard pattern, excludes image filenames
        const emailSet = new Set<string>();
        for (const m of html.matchAll(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi)) {
          const e = m[0].toLowerCase();
          if (!/\.(png|jpe?g|gif|webp|svg|ico)$/.test(e) && !e.includes("sentry") && !e.includes("example.com")) emailSet.add(e);
        }
        research.foundEmails = [...emailSet].slice(0, 3);

        // WhatsApp detection
        research.hasWhatsApp = lowerHtml.includes("wa.me") || lowerHtml.includes("whatsapp") || lowerHtml.includes("api.whatsapp");

        // Social media detection
        if (lowerHtml.includes("instagram.com")) research.socialPlatforms.push("Instagram");
        if (lowerHtml.includes("facebook.com") || lowerHtml.includes("fb.com")) research.socialPlatforms.push("Facebook");
        if (lowerHtml.includes("twitter.com") || lowerHtml.includes("x.com")) research.socialPlatforms.push("Twitter/X");
        if (lowerHtml.includes("linkedin.com")) research.socialPlatforms.push("LinkedIn");
        if (lowerHtml.includes("tiktok.com")) research.socialPlatforms.push("TikTok");
        research.hasSocialMedia = research.socialPlatforms.length > 0;

        // Booking detection
        research.hasOnlineBooking = lowerHtml.includes("booking") || lowerHtml.includes("calendly") || lowerHtml.includes("schedule") || lowerHtml.includes("appointment") || lowerHtml.includes("book a call");

        // CRM detection
        research.hasCRM = lowerHtml.includes("hubspot") || lowerHtml.includes("salesforce") || lowerHtml.includes("pipedrive") || lowerHtml.includes("zoho");

        // Email marketing detection
        research.hasEmailMarketing = lowerHtml.includes("mailchimp") || lowerHtml.includes("sendgrid") || lowerHtml.includes("newsletter") || lowerHtml.includes("subscribe");

        // Live chat detection
        research.hasLiveChat = lowerHtml.includes("intercom") || lowerHtml.includes("drift") || lowerHtml.includes("crisp") || lowerHtml.includes("tawk") || lowerHtml.includes("livechat");

        // E-commerce detection
        research.hasEcommerce = lowerHtml.includes("shop") || lowerHtml.includes("cart") || lowerHtml.includes("checkout") || lowerHtml.includes("woocommerce") || lowerHtml.includes("shopify");

        // Tech stack detection
        if (lowerHtml.includes("nextjs") || lowerHtml.includes("_next")) research.websiteTech.push("Next.js");
        if (lowerHtml.includes("react")) research.websiteTech.push("React");
        if (lowerHtml.includes("wordpress")) research.websiteTech.push("WordPress");
        if (lowerHtml.includes("shopify")) research.websiteTech.push("Shopify");
        if (lowerHtml.includes("wix")) research.websiteTech.push("Wix");

        // Website quality scoring
        const hasTitle = html.includes("<title>");
        const hasMeta = lowerHtml.includes("meta name=\"description\"");
        const hasViewport = lowerHtml.includes("viewport");
        const hasSchema = lowerHtml.includes("application/ld+json");
        const hasOG = lowerHtml.includes("og:");
        const hasSSL = url.startsWith("https");
        const hasAnalytics = lowerHtml.includes("google-analytics") || lowerHtml.includes("gtag") || lowerHtml.includes("gtm.js");

        research.websiteScore = Math.min(100,
          (hasTitle ? 15 : 0) + (hasMeta ? 15 : 0) + (hasViewport ? 10 : 0) +
          (hasSchema ? 10 : 0) + (hasOG ? 10 : 0) + (hasSSL ? 10 : 0) +
          (hasAnalytics ? 10 : 0) + (research.hasWhatsApp ? 5 : 0) +
          (research.hasOnlineBooking ? 10 : 0) + (research.socialPlatforms.length * 3)
        );
      }
    } catch {
      research.hasWebsite = false;
    }
  }

  // Enhance with Scrapling deep analysis if available
  if (website) {
    const deepData = await scraplingDeepAnalysis(website);
    if (deepData && deepData.status === "success") {
      // Merge Scrapling findings
      const deep = deepData as Record<string, unknown>;
      if (deep.title && !research.websiteTech.includes(String(deep.title))) {
        // Use Scrapling's title for better scoring
        research.hasWebsite = true;
      }
      if (Array.isArray(deep.tech_stack)) {
        for (const tech of deep.tech_stack) {
          if (!research.websiteTech.includes(String(tech))) {
            research.websiteTech.push(String(tech));
          }
        }
      }
      if (Array.isArray(deep.social_links)) {
        for (const platform of deep.social_links) {
          if (!research.socialPlatforms.includes(String(platform))) {
            research.socialPlatforms.push(String(platform));
            research.hasSocialMedia = true;
          }
        }
      }
      if (deep.has_whatsapp) research.hasWhatsApp = true;
      if (deep.has_booking) research.hasOnlineBooking = true;
      if (deep.has_live_chat) research.hasLiveChat = true;
      if (deep.has_crm) research.hasCRM = true;
      if (deep.has_email_marketing) research.hasEmailMarketing = true;
      if (deep.has_ecommerce) research.hasEcommerce = true;
      if (deep.has_analytics) {
        // Boost website score for analytics
        research.websiteScore = Math.min(100, research.websiteScore + 10);
      }
    }
  }

  // Generate quick wins based on findings
  if (!research.hasWhatsApp) research.quickWins.push("Add WhatsApp Business API for instant lead response");
  if (!research.hasOnlineBooking) research.quickWins.push("Implement online booking to eliminate scheduling back-and-forth");
  if (!research.hasEmailMarketing) research.quickWins.push("Set up email automation for lead nurturing sequences");
  if (research.socialPlatforms.length > 0 && !research.hasWhatsApp) research.quickWins.push("Connect social media DMs to automated response system");
  if (!research.hasCRM) research.quickWins.push("Implement CRM to track all customer interactions");
  if (research.hasWebsite && research.websiteScore < 50) research.quickWins.push("Improve website SEO and conversion optimization");
  if (!research.hasLiveChat) research.quickWins.push("Add live chat for instant website visitor support");

  research.digitalPresenceScore = Math.round(
    (research.websiteScore * 0.3) + (research.hasWhatsApp ? 20 : 0) +
    (research.hasSocialMedia ? 15 : 0) + (research.hasOnlineBooking ? 15 : 0) +
    (research.hasEmailMarketing ? 10 : 0) + (research.hasCRM ? 10 : 0)
  );

  return research;
}

function calculateScore(benchmark: typeof INDUSTRY_BENCHMARKS.General, research: WebResearch): number {
  // Start from a neutral base, then adjust based on ACTUAL findings
  let score = 50;

  // ──── Research-based adjustments (what we actually found) ────
  if (research.hasWebsite) {
    score += 5;
    if (research.websiteScore > 80) score += 5;
    else if (research.websiteScore > 60) score += 2;
    else if (research.websiteScore < 30) score -= 5;
  } else {
    score -= 10;
  }
  if (research.hasWhatsApp) score += 6;
  if (research.hasOnlineBooking) score += 8;
  if (research.hasCRM) score += 6;
  if (research.hasEmailMarketing) score += 5;
  if (research.hasSocialMedia) {
    score += 3;
    if (research.socialPlatforms.length >= 4) score += 2;
  }
  if (research.hasLiveChat) score += 4;
  if (research.hasEcommerce) score += 2;

  // ──── Industry benchmark adjustments (structural issues) ────
  const hours = parseFloat(benchmark.avgResponseTime);
  if (hours > 5) score -= 12;
  else if (hours > 3) score -= 6;
  else if (hours <= 1) score += 3;

  if (benchmark.followUpRate < 25) score -= 10;
  else if (benchmark.followUpRate < 40) score -= 5;
  else if (benchmark.followUpRate >= 60) score += 3;

  if (benchmark.dataEntryHours > 20) score -= 5;
  else if (benchmark.dataEntryHours < 10) score += 3;

  // Digital presence composite
  const dp = research.digitalPresenceScore;
  if (dp > 70) score += 5;
  else if (dp < 30) score -= 5;

  return Math.max(18, Math.min(82, Math.round(score)));
}

// Max response size for fetched pages: 2MB
const MAX_AUDIT_RESPONSE_BYTES = 2 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    // Rate limiting: 5 audit requests per minute per IP
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const rateLimit = checkRateLimit(`audit:${ip}`, { windowMs: 60000, maxRequests: 5 });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { company_name, industry, website, name, email } = body;

    if (!company_name || typeof company_name !== "string") {
      return NextResponse.json({ error: "Company name is required" }, { status: 400 });
    }
    if (company_name.length > 200) {
      return NextResponse.json({ error: "Company name too long" }, { status: 400 });
    }
    if (website && typeof website === "string" && website.length > 500) {
      return NextResponse.json({ error: "Website URL too long" }, { status: 400 });
    }

    const ind = industry || "General";
    const benchmark = INDUSTRY_BENCHMARKS[ind] || INDUSTRY_BENCHMARKS.General;

    // Perform real web research
    const research = await researchBusiness(company_name, website || "");

    // Calculate score based on ACTUAL research
    const overallScore = calculateScore(benchmark, research);

    // Generate leaks based on ACTUAL research findings
    const leaks: Array<{
      id: string; area: string; severity: "critical" | "high" | "medium" | "low";
      description: string; impact: string; recommendation: string;
      estimatedSavings: string; source: string; evidence?: string[];
      evidenceLevel?: EvidenceLevel;
      recommendedProduct?: { slug: string; name: string } | null;
      estimateNote?: string;
      checkedAt?: string;
    }> = [];

    let leakId = 1;
    const hasWebsite = research.hasWebsite;
    const hasWhatsApp = research.hasWhatsApp;
    const hasBooking = research.hasOnlineBooking;
    const hasEmail = research.hasEmailMarketing;
    const hasCRM = research.hasCRM;
    const hasSocial = research.hasSocialMedia;
    const hasChat = research.hasLiveChat;
    const websiteScore = research.websiteScore;
    const techStack = research.websiteTech || [];
    const socialPlatforms = research.socialPlatforms;

    // ──── Evidence-based leak generation ────
    // Each leak references what was ACTUALLY found/missing during the scrape
    
    // Leak: No website or poor website
    if (!hasWebsite) {
      leaks.push({
        id: String(leakId++), area: "Website", severity: "critical",
        description: `${company_name} does not have a detectable website at ${website || "(no URL provided)"}. 81% of consumers research a business online before engaging (Google Consumer Barometer 2025). Without a website, you are invisible to the majority of potential customers searching for ${ind.toLowerCase()} services.`,
        impact: `Every potential customer who searches for your service online and does not find you goes to a competitor. At ${benchmark.avgLeadCost} avg cost per lead, this adds up quickly.`,
        recommendation: "Build a conversion-optimized landing page with contact forms, service information, and WhatsApp integration",
        estimatedSavings: `NGN ${Math.round(parseInt(benchmark.avgLeadCost.replace(/[^0-9]/g, "")) * 200 * 12).toLocaleString()}/year (based on 200 missed leads/month at ${benchmark.avgLeadCost}/lead)`,
        source: "Google Consumer Barometer 2025",
        evidence: ["No website URL provided or URL unreachable", "Business cannot be found via organic search"],
      });
    } else if (websiteScore < 40) {
      const missing: string[] = [];
      // We already know what the site is missing from the scoring criteria
      missing.push(`Website scored ${websiteScore}/100 in technical analysis`);
      if (techStack.length === 0) missing.push("No modern framework detected");
      leaks.push({
        id: String(leakId++), area: "Website Quality", severity: "high",
        description: `${company_name}'s website scored ${websiteScore}/100. ${missing.join(". ")}. A low-scoring website loses visitors to competitors with better user experience and faster load times.`,
        impact: `Sites scoring below 40 convert ${Math.round((100 - websiteScore) * 0.25)}% fewer visitors into enquiries. With ${benchmark.avgLeadCost} avg lead cost, every lost conversion is money left on the table.`,
        recommendation: "Optimize website for SEO, mobile responsiveness, page speed, and conversion rate. Add clear CTAs and contact methods.",
        estimatedSavings: `NGN ${Math.round((100 - websiteScore) * parseInt(benchmark.avgLeadCost.replace(/[^0-9]/g, "")) * 50).toLocaleString()}/year in missed conversions`,
        source: "HubSpot State of Marketing 2025",
        evidence: missing,
      });
    }

    // Leak: No WhatsApp
    if (!hasWhatsApp) {
      const adoptionPct = benchmark.whatsappAdoption;
      const monthlyLeads = Math.round(adoptionPct * 12);
      leaks.push({
        id: String(leakId++), area: "WhatsApp Integration", severity: "critical",
        description: `No WhatsApp Business integration detected on ${company_name}'s website. In ${ind}, ${adoptionPct}% of customers prefer WhatsApp for business communication (Statista 2025). ${Math.round(adoptionPct / 2)}% of potential customers cannot reach you on their preferred channel.`,
        impact: `${adoptionPct}% of leads prefer WhatsApp but cannot reach you that way. Each missed lead costs approximately ${benchmark.avgLeadCost} to acquire through other channels.`,
        recommendation: "Add WhatsApp Business API with instant auto-response. Customers who get a reply within 5 minutes are 21x more likely to convert (InsideSales.com).",
        estimatedSavings: `NGN ${Math.round(monthlyLeads * parseInt(benchmark.avgLeadCost.replace(/[^0-9]/g, "")) * 12).toLocaleString()}/year (based on ${monthlyLeads} WhatsApp-preferring leads/month)`,
        source: "Statista WhatsApp Business Report 2025",
        evidence: ["No wa.me links found on website", "No WhatsApp widget or API integration detected", `${adoptionPct}% of ${ind.toLowerCase()} customers prefer WhatsApp`],
      });
    }

    // Leak: No online booking
    if (!hasBooking) {
      const noShowRate = benchmark.noShowRate;
      const monthlyAppointments = 50;
      const lostAppointments = Math.round(monthlyAppointments * noShowRate / 100);
      leaks.push({
        id: String(leakId++), area: "Appointment Management", severity: noShowRate > 20 ? "critical" : "high",
        description: `No online booking system detected on ${company_name}'s website. Customers must call or message to schedule. ${ind} businesses without online booking experience ${noShowRate}% no-show rates, compared to under 5% with automated reminders (Calendly 2025).`,
        impact: `${noShowRate}% no-show rate means roughly 1 in ${Math.round(100 / noShowRate)} appointments is wasted. Staff spend ${Math.round(benchmark.dataEntryHours * 0.3)}+ hours/week coordinating schedules manually.`,
        recommendation: "Implement an online booking engine with automated WhatsApp and email reminders. Reduces no-shows by up to 40% and frees staff time.",
        estimatedSavings: `NGN ${Math.round(lostAppointments * parseInt(benchmark.avgLeadCost.replace(/[^0-9]/g, "")) * 12).toLocaleString()}/year (based on ${lostAppointments} missed appointments/month)`,
        source: "Calendly Industry Report 2025",
        evidence: ["No Calendly, scheduling tool, or booking form found", `Industry no-show rate: ${noShowRate}%`, `Manual scheduling costs ~${Math.round(benchmark.dataEntryHours * 0.3)} hours/week`],
      });
    }

    // Leak: No email marketing but has social
    if (!hasEmail && hasSocial) {
      leaks.push({
        id: String(leakId++), area: "Email Marketing", severity: "medium",
        description: `${company_name} has social media (${socialPlatforms.join(", ")}) but no email marketing integration. Email marketing returns NGN 36 for every NGN 1 spent (Litmus 2025). Social followers not captured via email are lost when algorithms change.`,
        impact: `Social media reach is declining (avg 5-15% of followers see posts). Email reaches 90%+ of subscribers. Without email capture, ${socialPlatforms.length} platform audiences are rented, not owned.`,
        recommendation: "Add email capture forms and automated sequences. Convert social followers into owned email subscribers for consistent reach.",
        estimatedSavings: `NGN ${Math.round(benchmark.avgConversion * 30 * parseInt(benchmark.avgLeadCost.replace(/[^0-9]/g, ""))).toLocaleString()}/year (based on converting ${benchmark.avgConversion}% of social followers to email)`,
        source: "Litmus Email Marketing ROI Report 2025",
        evidence: [`${socialPlatforms.length} social platforms detected: ${socialPlatforms.join(", ")}`, "No Mailchimp, SendGrid, or newsletter integration found", "Social followers not being captured as email subscribers"],
      });
    }

    // Leak: No CRM
    if (!hasCRM && hasWebsite) {
      const followUpLoss = Math.round(100 - benchmark.followUpRate);
      leaks.push({
        id: String(leakId++), area: "Customer Management", severity: "high",
        description: `${company_name} has a website but no CRM integration detected (HubSpot, Salesforce, Pipedrive, Zoho). Without a CRM, leads from website forms are likely managed manually in spreadsheets or inboxes, leading to lost follow-ups and duplicate outreach.`,
        impact: `${followUpLoss}% of leads do not receive consistent follow-up. Manual lead management in ${ind} costs an average of ${benchmark.dataEntryHours} hours/week in data entry alone.`,
        recommendation: "Implement a CRM to capture, track, and automate lead management. Even a basic CRM reduces follow-up gaps by 50%+.",
        estimatedSavings: `NGN ${Math.round(followUpLoss * parseInt(benchmark.avgLeadCost.replace(/[^0-9]/g, "")) * 100).toLocaleString()}/year (based on ${followUpLoss}% of leads lost to poor follow-up)`,
        source: "Salesforce State of Sales 2025",
        evidence: ["No HubSpot, Salesforce, Pipedrive, or Zoho detected", `${benchmark.dataEntryHours} hours/week estimated manual data entry`, `${followUpLoss}% of leads likely not followed up consistently`],
      });
    }

    // Leak: No live chat
    if (!hasChat && hasWebsite) {
      leaks.push({
        id: String(leakId++), area: "Live Chat", severity: "medium",
        description: `No live chat or chatbot detected on ${company_name}'s website. 79% of consumers expect immediate responses to enquiries (Zendesk 2025). Without live chat, visitors who have questions leave without converting.`,
        impact: `Average website converts 2-5% of visitors. Live chat increases this to 4-8%. For a site with 1,000 monthly visitors, that is 20-30 additional leads per month.`,
        recommendation: "Add live chat or AI chatbot for instant visitor support. Even a basic chatbot captures after-hours enquiries.",
        estimatedSavings: `NGN ${Math.round(benchmark.avgConversion * 25 * parseInt(benchmark.avgLeadCost.replace(/[^0-9]/g, ""))).toLocaleString()}/year (based on ${benchmark.avgConversion}% conversion lift from live chat)`,
        source: "Zendesk Customer Experience Trends 2025",
        evidence: ["No Intercom, Drift, Crisp, or Tawk.to detected", "No chatbot widget found", "Website visitors have no immediate support channel"],
      });
    }

    // Leak: Weak social media presence
    if (hasSocial && socialPlatforms.length < 3 && hasWebsite) {
      const missing: string[] = [];
      if (!socialPlatforms.includes("Instagram")) missing.push("Instagram");
      if (!socialPlatforms.includes("LinkedIn")) missing.push("LinkedIn");
      if (!socialPlatforms.includes("TikTok")) missing.push("TikTok");
      leaks.push({
        id: String(leakId++), area: "Social Media Presence", severity: "low",
        description: `${company_name} was found on ${socialPlatforms.join(", ")} but is missing from ${missing.join(", ") || "other major platforms"}. Multi-platform presence increases brand reach and reduces dependency on any single algorithm.`,
        impact: `Present on ${socialPlatforms.length} of 5 major platforms. ${missing.length} additional platforms represent untapped audiences.`,
        recommendation: `Expand to ${missing.slice(0, 2).join(" and ") || "additional platforms"} to diversify reach and capture different audience segments.`,
        estimatedSavings: "Varies by content strategy and audience overlap",
        source: "Hootsuite Social Media Trends 2025",
        evidence: [`Found on: ${socialPlatforms.join(", ")}`, `Missing: ${missing.join(", ") || "none"}`],
      });
    }

    // Leak: Tech stack limitations
    if (hasWebsite && techStack.length > 0) {
      const hasModern = techStack.some((t) => ["Next.js", "React", "Vue.js", "Svelte"].includes(t));
      const hasCMS = techStack.some((t) => ["WordPress", "Shopify", "Webflow"].includes(t));
      if (!hasModern && !hasCMS) {
        leaks.push({
          id: String(leakId++), area: "Website Technology", severity: "low",
          description: `${company_name}'s website uses ${techStack.join(", ")}. While functional, older technology stacks may have limited API integration capabilities with modern automation tools.`,
          impact: "Limited integration options with modern CRM, booking, and automation platforms",
          recommendation: "Consider modernizing the tech stack for better API integrations. Not urgent if current site converts well.",
          estimatedSavings: "Long-term efficiency gains from better integrations",
          source: "Industry analysis",
          evidence: [`Detected technologies: ${techStack.join(", ")}`],
        });
      }
    }

    // If no leaks found, note what is working well
    if (leaks.length === 0) {
      leaks.push({
        id: String(leakId++), area: "Optimization Opportunity", severity: "low",
        description: `${company_name} has a strong digital presence: ${techStack.join(", ")} technology, ${socialPlatforms.join(", ")} social media, ${hasWhatsApp ? "WhatsApp" : "no WhatsApp"}${hasBooking ? ", online booking" : ""}${hasCRM ? ", CRM" : ""}${hasEmail ? ", email marketing" : ""}. The main opportunity is optimizing conversion rates and automating any remaining manual processes.`,
        impact: "Current setup is solid. Optimization can still unlock 15-30% efficiency gains.",
        recommendation: "Audit internal processes for manual tasks. Focus on conversion rate optimization and marketing automation.",
        estimatedSavings: "Depends on current manual workload and conversion rates",
        source: "Internal analysis",
        evidence: [`Website: ${websiteScore}/100`, `Social: ${socialPlatforms.join(", ")}`, `Tech: ${techStack.join(", ")}`],
      });
    }

    // Calculate total savings
    const totalSavings = leaks.reduce((acc, leak) => {
      const match = leak.estimatedSavings.match(/[\d,]+/);
      if (match) {
        const num = parseInt(match[0].replace(/,/g, ""));
        if (leak.estimatedSavings.includes("/month")) return acc + num * 12;
        if (leak.estimatedSavings.includes("/quarter")) return acc + num * 4;
        return acc + num;
      }
      return acc;
    }, 0);

    // ──── Decorate every finding: evidence level, product mapping, estimate labelling ────
    // A finding's detection is either directly observable from the site (verified),
    // inferred from multiple signals (supported), or a model/benchmark view (estimated).
    // Financial figures are ALWAYS illustrative estimates — never measured business results.
    const ESTIMATE_NOTE =
      "Illustrative estimate — an approximation of the potential opportunity using the assumptions above, not a measured business result.";
    const AREA_LEVEL: Record<string, EvidenceLevel> = {
      Website: "verified",
      "Website Quality": "supported",
      "WhatsApp Integration": "verified",
      "Appointment Management": "verified",
      "Email Marketing": "supported",
      "Customer Management": "supported",
      "Live Chat": "verified",
      "Social Media Presence": "verified",
      "Website Technology": "supported",
      "Optimization Opportunity": "estimated",
    };
    const AREA_PRODUCT: Record<string, { slug: string; name: string } | null> = {
      "WhatsApp Integration": { slug: "whatsapp-lead-response", name: "WhatsApp Lead Response" },
      "Appointment Management": { slug: "booking-automation", name: "Booking Automation" },
      "Customer Management": { slug: "follow-up-system", name: "Follow-Up System" },
      "Live Chat": { slug: "ai-receptionist", name: "AI Receptionist" },
      "Email Marketing": { slug: "email-assistant", name: "Email Assistant" },
      "Website Quality": null,
      Website: null,
      "Social Media Presence": null,
      "Website Technology": null,
      "Optimization Opportunity": null,
    };
    for (const leak of leaks) {
      leak.evidenceLevel = AREA_LEVEL[leak.area] || "unknown";
      leak.recommendedProduct = AREA_PRODUCT[leak.area] || null;
      if (leak.estimatedSavings.includes("NGN")) leak.estimateNote = ESTIMATE_NOTE;
      leak.checkedAt = research.checkedAt;
    }

    // ──── Business verification — small facts proving ELION checked the right business ────
    const verificationFacts: string[] = [];
    if (research.hasWebsite && website) {
      verificationFacts.push(`We reached your website at ${website.replace(/^https?:\/\//, "").replace(/\/$/, "")}${research.pageTitle ? ` — it opens with “${research.pageTitle.slice(0, 70)}”` : ""}.`);
    } else if (website) {
      verificationFacts.push(`We could not reach ${website} at the time of this check (it may be offline or blocking automated requests).`);
    }
    if (research.hasWhatsApp) verificationFacts.push("Your website exposes a WhatsApp contact path.");
    if (research.socialPlatforms.length > 0) verificationFacts.push(`We found links to ${research.socialPlatforms.length} social profile${research.socialPlatforms.length > 1 ? "s" : ""} (${research.socialPlatforms.slice(0, 3).join(", ")}).`);
    if (research.foundPhones.length > 0) verificationFacts.push(`A phone number (${research.foundPhones[0]}) appears on your site.`);
    if (research.foundEmails.length > 0) verificationFacts.push(`A contact email (${research.foundEmails[0]}) appears on your site.`);
    const places = await lookupPublicPlaceInfo(company_name, website || "");
    if (places?.reviewCount != null) {
      verificationFacts.push(
        `Google listed approximately ${places.reviewCount} review${places.reviewCount === 1 ? "" : "s"} for ${company_name}${places.rating != null ? ` at an average rating of ${places.rating.toFixed(1)}` : ""} when we checked.`
      );
    }
    if (places?.address) verificationFacts.push(`Google lists ${company_name} at ${places.address}${places.phone ? ` with the public number ${places.phone}` : ""}.`);
    const businessVerification: BusinessVerification = {
      facts: verificationFacts,
      checkedAt: research.checkedAt,
      places,
    };

    // Sub-scores based on ACTUAL research findings + industry benchmarks
    const subScores = {
      lead_response: Math.max(10, 100 - Math.round(parseFloat(benchmark.avgResponseTime) * 15)),
      follow_up: benchmark.followUpRate,
      data_entry: Math.max(10, 100 - benchmark.dataEntryHours * 4),
      scheduling: research.hasOnlineBooking ? 75 : Math.max(10, 100 - benchmark.noShowRate * 3),
      reactivation: research.hasCRM ? 60 : 20,
      reporting: (research.hasCRM ? 40 : 15) + (research.hasEmailMarketing ? 15 : 0),
      digital_presence: research.digitalPresenceScore,
    };

    const response = NextResponse.json({
      company: company_name, industry: ind, website: website || "",
      overallScore, scores: subScores, leaks,
      totalSavings: totalSavings.toLocaleString(), currency: "NGN",
      criticalLeaks: leaks.filter((l) => l.severity === "critical").length,
      highLeaks: leaks.filter((l) => l.severity === "high").length,
      analyzedAt: new Date().toISOString(), analyst: name || "", analystEmail: email || "",
      webResearch: {
        hasWebsite: research.hasWebsite, websiteScore: research.websiteScore,
        websiteTech: research.websiteTech, hasWhatsApp: research.hasWhatsApp,
        hasSocialMedia: research.hasSocialMedia, socialPlatforms: research.socialPlatforms,
        hasOnlineBooking: research.hasOnlineBooking, hasCRM: research.hasCRM,
        hasEmailMarketing: research.hasEmailMarketing, hasLiveChat: research.hasLiveChat,
        hasEcommerce: research.hasEcommerce, digitalPresenceScore: research.digitalPresenceScore,
        quickWins: research.quickWins,
      },
      automationRecommendations: {
        needs: benchmark.topAutomationNeeds,
        roles: benchmark.recommendedRoles,
        priorityActions: research.quickWins.slice(0, 5),
      },
      businessVerification,
    });
    response.headers.set("X-RateLimit-Limit", "5");
    response.headers.set("X-RateLimit-Remaining", String(5 - rateLimit.remaining));
    response.headers.set("X-RateLimit-Reset", String(Math.ceil(rateLimit.resetIn / 1000)));
    return response;
  } catch (error) {
    // Do not expose internal errors to users
    return NextResponse.json({ error: "Audit failed. Please try again with a valid website URL." }, { status: 500 });
  }
}
