// Verifies per-client Google Calendar provisioning plumbing on production:
//  - seeding a Booking Automation records the calendar integration row
//  - /api/admin/bookings lists the client booking automation
//  - /admin/bookings renders the per-client section honestly
//  - OAuth connect for that client is guarded (503 until creds exist)
// Google credentials are NOT configured yet, so the expected state is
// truthful "not connected / waiting for credentials" — never fake-live.
const puppeteer = require("puppeteer-core");
const fs = require("fs");
const BASE = process.env.TEST_BASE || "https://elion.com.ng";
const ADMIN_EMAIL = "awodeyiayoola@gmail.com";
const ADMIN_PASSWORD = "Ayoolamikun$123";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const TS = Date.now();
const CO = "Booking Calendar QA " + TS;
function loadEnv(path) {
  const env = {};
  for (const line of fs.readFileSync(path, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return env;
}
const env = { ...loadEnv(".env.local"), ...process.env };
const sbUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const sbKey = env.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: sbKey, Authorization: "Bearer " + sbKey, "Content-Type": "application/json" };
const HP = { ...H, Prefer: "return=representation" };
const one = (b) => (Array.isArray(b) ? b[0] : b);
const retry = async (fn, n = 4) => {
  for (let i = 0; i < n; i++) {
    try { return await fn(); } catch (e) { if (i === n - 1) throw e; await new Promise((r) => setTimeout(r, 2500)); }
  }
};
let passed = 0, failed = 0;
function check(label, cond) {
  console.log((cond ? "  PASS: " : "  FAIL: ") + label);
  if (cond) passed++; else failed++;
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  let client = null, org = null, auto = null, cred = null;
  try {
    // Seed: client + booking automation + calendar integration row (mirrors deploy flow)
    client = one(await retry(() => fetch(sbUrl + "/rest/v1/clients", {
      method: "POST", headers: HP,
      body: JSON.stringify({ company_name: CO, contact_name: "QA", email: "bkqa" + TS + "@qa.elion.local", industry: "Healthcare", onboarding_status: "pending", status: "active" }),
    }).then((r) => r.json())));
    const tpl = one(await (await fetch(sbUrl + "/rest/v1/workflow_templates?select=id,slug&slug=eq.booking", { headers: H })).json());
    auto = one(await retry(() => fetch(sbUrl + "/rest/v1/client_automations", {
      method: "POST", headers: HP,
      body: JSON.stringify({
        client_id: client.id, template_id: tpl.id, custom_name: "Booking Automation", status: "pending",
        custom_config: { calendar_provider: "Google Calendar", duration: "30 minutes", buffer: "15 minutes", timezone: "Africa/Lagos", working_hours: "Mon-Fri 9:00 AM - 5:00 PM" },
      }),
    }).then((r) => r.json())));
    cred = one(await retry(() => fetch(sbUrl + "/rest/v1/integration_credentials", {
      method: "POST", headers: HP,
      body: JSON.stringify({ client_id: client.id, integration_type: "calendar", status: "not_configured", health: "unknown" }),
    }).then((r) => r.json())));
    check("booking client seeded", !!client?.id && !!auto?.id && !!cred?.id);
    check("calendar cred recorded not_configured", cred?.status === "not_configured");

    // Browser: admin bookings page lists the client booking automation
    const browser = await puppeteer.launch({
      executablePath: CHROME, headless: "new",
      args: ["--no-sandbox", "--disable-dev-shm-usage"],
      defaultViewport: { width: 1440, height: 1100 },
    });
    const page = await browser.newPage();
    const logs = [];
    page.on("console", (m) => logs.push(m.type() + ": " + m.text()));
    page.on("pageerror", (e) => logs.push("PAGEERROR: " + e.message));
    await page.goto(BASE + "/login", { waitUntil: "networkidle2", timeout: 60000 });
    await page.waitForSelector('input[type="email"]', { timeout: 15000 });
    await page.type('input[type="email"]', ADMIN_EMAIL, { delay: 12 });
    await page.type('input[type="password"]', ADMIN_PASSWORD, { delay: 12 });
    await page.evaluate(() => document.querySelector("form").requestSubmit());
    for (let i = 0; i < 15; i++) { await sleep(1500); if (!page.url().includes("/login")) break; }
    check("admin logged in", page.url().includes("/admin"));
    await page.goto(BASE + "/admin/bookings", { waitUntil: "networkidle2", timeout: 60000 });
    await sleep(2500);
    const text = await page.evaluate(() => document.body.innerText);
    check("page shows Client booking automations section", text.includes("Client booking automations"));
    check("page shows the seeded client", text.includes(CO));
    check("page shows Booking Automation product", text.includes("Booking Automation"));
    check("page shows Waiting for Google credentials (honest)", text.includes("Waiting for Google credentials"));
    check("page does NOT claim connected", !text.includes("Calendar connected"));

    // API check via in-page fetch (admin session)
    const api = await page.evaluate(async () => {
      const r = await fetch("/api/admin/bookings");
      const d = await r.json();
      return { status: r.status, count: (d.clientCalendars || []).length };
    });
    check("admin bookings API lists client calendars", api.status === 200 && api.count >= 1);

    // OAuth connect for this client must fail closed in-session (no creds configured yet)
    const oa = await page.evaluate(async (cid) => {
      const r = await fetch("/api/bookings/oauth?client_id=" + cid, { redirect: "manual" });
      let body = {};
      try { body = await r.json(); } catch {}
      return { status: r.status, error: body.error || "" };
    }, client.id);
    check("oauth connect honest 503 (creds not configured)", oa.status === 503);
    check("oauth message names env vars", (oa.error || "").includes("GOOGLE_CLIENT_ID"));

    // The OAuth probe above intentionally triggers one 503 resource error — ignore it.
    const errors = logs.filter((l) => l.startsWith("PAGEERROR") || (l.startsWith("error:") && !l.includes("favicon") && !l.includes("503")));
    check("no console/page errors", errors.length === 0);
    if (errors.length) console.log(errors.slice(0, 4).join("\n"));
    await browser.close();
  } catch (err) {
    console.log("QA CRASHED:", err.message);
    failed++;
  } finally {
    if (cred?.id) await fetch(sbUrl + "/rest/v1/integration_credentials?id=eq." + cred.id, { method: "DELETE", headers: H });
    if (auto?.id) await fetch(sbUrl + "/rest/v1/client_automations?id=eq." + auto.id, { method: "DELETE", headers: H });
    if (client?.id) await fetch(sbUrl + "/rest/v1/clients?id=eq." + client.id, { method: "DELETE", headers: H });
    console.log("cleanup done");
  }
  console.log("\n=== RESULT: " + (failed === 0 ? "ALL PASS" : failed + " FAILURES") + " (" + passed + " passed) ===");
  process.exit(failed === 0 ? 0 : 1);
})();
