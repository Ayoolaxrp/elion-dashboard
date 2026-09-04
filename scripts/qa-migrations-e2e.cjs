// QA: migrations 017 + 018 end-to-end on production.
// 1. Admin login, anonymous 401 on /api/admin/audits
// 2. Lead create -> archive (must succeed now) -> restore -> delete
// 3. Audit with email -> persisted row + visible in /api/admin/audits
// 4. Audit without email -> persisted with nullable lead_id
// 5. Cleanup of all test rows
// Usage: node scripts/qa-migrations-e2e.cjs
const path = require("path");
const fs = require("fs");
const puppeteer = require(path.join(__dirname, "..", "node_modules", "puppeteer-core"));
const { createClient } = require(path.join(__dirname, "..", "node_modules", "@supabase/supabase-js"));

// .env.local loader
function loadEnv() {
  const env = {};
  const p = path.join(__dirname, "..", ".env.local");
  for (const line of fs.readFileSync(p, "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
  return env;
}
const env = loadEnv();
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

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
const uid = "qa-mig-" + Date.now();

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: "new",
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
    defaultViewport: { width: 1440, height: 1000 },
  });
  const page = await browser.newPage();

  try {
    // ---- LOGIN ----
    await page.goto(BASE + "/login?redirect=/admin", { waitUntil: "networkidle2", timeout: 90000 });
    await page.waitForSelector('input[type="email"]', { timeout: 20000 });
    await page.type('input[type="email"]', ADMIN_EMAIL, { delay: 10 });
    await page.type('input[type="password"]', ADMIN_PASSWORD, { delay: 10 });
    await page.evaluate(() => { const f = document.querySelector("form"); if (f) f.requestSubmit(); });
    await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 30000 }).catch(() => {});
    await sleep(2500);
    check("admin login", page.url().includes("/admin"), page.url());

    // ---- ANONYMOUS CHECKS ----
    const anon = await browser.createBrowserContext();
    const anonPage = await anon.newPage();
    await anonPage.goto(BASE + "/login", { waitUntil: "domcontentloaded", timeout: 60000 });
    const anonStatus = await anonPage.evaluate(async () => (await fetch("/api/admin/audits")).status);
    check("anonymous /api/admin/audits -> 401", anonStatus === 401, `status=${anonStatus}`);
    await anon.close();

    // ---- AUTHENTICATED API HELPER ----
    const api = async (url, opts = {}) => {
      return page.evaluate(async ({ u, o }) => {
        const r = await fetch("https://elion.com.ng" + u, {
          method: o.method || "GET",
          headers: { "Content-Type": "application/json", ...(o.headers || {}) },
          body: o.body ? JSON.stringify(o.body) : undefined,
        });
        let j = null;
        try { j = await r.json(); } catch {}
        return { status: r.status, body: j };
      }, { u: url, o: opts });
    };

    // ---- LEAD ARCHIVE / RESTORE (migration 017) ----
    console.log("\n== LEAD ARCHIVE / RESTORE ==");
    const email = uid + "@example.com";
    const created = await api("/api/admin/leads", { method: "POST", body: {
      contact_name: "QA Mig Lead", email, phone: "+2348000000000",
      company_name: "QA Mig Corp", website: "https://qamig.example",
      industry: "QA", primary_problem: "migration 017 verification",
    }});
    const leadId = created.body?.lead?.id;
    check("create lead", created.status === 200 && !!leadId, `status=${created.status}`);

    const arch = await api("/api/admin/leads", { method: "PATCH", body: { id: leadId, archive: true } });
    if (arch.status === 200 && arch.body?.lead?.archived_at) {
      check("archive succeeds (migration 017 live)", true);
      // Verify at the DB level
      const { data: dbLead } = await sb.from("leads").select("archived_at").eq("id", leadId).single();
      check("archived_at set in DB", !!dbLead?.archived_at, dbLead?.archived_at);

      const rest = await api("/api/admin/leads", { method: "PATCH", body: { id: leadId, archive: false } });
      check("restore succeeds", rest.status === 200 && !rest.body?.lead?.archived_at, `status=${rest.status}`);
      const { data: dbLead2 } = await sb.from("leads").select("archived_at").eq("id", leadId).single();
      check("archived_at cleared in DB", !dbLead2?.archived_at);
    } else {
      check("archive succeeds (migration 017 live)", false, arch.body?.error || `status=${arch.status}`);
    }

    // ---- AUDIT PERSISTENCE (migration 018) ----
    console.log("\n== AUDIT PERSISTENCE ==");
    const auditBody = {
      company_name: "QA Mig Audit Co " + uid,
      industry: "QA Services",
      website: "https://qamigaudit.example",
      name: "QA Auditor",
      email: "auditor-" + uid + "@example.com",
    };
    const auditRes = await fetch(BASE + "/api/audit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(auditBody),
    });
    check("audit POST returns 200", auditRes.status === 200, `status=${auditRes.status}`);
    const auditJson = await auditRes.json();
    check("audit returns findings", Array.isArray(auditJson.leaks) && auditJson.leaks.length > 0);

    // Wait for persistence (fire-and-forget insert)
    let dbAudit = null;
    for (let i = 0; i < 10 && !dbAudit; i++) {
      await sleep(1000);
      const { data } = await sb.from("audits")
        .select("id, company_name, lead_id, created_at")
        .eq("company_name", auditBody.company_name)
        .limit(1);
      dbAudit = data && data[0];
    }
    check("audit row persisted in DB", !!dbAudit, dbAudit ? dbAudit.id : "not found");
    check("audit linked to lead", !!dbAudit?.lead_id, dbAudit?.lead_id || "null");
    if (dbAudit) {
      const { data: leadRow } = await sb.from("leads").select("id, lead_status").eq("id", dbAudit.lead_id).single();
      check("lead marked audited", leadRow?.lead_status === "audited", leadRow?.lead_status);
    }

    const adminAudits = await api("/api/admin/audits");
    const foundInAdmin = (adminAudits.body?.audits || []).find((a) => a.id === dbAudit?.id);
    check("audit visible via /api/admin/audits", adminAudits.status === 200 && !!foundInAdmin, `status=${adminAudits.status}`);

    // Audit WITHOUT email -> nullable lead_id
    console.log("\n== AUDIT WITHOUT EMAIL ==");
    const auditNoEmail = await fetch(BASE + "/api/audit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ company_name: "QA NoEmail Audit " + uid, industry: "QA" }),
    });
    check("audit without email returns 200", auditNoEmail.status === 200, `status=${auditNoEmail.status}`);
    let dbAudit2 = null;
    for (let i = 0; i < 10 && !dbAudit2; i++) {
      await sleep(1000);
      const { data } = await sb.from("audits")
        .select("id, company_name, lead_id")
        .eq("company_name", "QA NoEmail Audit " + uid)
        .limit(1);
      dbAudit2 = data && data[0];
    }
    check("email-less audit persisted", !!dbAudit2, dbAudit2 ? dbAudit2.id : "not found");
    check("email-less audit has null lead_id (migration 018)", !dbAudit2?.lead_id);

    // ---- CLEANUP ----
    console.log("\n== CLEANUP ==");
    if (leadId) {
      const del = await api("/api/admin/leads", { method: "DELETE", body: { id: leadId } });
      check("delete test lead", del.status === 200, `status=${del.status}`);
    }
    const auditIds = [dbAudit?.id, dbAudit2?.id].filter(Boolean);
    if (auditIds.length) {
      const { error } = await sb.from("audits").delete().in("id", auditIds);
      check("delete test audits", !error, error?.message);
    }
    // Remove any leftover no-email audit + lead rows just in case
    await sb.from("audits").delete().like("company_name", "QA %Audit%").like("company_name", `%${uid}%`);
    await sb.from("leads").delete().eq("email", email);
    await sb.from("leads").delete().like("email", "auditor-%" + uid + "%");
  } catch (e) {
    console.error("QA ERROR:", e);
    fail++;
  } finally {
    await browser.close();
  }
  console.log(`\n== RESULT: ${pass} pass, ${fail} fail ==`);
  process.exit(fail ? 1 : 0);
})();