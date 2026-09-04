// QA: footer link integrity, /docs center, legal pages (route + mobile + console).
// Usage: node scripts/qa-docs-legal.cjs
const path = require("path");
const puppeteer = require(path.join(__dirname, "..", "node_modules", "puppeteer-core"));
const BASE = "https://elion.com.ng";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";

let pass = 0, fail = 0;
const check = (name, ok, extra) => {
  if (ok) pass++; else fail++;
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${extra ? " :: " + extra : ""}`);
};

const INTERNAL_PATHS = [
  "/", "/audit", "/demo", "/docs", "/landing/book", "/landing/pricing",
  "/landing/about", "/landing/support", "/login", "/status", "/privacy",
  "/terms", "/cookie-policy", "/acceptable-use", "/third-party-services",
  "/docs/getting-started/what-is-elion",
  "/docs/getting-started/how-elion-works",
  "/docs/getting-started/running-your-free-audit",
  "/docs/client-guide/client-onboarding",
  "/docs/client-guide/connecting-google-calendar",
  "/docs/client-guide/ai-receptionist",
  "/docs/client-guide/ai-sales-agent",
  "/docs/automations/lead-response",
  "/docs/automations/follow-up",
  "/docs/automations/booking-automation",
  "/docs/automations/revenue-recovery",
  "/docs/billing/understanding-pricing",
  "/docs/security/data-and-security",
  "/docs/troubleshooting/calendar-not-connected",
  "/docs/troubleshooting/automation-pending",
  "/docs/troubleshooting/agent-cannot-activate",
  "/docs/troubleshooting/booking-unavailable",
];

async function httpHead(p) {
  try {
    const r = await fetch(`${BASE}${p}`, { redirect: "manual" });
    return { status: r.status, location: r.headers.get("location") || "" };
  } catch (e) {
    return { status: 0, location: String(e) };
  }
}

async function routeChecks() {
  console.log("--- HTTP route checks ---");
  for (const p of INTERNAL_PATHS) {
    const { status } = await httpHead(p);
    check(`GET ${p} -> 200`, status === 200, `status ${status}`);
  }
  const home = await httpHead("/home");
  check("/home redirects to /", home.status === 307 || home.status === 308, `status ${home.status}`);
  // Every footer link target resolves (scrape footer of a page that renders it)
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox"] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  await page.goto(`${BASE}/audit`, { waitUntil: "networkidle2", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 1200));
  const footerLinks = await page.evaluate(() => {
    const footer = document.querySelector("footer");
    if (!footer) return [];
    return Array.from(footer.querySelectorAll("a[href]")).map((a) => a.getAttribute("href"));
  });
  check("footer present on /audit", footerLinks.length > 10, `${footerLinks.length} links`);
  const unique = [...new Set(footerLinks)].filter((h) => h && h.startsWith("/") && !h.startsWith("//") && !h.includes("#") && h !== "/login");
  for (const href of unique) {
    const { status } = await httpHead(href);
    check(`footer link ${href} resolves`, status === 200, `status ${status}`);
  }
  await browser.close();
}

async function browserRun(url, { width, height, expect, label, visibleSelectors = [] }) {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox"] });
  const page = await browser.newPage();
  await page.setViewport({ width, height });
  const errs = [];
  page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
  page.on("pageerror", (e) => errs.push(String(e)));
  try {
    await page.goto(`${BASE}${url}`, { waitUntil: "networkidle2", timeout: 60000 });
    await new Promise((r) => setTimeout(r, 1500));
    const text = await page.evaluate(() => document.body.textContent || "");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    const hasFooter = await page.evaluate(() => Boolean(document.querySelector("footer")));
    for (const ex of expect) {
      check(`${label} (${width}px): "${ex}"`, text.includes(ex));
    }
    for (const sel of visibleSelectors) {
      const visible = await page.evaluate((s) => {
        const el = document.querySelector(s);
        if (!el) return false;
        const cs = window.getComputedStyle(el);
        return cs.display !== "none" && cs.visibility !== "hidden" && el.getClientRects().length > 0;
      }, sel);
      check(`${label} (${width}px): visible ${sel}`, visible);
    }
    check(`${label} (${width}px): no horizontal overflow`, !overflow);
    check(`${label} (${width}px): public footer rendered`, hasFooter);
    const realErrs = errs.filter((e) => !/favicon/i.test(e) && !/net::ERR_ABORTED/i.test(e));
    check(`${label} (${width}px): no console errors`, realErrs.length === 0, realErrs.slice(0, 2).join(" | ") || "none");
  } finally {
    await browser.close();
  }
}

async function main() {
  await routeChecks();

  console.log("--- Browser checks ---");
  // Docs home
  await browserRun("/docs", { width: 390, height: 844, expect: ["ELION Documentation", "Getting Started", "Free Business Audit"] , label: "docs home" });
  await browserRun("/docs", { width: 768, height: 1024, expect: ["ELION Documentation"] , label: "docs home" });
  // Article (sidebar hidden under lg, chips under lg, TOC only on xl)
  await browserRun("/docs/getting-started/how-elion-works", { width: 320, height: 800, expect: ["How ELION Works", "One template, many clients", "External infrastructure"], label: "article 320" });
  await browserRun("/docs/automations/booking-automation", { width: 375, height: 812, expect: ["Booking Automation", "Double-booking protection"], label: "article 375" });
  await browserRun("/docs/client-guide/ai-receptionist", { width: 430, height: 932, expect: ["AI Receptionist"], label: "article 430" });
  await browserRun("/docs/billing/understanding-pricing", { width: 1440, height: 900, expect: ["Understanding ELION Pricing"], visibleSelectors: ["nav[aria-label=\"On this page\"]"], label: "article desktop" });
  await browserRun("/docs/automations/lead-response", { width: 390, height: 844, expect: ["Lead Response"], visibleSelectors: ["nav[aria-label=\"Documentation sections\"]"], label: "article mobile chips" });
  // Category
  await browserRun("/docs/troubleshooting", { width: 390, height: 844, expect: ["Troubleshooting", "Calendar Not Connected"], label: "category" });
  // Legal pages
  await browserRun("/terms", { width: 390, height: 844, expect: ["Terms of Service", "Acceptance of Terms", "Contents"], label: "terms" });
  await browserRun("/privacy", { width: 768, height: 1024, expect: ["Privacy Policy", "Cookies"], label: "privacy" });
  await browserRun("/cookie-policy", { width: 375, height: 812, expect: ["Cookie Policy", "Controlling cookies"], label: "cookie" });
  await browserRun("/acceptable-use", { width: 390, height: 844, expect: ["Acceptable Use Policy"], label: "acceptable-use" });
  await browserRun("/third-party-services", { width: 390, height: 844, expect: ["Third-Party Services", "Pending review"], label: "third-party" });

  console.log(`\n=== RESULT: ${fail === 0 ? "ALL PASS" : fail + " FAILED"} (${pass} passed, ${fail} failed) ===`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => { console.error("FATAL:", e); process.exit(1); });
