// Adversarial QA battery for the prospect demo surface (production).
// 1) Internal-link crawl (status + anchor existence per page)
// 2) Console + failed-request capture across surfaces
// 3) Live audit runs on real websites + copy credibility scan
// 4) Funnel journey + QA-lead creation (email marked qa-...; cleaned by caller)
// 5) /landing/book graceful state, /login load, audit XSS-as-text check
// 6) Tablet + mobile overflow checks
// Usage: node scripts/qa-adversarial.cjs
const path = require("path");
const puppeteer = require(path.join(__dirname, "..", "node_modules", "puppeteer-core"));
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = "https://elion.com.ng";

let pass = 0, fail = 0, info = 0;
const check = (name, ok, extra) => {
  if (ok) pass++; else fail++;
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${extra ? " :: " + extra : ""}`);
};
const note = (name, extra) => { info++; console.log(`NOTE  ${name} :: ${extra}`); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const PAGES = ["/", "/funnel", "/audit", "/demo", "/landing/pricing", "/landing/support", "/landing/about", "/landing/book", "/login", "/docs", "/status", "/privacy", "/terms"];

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: "new",
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1000 });
  const consoleErrors = [];
  const failedReqs = [];
  page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text().slice(0, 300)); });
  page.on("pageerror", (e) => consoleErrors.push("pageerror: " + String(e).slice(0, 300)));
  page.on("requestfailed", (r) => failedReqs.push(r.url().slice(0, 160) + " :: " + (r.failure()?.errorText || "")));
  page.on("response", (r) => { if (r.status() >= 400) failedReqs.push(r.status() + " " + r.url().slice(0, 160)); });

  // ---------- 1) Internal link crawl ----------
  const seen = new Set();
  for (const route of PAGES) {
    try {
      await page.goto(BASE + route, { waitUntil: "networkidle2", timeout: 60000 });
      await sleep(600);
    } catch (e) { check(`load ${route}`, false, e.message.slice(0, 120)); continue; }
    const links = await page.evaluate(() =>
      [...document.querySelectorAll("a[href]")]
        .map((a) => ({ href: a.getAttribute("href"), text: (a.textContent || "").trim().slice(0, 40) }))
        .filter((l) => l.href && !l.href.startsWith("mailto:") && !l.href.startsWith("tel:") && !l.href.startsWith("http") && !l.href.startsWith("//"))
    );
    // anchors on-page
    const anchors = links.filter((l) => l.href.startsWith("#"));
    for (const l of anchors) {
      const okEl = await page.evaluate((h) => { const id = h.slice(1); return id ? !!document.getElementById(id) : false; }, l.href);
      check(`anchor ${route} -> ${l.href} (${l.text})`, okEl);
    }
    // internal path links (fetch status, dedupe)
    const paths = links.filter((l) => l.href.startsWith("/")).map((l) => l.href);
    const uniq = [...new Set(paths)].filter((p) => !seen.has(p));
    for (const p of uniq) { seen.add(p); }
    for (const p of uniq.slice(0, 12)) {
      const st = await page.evaluate(async (p2) => {
        try { const r = await fetch(p2, { redirect: "manual" }); return r.status; }
        catch { return "ERR"; }
      }, p);
      if (st === "ERR") check(`internal ${route} -> ${p} fetch`, false);
      else if (st >= 400) check(`internal ${route} -> ${p}`, st < 400, String(st));
      else if (st >= 300) note(`redirect ${route} -> ${p}`, st);
      else check(`internal ${route} -> ${p}`, true, "");
    }
  }

  // ---------- 2) Live audits (real sites) ----------
  const auditOne = async (label, company, website, industry) => {
    const res = await page.evaluate(async ({ company, website, industry }) => {
      const r = await fetch("/api/audit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ company_name: company, website, industry }) });
      const j = await r.json().catch(() => null);
      return { status: r.status, score: j && j.overallScore, leaks: (j && j.leaks || []).map((l) => l.area), crit: j && j.criticalLeaks, facts: (j && j.businessVerification && j.businessVerification.facts || []).slice(0, 2), error: j && j.error };
    }, { company, website, industry });
    check(`audit ${label} (${res.status})`, res.status === 200 && res.score !== undefined, `score=${res.score} leaks=[${(res.leaks || []).join(", ")}] crit=${res.crit} err=${res.error || ""}`);
    return res;
  };
  await auditOne("real estate site example.com", "QA Adversarial Realty", "https://example.com", "Real Estate");
  await auditOne("hospitality site", "QA Adversarial Bistro", "https://example.com", "Hospitality");
  await auditOne("bad site (unreachable)", "QA Adversarial Broken", "https://elion.com.ng/definitely-not-a-page-404", "General");

  // Copy credibility scan on the audit page after a real run
  await page.goto(BASE + "/audit", { waitUntil: "networkidle2", timeout: 90000 });
  await sleep(800);
  const filled = await page.evaluate(() => {
    const set = (el, v) => { const d = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), "value"); d && d.set ? d.set.call(el, v) : (el.value = v); el.dispatchEvent(new Event("input", { bubbles: true })); };
    const inputs = [...document.querySelectorAll("input")];
    const c = inputs.find((i) => /lagos real estate agency/i.test(i.placeholder || ""));
    if (!c) return false;
    set(c, "QA Adversarial Page Run");
    const w = inputs.find((i) => /website/i.test(i.placeholder || ""));
    if (w) set(w, "https://example.com");
    [...document.querySelectorAll("button")].find((b) => /run free audit/i.test(b.textContent))?.click();
    return true;
  });
  check("audit page: form filled + started", filled);
  let panel = false;
  for (let i = 0; i < 60; i++) { panel = await page.evaluate(() => !!document.getElementById("results")); if (panel) break; await sleep(500); }
  check("audit page: results render", panel);
  if (panel) {
    await sleep(400);
    const body = await page.evaluate(() => document.body.innerText);
    // credibility scan for fabrication-style phrasing
    const absolute = /(cannot reach you|every potential customer|1 in \d+ appointments is wasted|% of leads do not receive)/i.test(body);
    note("audit page copy scan (absolute claims present?)", absolute ? "FOUND absolute/measured-sounding claims (prod copy predates local honesty pass)" : "clean");
    check("audit page: evidence labels present", /OBSERVED|Observed|Verified|Source:|Recommended/i.test(body));
    check("audit page: illustrative/estimate disclaimer", /illustrative|estimate/i.test(body));
  }

  // XSS-as-text: company name with markup should render as text, never execute
  await page.goto(BASE + "/audit", { waitUntil: "networkidle2", timeout: 90000 });
  await sleep(600);
  const xss = await page.evaluate(() => {
    const set = (el, v) => { const d = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), "value"); d && d.set ? d.set.call(el, v) : (el.value = v); el.dispatchEvent(new Event("input", { bubbles: true })); };
    const c = [...document.querySelectorAll("input")].find((i) => /lagos real estate agency/i.test(i.placeholder || ""));
    if (!c) return "no-input";
    set(c, '<img src=x onerror=window.__pwned=1> QAXSS');
    [...document.querySelectorAll("button")].find((b) => /run free audit/i.test(b.textContent))?.click();
    return "sent";
  });
  check("audit XSS attempt sent", xss === "sent");
  let pwned = false, rendered = false;
  for (let i = 0; i < 60; i++) {
    pwned = await page.evaluate(() => window.__pwned === 1);
    rendered = await page.evaluate(() => document.body.innerText.includes("QAXSS"));
    if (pwned || rendered) break;
    await sleep(500);
  }
  check("audit XSS: no script execution", !pwned, pwned ? "EXECUTED" : "");
  check("audit XSS: input rendered as text", rendered);

  // ---------- 3) Funnel journey with QA identity ----------
  await page.goto(BASE + "/funnel", { waitUntil: "networkidle2", timeout: 90000 });
  await sleep(800);
  const funnelStep = await page.evaluate((n) => {
    const btns = [...document.querySelectorAll("button")].filter((b) => b.offsetParent !== null);
    const pick = (label) => btns.find((b) => b.textContent.trim() === label);
    const b = pick(n); if (!b) return "missing:" + n; b.click(); return "ok";
  }, "Real Estate");
  check("funnel step1 Real Estate", funnelStep === "ok", funnelStep);
  for (const opt of ["Leads not getting fast enough follow-up", "WhatsApp", "2-3 people", null]) {
    if (opt === null) break;
    await sleep(500);
    const s = await page.evaluate((n) => {
      const btns = [...document.querySelectorAll("button")].filter((b) => b.offsetParent !== null);
      const b = btns.find((x) => x.textContent.trim() === n); if (!b) return "missing";
      b.click(); return "ok";
    }, opt);
    check(`funnel option ${opt.slice(0, 24)}`, s === "ok", s);
  }
  // now on website step
  await sleep(500);
  const webStep = await page.evaluate(() => {
    const set = (el, v) => { const d = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), "value"); d && d.set ? d.set.call(el, v) : (el.value = v); el.dispatchEvent(new Event("input", { bubbles: true })); };
    const inp = document.querySelector('input[aria-label="Your business website URL"]');
    if (!inp) return "no-input";
    set(inp, "https://example.com");
    [...document.querySelectorAll("button")].find((b) => /continue/i.test(b.textContent))?.click();
    return "ok";
  });
  check("funnel website step", webStep === "ok", webStep);
  await sleep(700);
  const contactStep = await page.evaluate((qaEmail) => {
    const set = (el, v) => { const d = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), "value"); d && d.set ? d.set.call(el, v) : (el.value = v); el.dispatchEvent(new Event("input", { bubbles: true })); };
    const name = document.querySelector('input[placeholder="Your name"]');
    const email = document.querySelector('input[placeholder="Email address"]');
    if (!name || !email) return "no-fields";
    set(name, "QA Adversarial");
    set(email, qaEmail);
    const go = [...document.querySelectorAll("button")].find((b) => /analyze my business/i.test(b.textContent));
    if (!go) return "no-cta";
    go.click(); return "ok";
  }, "qa-adversarial-" + Date.now() + "@elion.local");
  check("funnel contact submit", contactStep === "ok", contactStep);
  let funnelDone = false;
  for (let i = 0; i < 60; i++) {
    funnelDone = await page.evaluate(() => /audit is ready|request received|automation score|digital operations score/i.test(document.body.innerText));
    if (funnelDone) break;
    await sleep(500);
  }
  check("funnel: inline result appears", funnelDone);

  // ---------- 4) /landing/book graceful state ----------
  await page.goto(BASE + "/landing/book", { waitUntil: "networkidle2", timeout: 90000 });
  await sleep(1200);
  const book = await page.evaluate(() => {
    const t = document.body.innerText;
    return { hasForm: /name|email/i.test(t), hasLink: /audit|contact/i.test(t) };
  });
  note("landing/book content", JSON.stringify(book));
  const avail = await page.evaluate(async () => {
    const r = await fetch("/api/bookings/availability?days=14"); const j = await r.json().catch(() => null);
    return { status: r.status, slots: Array.isArray(j && j.slots) ? j.slots.length : null, err: j && j.error, code: j && j.code };
  });
  note("booking availability API", JSON.stringify(avail));

  // ---------- 5) console/error summary ----------
  note("console/page errors collected", JSON.stringify(consoleErrors.slice(0, 5)));
  note("failed requests (4xx+)", JSON.stringify(failedReqs.slice(0, 8)));
  check("no console errors across battery", consoleErrors.length === 0, consoleErrors.slice(0, 2).join(" | "));

  await page.close();

  // ---------- 6) Tablet + mobile ----------
  for (const [label, width, height] of [["tablet768", 768, 1024], ["mobile390", 390, 844]]) {
    for (const route of ["/", "/audit", "/demo", "/landing/pricing", "/landing/book"]) {
      const p2 = await browser.newPage();
      await p2.setViewport({ width, height, isMobile: width < 600, hasTouch: width < 600, deviceScaleFactor: 2 });
      try {
        await p2.goto(BASE + route, { waitUntil: "networkidle2", timeout: 60000 });
        await sleep(500);
        const overflow = await p2.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
        check(`${label} ${route} no horizontal overflow`, !overflow);
      } catch (e) { check(`${label} ${route} loads`, false, e.message.slice(0, 80)); }
      await p2.close();
    }
  }

  await browser.close();
  console.log(`\n==== RESULT ${pass} passed / ${fail} failed / ${info} notes ====`);
  process.exitCode = fail > 0 ? 1 : 0;
})().catch((e) => { console.log("FATAL", e && e.message ? e.message : e); process.exitCode = 1; });
