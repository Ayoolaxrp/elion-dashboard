// QA: hardening-pass live verification against https://elion.com.ng
const path = require("path");
const puppeteer = require(path.join(__dirname, "..", "node_modules", "puppeteer-core"));
const BASE = "https://elion.com.ng";
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
    executablePath: CHROME, headless: "new",
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
    defaultViewport: { width: 1440, height: 1000 },
  });
  const page = await browser.newPage();
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push(String(e)));

  try {
    await page.goto(BASE + "/login?redirect=/admin", { waitUntil: "networkidle2", timeout: 60000 });
    await page.waitForSelector('input[type="email"]', { timeout: 15000 });
    await page.type('input[type="email"]', ADMIN_EMAIL, { delay: 10 });
    await page.type('input[type="password"]', ADMIN_PASSWORD, { delay: 10 });
    await page.evaluate(() => { const f = document.querySelector("form"); if (f) f.requestSubmit(); });
    await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 30000 }).catch(() => {});
    await sleep(2500);
    check("admin login", page.url().includes("/admin"), page.url());

    const anon = await browser.createBrowserContext();
    const anonPage = await anon.newPage();
    await anonPage.goto(BASE + "/login", { waitUntil: "domcontentloaded", timeout: 60000 });
    const anonStatus = await anonPage.evaluate(async () => (await fetch("/api/admin/audits")).status);
    check("anonymous /api/admin/audits -> 401", anonStatus === 401, `status=${anonStatus}`);
    await anon.close();

    const api = async (url, opts = {}) => {
      return page.evaluate(async ({ u, o }) => {
        const r = await fetch("https://elion.com.ng" + u, { method: o.method || "GET", headers: { "Content-Type": "application/json", ...(o.headers || {}) }, body: o.body ? JSON.stringify(o.body) : undefined });
        let j = null;
        try { j = await r.json(); } catch {}
        return { status: r.status, body: j };
      }, { u: url, o: opts });
    };

    const stamp = "qa-" + Date.now();
    const auditRes = await api("/api/audit", {
      method: "POST",
      body: { company_name: "Hardening QA " + stamp, industry: "Software", website: "https://elion.com.ng", name: "QA Bot", email: stamp + "@elion.local" },
    });
    check("real audit -> 200 with leaks", auditRes.status === 200 && Array.isArray(auditRes.body?.leaks) && auditRes.body.leaks.length > 0, `status=${auditRes.status} leaks=${auditRes.body?.leaks?.length ?? "n/a"}`);

    await sleep(1500);
    const auditsRes = await api("/api/admin/audits?limit=10");
    const foundAudit = Array.isArray(auditsRes.body?.audits) && auditsRes.body.audits.some((a) => String(a.company_name || "").includes(stamp));
    check("audit persisted + visible in /api/admin/audits", auditsRes.status === 200 && foundAudit, `status=${auditsRes.status} count=${auditsRes.body?.audits?.length ?? 0}`);

    await page.goto(BASE + "/admin/audits", { waitUntil: "networkidle2", timeout: 60000 });
    await sleep(1500);
    const auditsPage = await page.evaluate(() => {
      const txt = document.body.innerText || "";
      return { hasTitle: /audit/i.test(txt), hasCompany: txt.includes("Hardening QA"), hasEmpty: /no audits|no audits yet/i.test(txt) };
    });
    check("/admin/audits renders", auditsPage.hasTitle, JSON.stringify(auditsPage));

    await page.goto(BASE + "/admin/logs", { waitUntil: "networkidle2", timeout: 60000 });
    await sleep(1500);
    const logsPage = await page.evaluate(() => {
      const txt = document.body.innerText || "";
      return { hasTitle: /log/i.test(txt), hasEmpty: /no execution|no activity|waiting|none yet|no logs/i.test(txt), noMock: !/execution-log-demo|sample execution/i.test(txt) };
    });
    check("/admin/logs renders (real or honest empty)", logsPage.hasTitle && logsPage.noMock, JSON.stringify(logsPage));

    await page.goto(BASE + "/landing/support", { waitUntil: "networkidle2", timeout: 60000 });
    let support = null;
    for (let i = 0; i < 4 && !support; i++) {
      await sleep(1500);
      support = await page.evaluate(() => {
        try {
          const labels = Array.from(document.querySelectorAll("label"));
          const labeled = labels.filter((l) => l.htmlFor && document.getElementById(l.htmlFor));
          const unlabeledInputs = Array.from(document.querySelectorAll("input, select, textarea")).filter((el) => {
            const id = el.id;
            if (id && document.getElementById(id)) return false;
            return !el.getAttribute("aria-label");
          });
          const telLinks = Array.from(document.querySelectorAll('a[href^="tel:"]'));
          const bright = telLinks.filter((a) => { const c = getComputedStyle(a).color; const m = c.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/); if (!m) return false; return Number(m[1]) > 140; });
          return { labelCount: labels.length, labeledCount: labeled.length, unlabeledInputs: unlabeledInputs.length, telLinks: telLinks.length, brightTel: bright.length };
        } catch (e) { return null; }
      }).catch(() => null);
    }
    check("support: all labels associated", !!support && support.labelCount > 0 && support.unlabeledInputs === 0, JSON.stringify(support));
    check("support: phone links have bright (contrast-fixed) color", !!support && support.telLinks > 0 && support.brightTel === support.telLinks, JSON.stringify(support));

    await page.goto(BASE + "/login?redirect=https://evil.example.com", { waitUntil: "domcontentloaded", timeout: 60000 });
    const loginGuard = await page.evaluate(() => {
      const hrefs = Array.from(document.querySelectorAll("a[href]")).map((a) => a.getAttribute("href"));
      return { hasEvil: hrefs.some((h) => h && h.includes("evil.example.com")), inApp: location.pathname.startsWith("/login") };
    });
    check("login: no external redirect surfaced", !loginGuard.hasEvil && loginGuard.inApp, JSON.stringify(loginGuard));

    check("no console/page errors on audited pages", errors.length === 0, errors.slice(0, 3).join(" | "));
  } catch (e) {
    check("script completed", false, String(e && e.message ? e.message : e));
  } finally {
    await browser.close();
  }
  console.log(`\nRESULT: ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();