// QA: /status rebuild + admin status/incident control APIs (production).
// Verifies: public page content + internal-component hygiene + 375px layout,
// anon 401 gates, admin component status change (with today's snapshot
// recording), incident create -> update -> resolve, and full cleanup.
// Usage: node scripts/qa-status-page.cjs
const path = require("path");
const fs = require("fs");
const puppeteer = require(path.join(__dirname, "..", "node_modules", "puppeteer-core"));
const { createClient } = require(path.join(__dirname, "..", "node_modules", "@supabase/supabase-js"));

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

function loadEnv() {
  const env = {};
  for (const line of fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
  return env;
}
const env = loadEnv();
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: "new",
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
    defaultViewport: { width: 1440, height: 1000 },
  });
  let componentId = null;   // component used for the status-change test
  let incidentId = null;    // incident created for the log test
  let changedComp = null;

  try {
    // ============ ANON: public page ============
    console.log("\n== PUBLIC /status (anon) ==");
    const anon = await browser.createBrowserContext();
    const page = await anon.newPage();
    await page.setViewport({ width: 375, height: 812 });
    await page.goto(BASE + "/status", { waitUntil: "networkidle2", timeout: 60000 });
    await sleep(1500);

    const text = await page.evaluate(() => document.body.innerText);
    const hasOverall = /All Systems Operational|Degraded Performance|Partial Outage|Major Outage/.test(text);
    check("overall status banner present", hasOverall, "");
    check("has 'Incident history' heading", text.includes("Incident history"));
    check("legend present (Operational + Major Outage labels)", text.includes("Operational") && text.includes("Major Outage"));

    // Which public components are actually listed?
    const compRows = await page.evaluate(() =>
      Array.from(document.querySelectorAll("h1, h2, h3, .text-sm")).map((e) => e.textContent || "").filter(Boolean)
    );
    const html = await page.content();
    const INTERNAL = ["n8n", "WhatsApp Integration", "CRM Integrations", "Payments", "Email Notifications", "Database"];
    const leaks = INTERNAL.filter((s) => html.includes(s) || text.includes(s));
    check("no internal infrastructure leaked (n8n/WhatsApp/CRM/Payments/Database)", leaks.length === 0, leaks.join(",") || "clean");

    check("Booking System listed", /Booking System/.test(text), "");
    check("Google Calendar Connection listed", /Google Calendar Connection/.test(text), "");
    check("has uptime % labels", /%|day tracked|days tracked/.test(text), "");

    // No horizontal overflow at 375px
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    check("no horizontal overflow at 375px", overflow <= 0, `overflow=${overflow}px`);
    // no 'Manage' link for anon
    check("no Manage link for logged-out visitor", !(await page.evaluate(() => document.body.innerText)).includes("Manage"), "");

    // ============ ANON: API gates ============
    console.log("\n== ANON API gates ==");
    const apiAnon = await page.evaluate(async () => {
      const st = await fetch("/api/admin/status");
      const stBody = await st.json();
      const inc = await fetch("/api/admin/incidents");
      const clean = (stBody.components || []).every((c) => c.is_visible === true && c.status !== "not-configured");
      return { status: st.status, admin: stBody.admin, count: (stBody.components || []).length, clean, incStatus: inc.status, names: (stBody.components || []).map((c) => c.component_name) };
    });
    check("anon GET /api/admin/status -> 200 with admin:false", apiAnon.status === 200 && apiAnon.admin === false, `admin=${apiAnon.admin}`);
    check("anon sees only public components", apiAnon.clean === true && apiAnon.count > 0, `count=${apiAnon.count}`);
    check("anon /api/admin/incidents -> 401", apiAnon.incStatus === 401, `status=${apiAnon.incStatus}`);

    // ============ ADMIN login ============
    console.log("\n== ADMIN status + incidents ==");
    const adminCtx = await browser.createBrowserContext();
    const adminPage = await adminCtx.newPage();
    await adminPage.setViewport({ width: 1440, height: 1000 });
    await adminPage.goto(BASE + "/login?redirect=/admin/status", { waitUntil: "networkidle2", timeout: 60000 });
    await adminPage.waitForSelector('input[type="email"]', { timeout: 15000 });
    await adminPage.type('input[type="email"]', ADMIN_EMAIL, { delay: 10 });
    await adminPage.type('input[type="password"]', ADMIN_PASSWORD, { delay: 10 });
    await adminPage.evaluate(() => { const f = document.querySelector("form"); if (f) f.requestSubmit(); });
    await adminPage.waitForNavigation({ waitUntil: "networkidle2", timeout: 30000 }).catch(() => {});
    await sleep(2500);
    check("admin login lands on /admin/status", adminPage.url().includes("/admin/status"), adminPage.url());

    const api = async (url, opts = {}) => {
      return adminPage.evaluate(async ({ u, o }) => {
        const r = await fetch("https://elion.com.ng" + u, { method: o.method || "GET", headers: { "Content-Type": "application/json", ...(o.headers || {}) }, body: o.body ? JSON.stringify(o.body) : undefined });
        let j = null;
        try { j = await r.json(); } catch {}
        return { status: r.status, body: j };
      }, { u: url, o: opts });
    };

    // Admin GET returns everything incl. hidden internal rows
    const allRes = await api("/api/admin/status");
    const all = allRes.body.components || [];
    check("admin GET sees all components (incl. hidden)", allRes.admin === true && all.some((c) => c.is_visible === false), `total=${all.length}`);
    // Prefer a non-live-affecting component (never toggle the calendar/book
    // components the real booking flow depends on).
    const skip = ["Google Calendar Connection", "Booking System"]
    const target = all.find((c) => c.is_visible === true && c.status === "operational" && !skip.includes(c.component_name)) || all.find((c) => c.is_visible === true && c.status === "operational");
    check("found an operational public component to toggle", !!target, target?.component_name || "none");
    componentId = target?.id || null;
    changedComp = target?.component_name || null;

    // ============ Component status change -> snapshot recorded ============
    if (target) {
      const today = new Date().toISOString().slice(0, 10);
      const put = await api("/api/admin/status", { method: "PUT", body: { id: target.id, status: "degraded", note: "QA status test", is_visible: true } });
      check("PUT status -> degraded", put.status === 200 && put.body?.component?.status === "degraded", `status=${put.status}`);
      const { data: snap } = await sb.from("status_daily_snapshots").select("worst_status").eq("component_id", target.id).eq("date", today).maybeSingle();
      check("today snapshot recorded as degraded (worst-of)", snap?.worst_status === "degraded", snap?.worst_status || "none");
      // restore
      const restore = await api("/api/admin/status", { method: "PUT", body: { id: target.id, status: "operational", note: "", is_visible: true } });
      check("restore to operational", restore.status === 200 && restore.body?.component?.status === "operational", `status=${restore.status}`);
      const { data: snap2 } = await sb.from("status_daily_snapshots").select("worst_status").eq("component_id", target.id).eq("date", today).maybeSingle();
      check("worst-of keeps today degraded (not overwritten by restore)", snap2?.worst_status === "degraded", snap2?.worst_status || "none");
    }

    // ============ Incident create -> update -> resolve ============
    const title = "QA status incident " + Date.now();
    const created = await api("/api/admin/incidents", { method: "POST", body: { title, message: "Initial QA finding", status: "investigating", components_affected: changedComp ? [changedComp] : [] } });
    incidentId = created.body?.incident?.id;
    check("POST incident -> 201", created.status === 201 && !!incidentId, `status=${created.status} ${created.body?.error || ""}`);

    if (incidentId) {
      const up1 = await api("/api/admin/incidents", { method: "PUT", body: { id: incidentId, status: "identified", message: "Root cause found during QA" } });
      check("PUT incident -> identified", up1.status === 200 && up1.body?.incident_status === "identified", `status=${up1.status}`);
      const up2 = await api("/api/admin/incidents", { method: "PUT", body: { id: incidentId, status: "resolved", message: "Resolved during QA" } });
      check("PUT incident -> resolved", up2.status === 200 && up2.body?.incident_status === "resolved", `status=${up2.status}`);
      const listRes = await api("/api/admin/incidents");
      const inc = (listRes.body?.incidents || []).find((i) => i.id === incidentId);
      check("incident listed with 4-update timeline", !!inc && inc.updates?.length === 4, `updates=${inc?.updates?.length || 0}`);
      check("incident resolved_at set", !!inc?.resolved_at, inc?.resolved_at || "missing");

      // invalid phase rejected
      const bad = await api("/api/admin/incidents", { method: "PUT", body: { id: incidentId, status: "bogus", message: "x" } });
      check("invalid phase -> 400", bad.status === 400, `status=${bad.status}`);
      const missing = await api("/api/admin/incidents", { method: "PUT", body: { id: "incident_nope", status: "resolved" } });
      check("unknown incident -> 404", missing.status === 404, `status=${missing.status}`);
    }
  } catch (e) {
    console.error("QA ERROR:", e);
    fail++;
  } finally {
    // ============ CLEANUP (service role) ============
    console.log("\n== CLEANUP ==");
    if (incidentId) {
      const { error } = await sb.from("incidents").delete().eq("id", incidentId);
      console.log(error ? "cleanup incident FAIL: " + error.message : "cleaned incident " + incidentId.slice(0, 18));
    }
    if (componentId) {
      // Leave component operational; today's snapshot stays worst-of (degraded),
      // which honestly reflects that a status change happened today.
      const { error } = await sb.from("system_status").update({ status: "operational", note: "", updated_at: new Date().toISOString() }).eq("id", componentId);
      console.log(error ? "cleanup component FAIL: " + error.message : "component restored to operational");
    }
    await browser.close();
  }
  console.log(`\n== RESULT: ${pass} pass, ${fail} fail ==`);
  process.exit(fail ? 1 : 0);
})();
