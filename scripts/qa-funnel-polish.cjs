// QA: Funnel polish checklist on production (https://elion.com.ng/funnel).
// Verifies: hero communicates problem+outcome, "Results in minutes" copy,
// inline audit runs and shows real findings, pricing consistency + Growth
// recommendation, Opay payment block, every CTA has a destination, no dead
// anchor links, no fabricated testimonials/logos/results, mobile layout
// (no horizontal overflow) at 375/430, and console errors.
// Usage: node scripts/qa-funnel-polish.cjs
const path = require("path");
const puppeteer = require(path.join(__dirname, "..", "node_modules", "puppeteer-core"));
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = "https://elion.com.ng/funnel";

let pass = 0, fail = 0;
const check = (name, ok, extra) => {
  if (ok) pass++; else fail++;
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${extra ? " :: " + extra : ""}`);
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: "new",
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
    defaultViewport: { width: 1440, height: 1000 },
  });

  try {
    const page = await browser.newPage();
    const consoleErrors = [];
    page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text()); });
    page.on("pageerror", (e) => consoleErrors.push(String(e)));

    // ---- Desktop load ----
    await page.goto(BASE, { waitUntil: "networkidle2", timeout: 90000 });
    await sleep(2000);
    const text = await page.evaluate(() => document.body.innerText);

    // 1. Hero
    check("hero headline (find the leaks / automate)", /find the leaks/i.test(text) && /automate/i.test(text), text.slice(0, 80).replace(/\n/g, " "));
    check("hero says 'Results in minutes'", /results in minutes/i.test(text), "");
    check("hero explains outcome (leaks, revenue, leads)", /leak|lead|revenue|booking/i.test(text), "");

    // 2. No fake proof
    const fakeProof = /trusted by \d+|100\+ businesses|clients? love|testimonial|"we (helped|serve|work with) \d+/i.test(text);
    const clientCount = (text.match(/trusted by|verified client|happy customer/i) || []).length;
    check("no fabricated testimonials/clients/metrics", !fakeProof && clientCount === 0, `matches=${clientCount}`);

    // 3. Pricing consistency + Growth recommended
    check("pricing shows Starter ₦100,000", /₦\s?100,000/.test(text), "");
    check("pricing shows Growth ₦350,000", /₦\s?350,000/.test(text), "");
    check("pricing shows Scale ₦750,000", /₦\s?750,000/.test(text), "");
    check("Growth is recommended", /most (businesses|clients) start with growth/i.test(text), "");
    check("pricing separates one-time vs optional support", /one-time implementation fee/i.test(text) && /optional ongoing support/i.test(text), "");

    // 4. Payment flow
    check("Opay payment block present", /Opay/i.test(text) && /9126281855/.test(text), "");
    check("payment is clearly manual + no fake verification", /manual payment is currently available/i.test(text) && !/payment verified automatically/i.test(text), "");
    check("does NOT invent account name", !/account name\s*:\s*[A-Z]/i.test(text), "");

    // 5. Audit form exists and inline results work is tested via interaction below
    const hasForm = await page.evaluate(() => !!document.querySelector('#audit input, #audit button'));
    check("inline audit form present", hasForm, "");

    // ---- Interactive: run the funnel audit inline ----
    try {
      await page.click('#audit button, #audit [role=button]').catch(() => {});
      // Step-driven: answer each question by clicking the first option button
      for (let i = 0; i < 5; i++) {
        await sleep(600);
        const option = await page.evaluate(() => {
          const sec = document.querySelector("#audit");
          if (!sec) return null;
          const btns = Array.from(sec.querySelectorAll("button"));
          const opt = btns.find((b) => b.innerText && b.innerText.trim().length > 1 && !/back|continue/i.test(b.innerText) && !/analyze/i.test(b.innerText));
          if (opt) { opt.click(); return "clicked"; }
          // Next step button
          const cont = btns.find((b) => /continue/i.test(b.innerText));
          if (cont) { cont.click(); return "continue"; }
          return null;
        });
        if (!option) break;
        await sleep(400);
      }
      // Fill contact step with real keystrokes (React state needs real input)
      await sleep(800);
      await page.type('#audit input[type="text"]', "QA Funnel Tester", { delay: 15 }).catch(() => {});
      await page.type('#audit input[type="email"]', "qa-funnel-" + Date.now() + "@example.com", { delay: 15 }).catch(() => {});
      await sleep(400);
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll("#audit button"));
        const sub = btns.find((b) => /analyze my business/i.test(b.innerText));
        if (sub) sub.click();
      });
      await page.waitForFunction(() => document.body.innerText.includes("Your audit is ready"), { timeout: 60000 }).catch(() => {});
      await sleep(1500);
      const resText = await page.evaluate(() => document.body.innerText);
      check("inline audit shows real results", /your audit is ready/i.test(resText), "");
      check("audit results show score/gaps (diagnostic)", /automation score|critical|high priority/i.test(resText) && /leak|gap|priority/i.test(resText), "");
      check("audit results have evidence note (not a demo)", /evidence/i.test(resText), "");
    } catch (e) {
      check("inline audit interaction completed", false, String(e).slice(0, 120));
    }

    // ---- CTA destinations ----
    const links = await page.evaluate(() =>
      Array.from(document.querySelectorAll("a[href]")).map((a) => ({ href: a.getAttribute("href"), text: (a.innerText || "").trim() }))
    );
    const ctaHrefs = links.filter((l) => /audit|demo|pricing|get started|see elion|fix these/i.test(l.text)).map((l) => l.href);
    check("every visible CTA has an in-page/destination href", ctaHrefs.every((h) => /^(#|https?:\/\/|\/)/.test(h || "")), JSON.stringify(ctaHrefs.slice(0, 6)));

    // Check anchor targets exist
    const anchors = ["#audit", "#demo", "#pricing", "#faq", "#how-it-works", "#systems"];
    for (const a of anchors) {
      const exists = await page.evaluate((sel) => !!document.querySelector(sel), a).catch(() => false);
      check(`anchor ${a} target exists`, exists, "");
    }

    // Check external/page links are not dead (HEAD)
    const pageLinks = links.filter((l) => l.href && l.href.startsWith("http") && !l.href.includes("accounts.google")).map((l) => l.href);
    const unique = [...new Set(pageLinks)].slice(0, 12);
    for (const u of unique) {
      const st = await fetch(u, { method: "HEAD", redirect: "follow" }).then((r) => r.status).catch(() => 0);
      check(`link ${u.replace(BASE.replace("/funnel",""), "")} resolves`, st >= 200 && st < 400, String(st));
    }

    // ---- Mobile checks ----
    for (const w of [375, 430]) {
      const m = await browser.newPage();
      await m.setViewport({ width: w, height: 800 });
      const errs = [];
      m.on("console", (c) => { if (c.type() === "error") errs.push(c.text()); });
      await m.goto(BASE, { waitUntil: "networkidle2", timeout: 90000 });
      await sleep(1500);
      const overflow = await m.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      check(`mobile ${w}px no horizontal overflow`, overflow <= 1, `overflow=${overflow}px`);
      const stickyCta = await m.evaluate(() => {
        const els = Array.from(document.querySelectorAll("a")).filter((a) => /run free audit/i.test(a.innerText));
        return els.length > 0;
      });
      check(`mobile ${w}px CTA accessible`, stickyCta, "");
      if (errs.length) check(`mobile ${w}px no console errors`, false, errs[0].slice(0, 100));
      else check(`mobile ${w}px no console errors`, true, "");
      await m.close();
    }

    // Desktop console errors
    if (consoleErrors.length) check("desktop no console errors", false, consoleErrors[0].slice(0, 120));
    else check("desktop no console errors", true, "");

  } catch (e) {
    check("page loaded without throw", false, String(e).slice(0, 200));
  } finally {
    await browser.close().catch(() => {});
  }
  console.log(`\n== RESULT: ${pass} pass, ${fail} fail ==`);
  process.exit(fail ? 1 : 0);
})();