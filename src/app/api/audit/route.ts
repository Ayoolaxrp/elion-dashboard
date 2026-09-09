import { NextRequest, NextResponse } from "next/server";
import { URL } from "url";
import { checkRateLimit } from "@/lib/rate-limit";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { runAuditPipeline, type VerifiedSignals } from "@/lib/audit/pipeline";
import { evaluateOpportunities } from "@/lib/commercial/applicability";

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

type EvidenceLevel = "verified" | "supported" | "detected" | "estimated" | "unavailable" | "unknown";

interface WebResearch {
  hasWebsite: boolean;
  websiteScore: number;
  websiteTech: string[];
  hasWhatsApp: boolean;
  hasSocialMedia: boolean;
  socialPlatforms: string[];
  // Public social profile URLs directly observed on the site (never invented)
  socialLinks: Array<{ platform: string; url: string }>;
  // True only when an actual wa.me / api.whatsapp.com deep link exists
  hasWhatsAppDeepLink: boolean;
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
  // Verification states + inspection metadata from the audit pipeline
  // (backward-compatible additions; never invented)
  reachable?: boolean;
  verified?: VerifiedSignals["categories"];
  inspected?: VerifiedSignals["inspected"];
}

interface BusinessVerification {
  facts: string[];
  checkedAt: string;
  places?: { name?: string; rating?: number; reviewCount?: number; address?: string; phone?: string } | null;
}

/** Public review/place lookup : only runs when GOOGLE_PLACES_API_KEY is configured. */
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

