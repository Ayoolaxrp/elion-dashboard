// QA: post-implementation audit — route matrix, footer/docs links, funnel
// anchors, demo nav, mobile overflow, reduced motion, console errors.
// Usage: node scripts/qa-audit-matrix.cjs
const path = require("path");
const puppeteer = require(path.join(__dirname, "..", "node_modules", "puppeteer-core"));
const BASE = "https://elion.com.ng";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";

let pass = 0, fail = 0;
const check = (name, ok, extra) => {
  if (ok) pass++; else fail++;
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${extra ? " :: " + extra : ""}`);
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const PUBLIC_ROUTES = [
  "/", "/home", "/audit", "/demo", "/funnel", "/status",
  "/landing/pricing", "/landing/about", "/landing/support", "/landing/book",
  "/landing/audit", "/landing/booking", "/landing/followup", "/landing/leads",
  "/landing/operations", "/landing/recovery",
  "/booking", "/followup", "/recovery", "/operations", "/leads",
  "/privacy", "/terms", "/cookie-policy", "/acceptable-use", "/third-party-services",
  "/docs", "/docs/getting-started", "/docs/client-guide", "/docs/automations",
  "/docs/billing", "/docs/security", "/docs/troubleshooting",
  "/docs/getting-started/what-is-elion", "/docs/getting-started/how-elion-works",
  "/docs/getting-started/running-your-free-audit",
  "/docs/automations/lead-response", "/docs/automations/follow-up",
  "/docs/automations/booking-automation", "/docs/automations/revenue-recovery",
  "/docs/client-guide/client-onboarding", "/docs/client-guide/connecting-google-calendar",
  "/docs/client-guide/ai-receptionist", "/docs/client-guide/ai-sales-agent",
  "/docs/billing/understanding-pricing", "/docs/security/data-and-security",
  "/docs/troubleshooting/calendar-not-connected", "/docs/troubleshooting/automation-pending",
  "/docs/troubleshooting/agent-cannot-activate", "/docs/troubleshooting/booking-unavailable",
  "/login", "/recovery",
];

async function routeMatrix() {
  console.log("\n== ROUTE MATRIX (HTTP status) ==");
  for (const r of PUBLIC_ROUTES) {
    const res = await fetch(BASE + r, { redirect: "manual" });
    const ok = res.status === 200 || res.status === 307 || res.status === 308;
    check(`GET ${r} → ${res.status}`, ok, res.status >= 300 ? `redirects to ${res.headers.get("location")}` : "");
  }
}

async function newPage(browser, width, height, reduced = false) {
  const page = await browser.newPage();
  await page.setViewport({ width, height });
  if (reduced) await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  const errs = [];
  page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
  page.on("pageerror", (e) => errs.push(String(e)));
  return { page, errs };
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: "new",
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
    defaultViewport: { width: 1440, height: 1000 },
  });

  try {
    await routeMatrix();

    // ---- FOOTER LINKS on homepage ----
    console.log("\n== FOOTER LINKS (homepage) ==");
    const hp = await newPage(browser, 1440, 1000);
    await hp.page.goto(BASE + "/", { waitUntil: "networkidle2", timeout: 60000 });
    await hp.page.waitForSelector("footer", { timeout: 15000 });
    const footerHrefs = await hp.page.evaluate(() =>
      Array.from(document.querySelectorAll("footer a")).map((a) => a.getAttribute("href")).filter(Boolean)
    );
    const unique = [...new Set(footerHrefs)];
    check("footer has links", unique.length >= 15, `${unique.length} unique links`);
    for (const h of unique) {
      if (h.startsWith("http")) continue;
      const target = h.split("#")[0] || "/";
      const res = await fetch(BASE + target, { redirect: "manual" });
      check(`footer link ${h} → ${res.status}`, res.status === 200 || res.status === 307, "");
    }
    const errsHp = hp.errs.filter((e) => !/favicon|net::ERR_ABORTED/i.test(e));
    check("homepage: no console errors", errsHp.length === 0, errsHp.slice(0, 2).join(" | "));
    await hp.page.close();

    // ---- DOCS PAGES ----
    console.log("\n== DOCS (rendered) ==");
    const dp = await newPage(browser, 1440, 1000);
    await dp.page.goto(BASE + "/docs", { waitUntil: "networkidle2", timeout: 60000 });
    await dp.page.waitForSelector("input[type='search'], input[placeholder*='Search']", { timeout: 15000 }).catch(() => {});
    const docSearch = await dp.page.evaluate(() => !!document.querySelector("input[placeholder*='Search']"));
    check("docs has search", docSearch);
    await dp.page.goto(BASE + "/docs/automations/lead-response", { waitUntil: "networkidle2", timeout: 60000 });
    const docArt = await dp.page.evaluate(() => {
      const t = document.body.innerText;
      return { hasTitle: t.includes("Lead Response"), hasToc: !!document.querySelector("nav a[href^='#']"), len: t.length };
    });
    check("docs article renders", docArt.hasTitle && docArt.len > 500, `len=${docArt.len}`);
    const docErrs = dp.errs.filter((e) => !/favicon|net::ERR_ABORTED/i.test(e));
    check("docs: no console errors", docErrs.length === 0, docErrs.slice(0, 2).join(" | "));
    await dp.page.close();

    // ---- FUNNEL ----
    console.log("\n== FUNNEL ==");
    const fp = await newPage(browser, 1440, 1000);
    await fp.page.goto(BASE + "/funnel", { waitUntil: "networkidle2", timeout: 60000 });
    await sleep(1200);
    const funnel = await fp.page.evaluate(() => {
      const t = document.body.innerText.toUpperCase();
      return {
        hero: t.includes("FIND THE LEAKS") || t.includes("OPERATIONAL LEAK"),
        stages: ["DISCOVER", "DIAGNOSE", "DESIGN", "BUILD", "OPERATE"].every((s) => t.includes(s)),
        anchors: ["#how-it-works", "#findings", "#systems", "#demo", "#pricing", "#faq"].every((a) => !!document.querySelector(a)),
        pricingLocal: t.includes("SETUP") && (t.includes("/MO") || t.includes("₦")),
        overflow: document.documentElement.scrollWidth > window.innerWidth,
      };
    });
    check("funnel hero present", funnel.hero);
    check("funnel 5 stages present", funnel.stages);
    check("funnel anchors exist", funnel.anchors);
    check("funnel has self-contained pricing", funnel.pricingLocal);
    check("funnel no horizontal overflow (1440)", !funnel.overflow);
    // anchor navigation works
    const navWorked = await fp.page.evaluate(async () => {
      const a = document.querySelector("a[href='#pricing']");
      if (!a) return false;
      a.click();
      await new Promise((r) => setTimeout(r, 800));
      const el = document.querySelector("#pricing");
      if (!el) return false;
      const r = el.getBoundingClientRect();
      return r.top >= 0 && r.top < window.innerHeight;
    });
    check("funnel anchor scrolls to #pricing", navWorked === true);
    // demo CTA stays in funnel
    const demoCta = await fp.page.evaluate(() => {
      const links = Array.from(document.querySelectorAll("a[href]"));
      const demoLinks = links.filter((a) => (a.getAttribute("href") || "").toLowerCase().includes("demo"));
      return demoLinks.map((a) => a.getAttribute("href"));
    });
    check("funnel demo CTAs are local anchors", demoCta.every((h) => h === "#demo"), JSON.stringify(demoCta));
    const funnelErrs = fp.errs.filter((e) => !/favicon|net::ERR_ABORTED/i.test(e));
    check("funnel: no console errors", funnelErrs.length === 0, funnelErrs.slice(0, 2).join(" | "));
    await fp.page.close();

    // ---- DEMO ----
    console.log("\n== DEMO ==");
    const demop = await newPage(browser, 1440, 1000);
    await demop.page.goto(BASE + "/demo", { waitUntil: "networkidle2", timeout: 60000 });
    await sleep(800);
    const demo = await demop.page.evaluate(() => {
      const hdr = document.querySelector("header");
      const links = hdr ? Array.from(hdr.querySelectorAll("a")).map((a) => a.getAttribute("href")) : [];
      const t = document.body.innerText;
      return { links, hasSim: t.includes("Interactive Demo") || t.includes("Simulated"), self: links.filter((h) => h === "/demo") };
    });
    check("demo header has links", demo.links.length >= 4, JSON.stringify(demo.links));
    check("demo header has no self-links", demo.self.length === 0);
    check("demo page renders simulation", demo.hasSim);
    const demoErrs = demop.errs.filter((e) => !/favicon|net::ERR_ABORTED/i.test(e));
    check("demo: no console errors", demoErrs.length === 0, demoErrs.slice(0, 2).join(" | "));
    await demop.page.close();

    // ---- MOBILE OVERFLOW MATRIX ----
    console.log("\n== MOBILE OVERFLOW ==");
    const MOBILE = [320, 375, 390, 430, 768];
    for (const w of MOBILE) {
      for (const r of ["/", "/funnel", "/demo", "/audit", "/landing/pricing"]) {
        const mp = await newPage(browser, w, 844);
        await mp.page.goto(BASE + r, { waitUntil: "networkidle2", timeout: 60000 });
        await sleep(400);
        const o = await mp.page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
        check(`no overflow ${r} @${w}`, !o, o ? `scrollW=${document.documentElement.scrollWidth}` : "");
        await mp.page.close();
      }
    }

    // ---- REDUCED MOTION ----
    console.log("\n== REDUCED MOTION ==");
    for (const r of ["/", "/funnel"]) {
      const rp = await newPage(browser, 390, 844, true);
      await rp.page.goto(BASE + r, { waitUntil: "networkidle2", timeout: 60000 });
      await sleep(600);
      const rl = await rp.page.evaluate(() => {
        const t = document.body.innerText;
        const overflow = document.documentElement.scrollWidth > window.innerWidth + 1;
        return { len: t.length, overflow, hasCta: t.includes("Run") || t.includes("Audit") };
      });
      check(`reduced-motion ${r}: content visible + no overflow`, rl.len > 500 && !rl.overflow && rl.hasCta, JSON.stringify({ len: rl.len, overflow: rl.overflow }));
      const rerrs = rp.errs.filter((e) => !/favicon|net::ERR_ABORTED|Hydration/i.test(e));
      check(`reduced-motion ${r}: no console errors`, rerrs.length === 0, rerrs.slice(0, 2).join(" | "));
      await rp.page.close();
    }
  } catch (e) {
    console.error("QA ERROR:", e);
    fail++;
  } finally {
    await browser.close();
  }
  console.log(`\n== RESULT: ${pass} pass, ${fail} fail ==`);
  process.exit(fail ? 1 : 0);
})();