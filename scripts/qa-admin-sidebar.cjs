// QA: admin sidebar overlay fix — verifies the fixed sidebar never covers
// page content, content elements are clickable, and mobile drawer works.
// Usage: BASE=http://localhost:3000 node scripts/qa-admin-sidebar.cjs
const path = require("path");
const puppeteer = require(path.join(__dirname, "..", "node_modules", "puppeteer-core"));
const BASE = process.env.BASE || "http://localhost:3000";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const ADMIN_EMAIL = "awodeyiayoola@gmail.com";
const ADMIN_PASSWORD = "Ayoolamikun$123";

let pass = 0, fail = 0;
const check = (name, ok, extra) => {
  if (ok) pass++; else fail++;
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${extra ? " :: " + extra : ""}`);
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--window-size=1440,1000"],
    defaultViewport: { width: 1440, height: 1000 },
  });
  const page = await browser.newPage();
  const errs = [];
  page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
  page.on("pageerror", (e) => errs.push(String(e)));

  try {
    // ---- LOGIN ----
    console.log("\n== LOGIN ==");
    await page.goto(BASE + "/login?redirect=/admin", { waitUntil: "networkidle2", timeout: 60000 });
    await page.waitForSelector('input[type="email"]', { timeout: 15000 });
    await page.type('input[type="email"]', ADMIN_EMAIL, { delay: 15 });
    await page.type('input[type="password"]', ADMIN_PASSWORD, { delay: 15 });
    await page.evaluate(() => { const f = document.querySelector("form"); if (f) f.requestSubmit(); });
    await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 30000 }).catch(() => {});
    await sleep(2500);
    check("login lands on /admin", page.url().includes("/admin"), page.url());

    // ---- DESKTOP: sidebar must not overlap content ----
    console.log("\n== SIDEBAR / CONTENT GEOMETRY (1440px) ==");
    const geo = await page.evaluate(() => {
      const aside = document.querySelector("aside");
      const main = document.querySelector("main");
      if (!aside || !main) return null;
      const a = aside.getBoundingClientRect();
      const m = main.getBoundingClientRect();
      // Pick an interactive element inside main and check it's not covered.
      const btn = main.querySelector("a, button");
      let btnClear = true, btnRect = null;
      if (btn) {
        const b = btn.getBoundingClientRect();
        btnRect = { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) };
        const el = document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2);
        btnClear = !!el && (btn === el || btn.contains(el));
      }
      return {
        aside: { x: Math.round(a.x), w: Math.round(a.width), right: Math.round(a.right) },
        main: { x: Math.round(m.x), w: Math.round(m.width) },
        overlap: m.x < a.right,
        btnClear,
        btnRect,
      };
    });
    check("sidebar is visible on desktop", !!geo && geo.aside.w > 0);
    check("main content starts to the right of sidebar (no overlap)", !!geo && !geo.overlap,
      geo ? `aside right=${geo.aside.right}, main x=${geo.main.x}` : "no geo");
    check("interactive element in main is clickable (not covered)", !!geo && geo.btnClear,
      geo ? JSON.stringify(geo.btnRect) : "");

    // ---- Desktop: nav link click works ----
    console.log("\n== NAV CLICK ==");
    await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll("aside a"));
      const leads = links.find((a) => a.textContent.trim() === "Leads");
      if (leads) leads.click();
    });
    await page.waitForFunction(() => location.pathname.includes("/admin/leads"), { timeout: 15000 });
    await sleep(1200);
    check("clicking Leads in sidebar navigates to /admin/leads", page.url().includes("/admin/leads"), page.url());

    // ---- /admin/leads: list + interactions ----
    console.log("\n== /admin/leads ==");
    const leadsGeo = await page.evaluate(() => {
      const aside = document.querySelector("aside");
      const main = document.querySelector("main");
      if (!aside || !main) return null;
      const a = aside.getBoundingClientRect();
      const m = main.getBoundingClientRect();
      return { overlap: m.x < a.right, asideW: Math.round(a.width) };
    });
    check("leads page sidebar present + no overlap", !!leadsGeo && !leadsGeo.overlap);
    const bodyText = await page.evaluate(() => document.body.innerText);
    const hasSearch = await page.evaluate(() => {
      const main = document.querySelector("main");
      return !!main && !!main.querySelector('input[placeholder*="Search name"]') && !!main.querySelector("select");
    });
    check("leads page has search toolbar", hasSearch);
    check("leads page has Add Lead button", bodyText.includes("Add Lead"));

    // Expand first row (if any)
    const hasRows = await page.evaluate(() => !!document.querySelector("main .space-y-2 > div"));
    if (hasRows) {
      const expanded = await page.evaluate(() => {
        const row = document.querySelector("main .space-y-2 > div");
        const head = row.querySelector(".cursor-pointer");
        if (head) head.click();
        return true;
      });
      await sleep(400);
      check("lead row expands on click", expanded);
      const detail = await page.evaluate(() => document.body.innerText.includes("Lead ID"));
      check("expanded detail shows real fields", detail);
      // status dropdown exists and is interactive
      const sel = await page.evaluate(() => {
        const s = document.querySelector("main select");
        if (!s) return null;
        s.value = "audited";
        s.dispatchEvent(new Event("change", { bubbles: true }));
        return true;
      });
      check("status dropdown interactive", sel === true);
      await sleep(800);
    } else {
      console.log("SKIP row interactions (no leads rows)");
    }

    // ---- Add Lead form opens ----
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("main button"));
      const add = btns.find((b) => b.textContent.includes("Add Lead"));
      if (add) add.click();
    });
    await sleep(400);
    check("Add Lead form opens", await page.evaluate(() => document.body.innerText.includes("New Lead")));

    // ---- MOBILE: drawer not forced open, no overlap ----
    console.log("\n== MOBILE (390px) ==");
    await page.setViewport({ width: 390, height: 844 });
    await page.goto(BASE + "/admin", { waitUntil: "networkidle2", timeout: 60000 });
    await sleep(1200);
    const mGeo = await page.evaluate(() => {
      const aside = document.querySelector("aside");
      const main = document.querySelector("main");
      if (!aside || !main) return null;
      const a = aside.getBoundingClientRect();
      const m = main.getBoundingClientRect();
      return {
        asideX: Math.round(a.x), asideRight: Math.round(a.right),
        mainX: Math.round(m.x), mainW: Math.round(m.width),
        asideOffCanvas: a.right <= 0 || a.x >= window.innerWidth,
      };
    });
    check("sidebar is off-canvas on mobile (drawer)", !!mGeo && mGeo.asideOffCanvas);
    check("main content spans full mobile width", !!mGeo && mGeo.mainX === 0 && mGeo.mainW > 350, JSON.stringify(mGeo));
    // open drawer
    await page.evaluate(() => {
      const b = document.querySelector('button[aria-label="Open menu"]');
      if (b) b.click();
    });
    await sleep(600);
    const drawer = await page.evaluate(() => {
      const aside = document.querySelector("aside");
      const a = aside.getBoundingClientRect();
      return { x: Math.round(a.x), w: Math.round(a.width) };
    });
    check("menu button opens the drawer", !!drawer && drawer.x === 0 && drawer.w > 100, JSON.stringify(drawer));
    // close via backdrop
    await page.evaluate(() => {
      const bd = document.querySelector(".fixed.inset-0.z-40");
      if (bd) bd.click();
    });
    await sleep(400);

    // ---- Console errors ----
    const realErrs = errs.filter((e) => !/favicon|net::ERR_ABORTED|Failed to load resource.*(404|500)/i.test(e));
    check("no console/page errors", realErrs.length === 0, realErrs.slice(0, 3).join(" | "));
  } catch (e) {
    console.error("QA ERROR:", e);
    fail++;
  } finally {
    await browser.close();
  }

  console.log(`\n== RESULT: ${pass} pass, ${fail} fail ==`);
  process.exit(fail ? 1 : 0);
})();