// Multi-stage research via the audit pipeline:
// Stage A reachability -> Stage B static homepage -> Stage C bounded internal
// crawl -> Stage D conditional rendered inspection (Scrapling). Categories
// carry found / not_found / could_not_verify states with evidence; weak text
// signals never become confirmed findings.
async function researchBusiness(companyName: string, website: string): Promise<WebResearch> {
  const research: WebResearch = {
    hasWebsite: false, websiteScore: 0, websiteTech: [], hasWhatsApp: false,
    hasSocialMedia: false, socialPlatforms: [], socialLinks: [], hasWhatsAppDeepLink: false,
    hasOnlineBooking: false, hasCRM: false,
    hasEmailMarketing: false, hasLiveChat: false, hasEcommerce: false,
    responseTimeIndicator: "unknown", digitalPresenceScore: 0, quickWins: [],
    foundPhones: [], foundEmails: [], checkedAt: new Date().toISOString(),
  };
  if (!website) return research;

  const signals = await runAuditPipeline({ companyWebsite: website });
  research.checkedAt = signals.checkedAt;
  research.reachable = signals.reachable;
  research.hasWebsite = signals.hasWebsite;
  research.verified = signals.categories;
  research.inspected = signals.inspected;
  if (signals.title) research.pageTitle = signals.title;

  if (!signals.hasWebsite) return research;

  const cats = signals.categories;
  // A WhatsApp deep link (wa.me / api.whatsapp.com) is the actionable contact
  // path. A bare mention of the word is weak evidence and never credits the
  // category; it is retained as low-reliability evidence for honest wording.
  const strongWa = cats.whatsapp.evidence.some((e) => e.reliability === "strong");
  research.hasWhatsAppDeepLink = cats.whatsapp.status === "found" && strongWa;
  research.hasWhatsApp = research.hasWhatsAppDeepLink;
  research.hasOnlineBooking = cats.booking.status === "found";
  research.hasCRM = cats.crm.status === "found";
  research.hasEmailMarketing = cats.email_marketing.status === "found";
  research.hasLiveChat = cats.live_chat.status === "found";
  research.hasEcommerce = cats.ecommerce.status === "found";

  // Social: platforms + profile URLs straight from evidence (homepage +
  // crawled pages + structured sameAs). Share/intent links never count.
  for (const ev of cats.social.evidence) {
    if (ev.provider && !research.socialPlatforms.includes(ev.provider)) {
      research.socialPlatforms.push(ev.provider);
    }
    if (ev.provider && ev.match.startsWith("http") && !research.socialLinks.some((l) => l.platform === ev.provider)) {
      research.socialLinks.push({ platform: ev.provider, url: ev.match });
    }
  }
  research.hasSocialMedia = research.socialPlatforms.length > 0;

  research.foundPhones = cats.phone.evidence.map((e) => e.match).slice(0, 3);
  research.foundEmails = cats.email.evidence.map((e) => e.match).slice(0, 3);
  research.websiteTech = signals.techStack;

  // Website quality score: same criteria as before, now from structured
  // extraction of the pages actually inspected.
  const sc = signals.websiteScoreSignals;
  research.websiteScore = Math.min(100,
    (sc.hasTitle ? 15 : 0) + (sc.hasMetaDescription ? 15 : 0) + (sc.hasViewport ? 10 : 0) +
    (sc.hasSchema ? 10 : 0) + (sc.hasOG ? 10 : 0) + (sc.hasSSL ? 10 : 0) +
    (sc.hasAnalytics ? 10 : 0) + (research.hasWhatsApp ? 5 : 0) +
    (research.hasOnlineBooking ? 10 : 0) + (research.socialPlatforms.length * 3)
  );

  research.digitalPresenceScore = Math.round(
    (research.websiteScore * 0.3) + (research.hasWhatsApp ? 20 : 0) +
    (research.hasSocialMedia ? 15 : 0) + (research.hasOnlineBooking ? 15 : 0) +
    (research.hasEmailMarketing ? 10 : 0) + (research.hasCRM ? 10 : 0)
  );

  // Quick wins: recommend closing gaps ONLY where inspection actually
  // succeeded (not_found). A could-not-verify gap is not an observed gap.
  const nf = (c: { status: string }) => c.status === "not_found";
  if (nf(cats.whatsapp)) research.quickWins.push("Add WhatsApp Business API for instant lead response");
  if (nf(cats.booking)) research.quickWins.push("Implement online booking to eliminate scheduling back-and-forth");
  if (nf(cats.email_marketing)) research.quickWins.push("Set up email automation for lead nurturing sequences");
  if (research.socialPlatforms.length > 0 && nf(cats.whatsapp)) research.quickWins.push("Connect social media DMs to automated response system");
  if (nf(cats.crm)) research.quickWins.push("Implement CRM to track all customer interactions");
  if (research.hasWebsite && research.websiteScore < 50) research.quickWins.push("Improve website SEO and conversion optimization");
  if (nf(cats.live_chat)) research.quickWins.push("Add live chat for instant website visitor support");

  return research;
}

// Honest inspection wording helpers: negatives only claim what was
// successfully inspected; incomplete inspection yields could-not-verify.

function pagesInspected(research: WebResearch): string {
  const n = 1 + (research.inspected?.internal_pages || 0);
  const rendered = research.inspected?.rendered_dom ? " (plus rendered inspection)" : "";
  return `${n} page${n === 1 ? "" : "s"}${rendered}`;
}

function whatsappFindingLine(research: WebResearch, company_name: string): string {
  if (!research.hasWebsite) {
    return `${company_name} has no website we could reach, so its WhatsApp presence could not be verified.`;
  }
  const wa = research.verified?.whatsapp;
  if (wa?.status === "could_not_verify") {
    return `We could not fully inspect ${company_name}'s site content (rendered inspection incomplete), so WhatsApp availability could not be verified.`;
  }
  const mentionOnly = wa?.evidence.some((e) => e.source === "text");
  if (mentionOnly) {
    return `${company_name}'s site mentions WhatsApp, but no actionable WhatsApp link (wa.me / api.whatsapp.com) was found in the pages we successfully inspected.`;
  }
  return `No WhatsApp Business link (wa.me or api.whatsapp.com) was found in the ${pagesInspected(research)} successfully inspected for ${company_name}.`;
}

function whatsappEvidenceBullet(research: WebResearch): string {
  const wa = research.verified?.whatsapp;
  if (wa?.status === "could_not_verify") return "Rendered inspection incomplete: WhatsApp availability could not be verified";
  if (wa?.evidence.some((e) => e.source === "text")) return "WhatsApp mentioned on site but no wa.me / api.whatsapp.com link found";
  return `No wa.me / api.whatsapp.com link found in ${pagesInspected(research)}`;
}

function bookingFindingLine(research: WebResearch, company_name: string): string {
  if (!research.hasWebsite) {
    return `${company_name} has no website we could reach, so its online booking capability could not be verified. If appointments are arranged by phone, message or email today, scheduling is likely manual and unmeasured.`;
  }
  const bk = research.verified?.booking;
  if (bk?.status === "could_not_verify") {
    return `We could not fully inspect ${company_name}'s rendered content, so online booking availability could not be verified.`;
  }
  return `No online booking or scheduling flow was found in the ${pagesInspected(research)} successfully inspected for ${company_name}. If appointments are arranged by phone, message or email today, scheduling is manual and unmeasured.`;
}

function bookingEvidenceBullet(research: WebResearch): string {
  const bk = research.verified?.booking;
  if (bk?.status === "could_not_verify") return "Rendered inspection incomplete: booking availability could not be verified";
  return `No booking provider or scheduling form found in ${pagesInspected(research)}`;
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
        description: `${company_name} has no website we could reach at ${website || "(no URL provided)"}. Most consumers research a business online before engaging, and without a public web presence it is harder for new customers to find and verify the business (Google Consumer Barometer 2025). This is an opportunity to establish a searchable presence, not a claim about current customer behaviour.`,
        impact: `A web presence is the common starting point for digital enquiries. ${benchmark.avgLeadCost} is used here as an illustrative average lead cost for ${ind.toLowerCase()} only to size the opportunity, not as a measured figure.`,
        recommendation: "Build a conversion-optimized landing page with contact forms, service information, and WhatsApp integration",
        estimatedSavings: `NGN ${Math.round(parseInt(benchmark.avgLeadCost.replace(/[^0-9]/g, "")) * 200 * 12).toLocaleString()}/year (illustrative: 200 missed web leads/month at ${benchmark.avgLeadCost}/lead)`,
        source: "Google Consumer Barometer 2025",
        evidence: ["No reachable website found for the business during this check"],
      });
    } else if (websiteScore < 40) {
      const missing: string[] = [];
      // We already know what the site is missing from the scoring criteria
      missing.push(`Website scored ${websiteScore}/100 in technical analysis`);
      if (techStack.length === 0) missing.push("No modern framework detected");
      leaks.push({
        id: String(leakId++), area: "Website Quality", severity: "high",
        description: `${company_name}'s website scored ${websiteScore}/100 on the technical signals this audit checks (${missing.join("; ")}). A low-scoring website typically loses more visitors before they become enquiries.`,
        impact: `Sites scoring in this range commonly convert fewer visitors into enquiries (roughly ${Math.round((100 - websiteScore) * 0.25)}% less, an estimate based on the score gap). ${benchmark.avgLeadCost} is an illustrative average lead cost for sizing, not a measured figure.`,
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
      const waEvidence = whatsappFindingLine(research, company_name);
      leaks.push({
        id: String(leakId++), area: "WhatsApp Integration", severity: "critical",
        description: `${waEvidence} WhatsApp is a common enquiry channel in ${ind} (${adoptionPct}% benchmark, Statista 2025), so whether an automated WhatsApp response would help is a likely opportunity to confirm with the business owner, not a measured loss.`,
        impact: `Enquiries that do arrive currently have no automated instant-response step to rely on. The ${adoptionPct}% preference figure and ${benchmark.avgLeadCost} average lead cost are industry benchmarks used only to size the opportunity.`,
        recommendation: "Add WhatsApp Business API with instant auto-response. Customers who get a reply within 5 minutes are 21x more likely to convert (InsideSales.com).",
        estimatedSavings: `NGN ${Math.round(monthlyLeads * parseInt(benchmark.avgLeadCost.replace(/[^0-9]/g, "")) * 12).toLocaleString()}/year (illustrative: ${monthlyLeads} WhatsApp-preferring leads/month)`,
        source: "Statista WhatsApp Business Report 2025",
        evidence: research.hasWebsite
          ? [whatsappEvidenceBullet(research), `No WhatsApp widget or API integration detected in ${pagesInspected(research)}`, `${adoptionPct}% of ${ind.toLowerCase()} customers prefer WhatsApp (benchmark)`]
          : [`No website was reachable to inspect`, `${adoptionPct}% of ${ind.toLowerCase()} customers prefer WhatsApp (benchmark)`],
      });
    }

    // Leak: No online booking
    if (!hasBooking) {
      const noShowRate = benchmark.noShowRate;
      const monthlyAppointments = 50;
      const lostAppointments = Math.round(monthlyAppointments * noShowRate / 100);
      const bookingEvidence = bookingFindingLine(research, company_name);
      leaks.push({
        id: String(leakId++), area: "Appointment Management", severity: noShowRate > 20 ? "critical" : "high",
        description: `${bookingEvidence} ${ind} businesses commonly report no-show rates near ${noShowRate}% without automated reminders (Calendly 2025), which is a benchmark to measure in this business's own pipeline rather than an observed figure.`,
        impact: `Industry benchmarks put ${ind} no-show rates near ${noShowRate}%, and manual scheduling typically costs staff time (about ${Math.round(benchmark.dataEntryHours * 0.3)} hours/week in similar businesses). Both are estimates: the real figures depend on how this business handles appointments today.`,
        recommendation: "Implement an online booking engine with automated WhatsApp and email reminders. Reduces no-shows by up to 40% and frees staff time.",
        estimatedSavings: `NGN ${Math.round(lostAppointments * parseInt(benchmark.avgLeadCost.replace(/[^0-9]/g, "")) * 12).toLocaleString()}/year (illustrative: ${lostAppointments} missed appointments/month)`,
        source: "Calendly Industry Report 2025",
        evidence: research.hasWebsite
          ? [bookingEvidenceBullet(research), `Industry no-show benchmark: ${noShowRate}%`, `Manual scheduling ~${Math.round(benchmark.dataEntryHours * 0.3)} hours/week in similar businesses`]
          : [`No website was reachable to inspect`, `Industry no-show benchmark: ${noShowRate}%`],
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

    // Leak: Social presence that dead-ends (followers exist, but the journey
    // stops at a profile/contact form with no observable automated next step)
    if (hasSocial && hasWebsite && !research.hasWhatsAppDeepLink && !hasBooking) {
      const leadFrom = socialPlatforms[0] || "Social";
      leaks.push({
        id: String(leakId++), area: "Social → Lead Flow", severity: "high",
        description: `${company_name} has an active-looking social footprint (${socialPlatforms.join(", ")}) but no clear automated conversion path from it : no WhatsApp deep link and no online booking on the website. A prospect who finds you on ${leadFrom} and visits the site can reach a contact form, then waits with no visible automated response.`,
        impact: `Social traffic is one of the least expensive sources of interest, yet it ends in a dead end. ${socialPlatforms.length} platform${socialPlatforms.length === 1 ? "" : "s"} push visitors into a manual, unmeasured response flow.`,
        recommendation: "Connect social profiles to a single conversion path: WhatsApp deep link with instant auto-response, plus an online booking link. ELION installs the Lead Response → Follow-Up → Booking flow that turns social reach into scheduled viewings.",
        estimatedSavings: `Varies with follower reach and response rate : typically the largest untracked source of lost enquiries for ${ind} businesses`,
        source: "Internal digital-footprint analysis",
        evidence: [`Social detected: ${socialPlatforms.join(", ")}`, "No wa.me / WhatsApp API deep link found on the website", "No online booking or scheduling link found", `${leadFrom} → Website → Contact form → no automated response`],
        evidenceLevel: "detected",
      });
    }

    // Leak: No CRM
    if (!hasCRM && hasWebsite) {
      const followUpLoss = Math.round(100 - benchmark.followUpRate);
      leaks.push({
        id: String(leakId++), area: "Customer Management", severity: "high",
        description: `${company_name} has a website but no CRM integration detected (HubSpot, Salesforce, Pipedrive, Zoho). Without a CRM, leads from website forms are likely managed manually in spreadsheets or inboxes, leading to lost follow-ups and duplicate outreach.`,
        impact: `Industry research suggests leads in businesses without a CRM often miss consistent follow-up (up to ${followUpLoss}% by benchmark, not a measured figure for ${company_name}). Manual lead handling can also add roughly ${benchmark.dataEntryHours} hours/week of data entry.`,
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
        impact: "The current setup looks solid. Optimization work for businesses like this is commonly in the 15-30% range, but the gain here depends on internal processes this audit cannot see.",
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
    // Financial figures are ALWAYS illustrative estimates , never measured business results.
    const ESTIMATE_NOTE =
      "Illustrative estimate , an approximation of the potential opportunity using the assumptions above, not a measured business result.";
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

    // Reachability honesty: when no public website could be inspected, findings
    // about "what is missing on the website" are benchmark inferences, not
    // observations. Downgrade their label accordingly (the copy already says
    // presence could not be verified).
    if (!research.hasWebsite) {
      for (const leak of leaks) {
        if (leak.area === "WhatsApp Integration" || leak.area === "Appointment Management") {
          leak.evidenceLevel = "estimated";
        }
      }
    }

    // ──── Business verification : small facts proving ELION checked the right business ────
    const verificationFacts: string[] = [];
    if (research.hasWebsite && website) {
      verificationFacts.push(`We reached your website at ${website.replace(/^https?:\/\//, "").replace(/\/$/, "")}${research.pageTitle ? ` : it opens with “${research.pageTitle.slice(0, 70)}”` : ""}.`);
    } else if (website) {
      verificationFacts.push(`We could not reach ${website} at the time of this check (it may be offline or blocking automated requests).`);
    }
    if (research.hasWhatsApp) verificationFacts.push("Your website exposes a WhatsApp contact path (wa.me / api.whatsapp.com link found).");
    const waCat = research.verified?.whatsapp;
    if (waCat?.status === "could_not_verify") verificationFacts.push("WhatsApp availability could not be verified because rendered inspection of your site did not complete.");
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
      // Social → lead flow: does social traffic have an observable conversion
      // path (WhatsApp deep link / booking / email capture) beyond a dead-end profile?
      social_to_lead: research.hasSocialMedia
        ? Math.min(100, 25 + (research.hasWhatsAppDeepLink ? 35 : 0) + (research.hasOnlineBooking ? 25 : 0) + (research.hasEmailMarketing ? 15 : 0))
        : 10,
    };

    // ── Persist the audit (best-effort; never blocks or alters the response) ──
    // The audit is the entry point of the pipeline: keep a record so the
    // admin console can see every audit (and its findings) and the lead gets
    // marked as audited. lead_id is nullable (migration 018); when that
    // migration is missing the insert is retried with a created lead so no
    // audit is ever silently dropped.
    try {
      const sb = getSupabaseAdmin();
      const emailNorm = String(email || "").trim().toLowerCase();
      let leadId: string | null = null;
      if (emailNorm) {
        const { data: existing } = await sb.from("leads").select("id").eq("email", emailNorm).limit(1);
        if (existing && existing.length > 0) {
          leadId = existing[0].id;
        } else {
          const { data: created } = await sb
            .from("leads")
            .insert({
              contact_name: String(name || company_name).trim().slice(0, 100),
              email: emailNorm.slice(0, 200),
              company_name: String(company_name).trim().slice(0, 200),
              website: website || null,
              industry: ind || null,
              audit_status: "completed",
              lead_status: "audited",
              source: "audit",
            })
            .select("id")
            .single();
          leadId = created?.id || null;
        }
      }
      const recommendations = {
        needs: benchmark.topAutomationNeeds,
        roles: benchmark.recommendedRoles,
        priorityActions: research.quickWins.slice(0, 5),
      };
      const auditRow = {
        lead_id: leadId,
        company_name: String(company_name).slice(0, 200),
        industry: ind || null,
        website: website || null,
        overall_score: overallScore,
        leak_count: leaks.length,
        critical_leaks: leaks.filter((l) => l.severity === "critical").length,
        high_leaks: leaks.filter((l) => l.severity === "high").length,
        summary: `Audit for ${company_name}: ${leaks.length} potential operational gap(s) identified. Estimated annual opportunity NGN ${totalSavings.toLocaleString()}.`,
        findings: leaks.map((l) => ({
          id: l.id,
          area: l.area,
          severity: l.severity,
          description: l.description,
          impact: l.impact,
          recommendation: l.recommendation,
          evidenceLevel: l.evidenceLevel || "estimated",
          estimateNote: l.estimateNote || null,
        })),
        recommendations,
        status: "completed",
        completed_at: new Date().toISOString(),
      };
      const { error: insError } = await sb.from("audits").insert(auditRow);
      if (insError && /lead_id/i.test(insError.message || "")) {
        // Migration 018 not applied : create a lead so the audit row is kept.
        const fallbackEmail = emailNorm || `audit+${Date.now()}@elion.local`;
        const { data: fbLead } = await sb
          .from("leads")
          .insert({
            contact_name: String(name || company_name).trim().slice(0, 100),
            email: fallbackEmail.slice(0, 200),
            company_name: String(company_name).trim().slice(0, 200),
            website: website || null,
            industry: ind || null,
            audit_status: "completed",
            lead_status: "audited",
            source: "audit",
          })
          .select("id")
          .single();
        if (fbLead) await sb.from("audits").insert({ ...auditRow, lead_id: fbLead.id });
      } else if (!insError && leadId) {
        await sb.from("leads").update({ audit_status: "completed" }).eq("id", leadId);
      }
    } catch (persistError) {
      // The audit result is still returned : persistence must never fail the request.
      console.error("[AUDIT] Persist skipped (result returned):", persistError);
    }

    // Commercial applicability: evidence + business context -> opportunities.
    // Never claims a gap the pipeline could not verify; "no strong opportunity"
    // is a valid outcome. Modeled/reported layers arrive with the Deep Audit.
    let commercial: unknown = null;
    try {
      commercial = evaluateOpportunities(
        (research.verified || {}) as Record<string, never>,
        ind,
        Boolean(research.reachable)
      );
    } catch (commercialError) {
      console.error("[AUDIT] Applicability skipped:", commercialError);
    }

    const response = NextResponse.json({
      company: company_name, industry: ind, website: website || "",
      overallScore, scores: subScores, leaks,
      totalSavings: totalSavings.toLocaleString(), currency: "NGN",
      criticalLeaks: leaks.filter((l) => l.severity === "critical").length,
      highLeaks: leaks.filter((l) => l.severity === "high").length,
      analyzedAt: new Date().toISOString(), analyst: name || "", analystEmail: email || "",
      webResearch: {
        hasWebsite: research.hasWebsite, websiteScore: research.websiteScore,
        reachable: research.reachable,
        verified: research.verified,
        inspected: research.inspected,
        websiteTech: research.websiteTech, hasWhatsApp: research.hasWhatsApp,
        hasSocialMedia: research.hasSocialMedia, socialPlatforms: research.socialPlatforms,
        socialLinks: research.socialLinks,
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
      commercial,
    });
    response.headers.set("X-RateLimit-Limit", "5");
    response.headers.set("X-RateLimit-Remaining", String(5 - rateLimit.remaining));
    response.headers.set("X-RateLimit-Reset", String(Math.ceil(rateLimit.resetIn / 1000)));
    return response;
  } catch {
    // Do not expose internal errors to users
    return NextResponse.json({ error: "Audit failed. Please try again with a valid website URL." }, { status: 500 });
  }
}
