const puppeteer = require("puppeteer-core");
const fs = require("fs");
const BASE = process.env.TEST_BASE || "https://elion.com.ng";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const TS = Date.now();
const CO = "Overview Diag " + TS;
const EMAIL = "odiag" + TS + "@qa.elion.local";
const PW = "QaClientPass!2026";
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
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  let client = null, org = null, user = null, auto = null;
  try {
    const c = await (await fetch(sbUrl + "/rest/v1/clients", { method: "POST", headers: HP, body: JSON.stringify({ company_name: CO, contact_name: "D", email: EMAIL, industry: "Real Estate", onboarding_status: "completed", status: "active" }) })).json();
    client = one(c);
    let rows = await (await fetch(sbUrl + "/rest/v1/organizations?select=id&client_id=eq." + client.id, { headers: H })).json();
    if (!rows.length) {
      const ins = await fetch(sbUrl + "/rest/v1/organizations", { method: "POST", headers: HP, body: JSON.stringify({ name: CO, slug: "odiag-" + TS, client_id: client.id, org_type: "client", status: "active" }) });
      rows = ins.status === 409 ? await (await fetch(sbUrl + "/rest/v1/organizations?select=id&client_id=eq." + client.id, { headers: H })).json() : await ins.json();
    }
    org = one(rows);
    const u = await (await fetch(sbUrl + "/auth/v1/admin/users", { method: "POST", headers: H, body: JSON.stringify({ email: EMAIL, password: PW, email_confirm: true }) })).json();
    user = one(u);
    await fetch(sbUrl + "/rest/v1/organization_memberships", { method: "POST", headers: HP, body: JSON.stringify({ user_id: user.id, organization_id: org.id, role: "client", status: "active" }) });
    const tpl = one(await (await fetch(sbUrl + "/rest/v1/workflow_templates?select=id&slug=eq.lead_response", { headers: H })).json());
    const aa = await (await fetch(sbUrl + "/rest/v1/client_automations", { method: "POST", headers: HP, body: JSON.stringify({ client_id: client.id, template_id: tpl.id, custom_name: "Lead Response System", status: "live", total_runs: 3, success_rate: 67, last_run_at: new Date().toISOString() }) })).json();
    auto = one(aa);
    await fetch(sbUrl + "/rest/v1/integration_credentials", { method: "POST", headers: HP, body: JSON.stringify({ client_id: client.id, integration_type: "whatsapp", status: "connected", health: "healthy" }) });
    await fetch(sbUrl + "/rest/v1/activity_log", { method: "POST", headers: HP, body: JSON.stringify({ event_type: "lead_response_automation", event_data: { client_id: client.id, automation_id: auto.id, status: "responded", lead_name: "Ada Obi" } }) });

    const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox", "--disable-dev-shm-usage"], defaultViewport: { width: 1440, height: 1000 } });
    const page = await browser.newPage();
    page.on("pageerror", (e) => console.log("PAGEERR:", e.message.slice(0, 300)));
    await page.goto(BASE + "/login", { waitUntil: "networkidle2", timeout: 60000 });
    await page.waitForSelector('input[type="email"]', { timeout: 15000 });
    await page.type('input[type="email"]', EMAIL, { delay: 10 });
    await page.type('input[type="password"]', PW, { delay: 10 });
    await page.evaluate(() => document.querySelector("form").requestSubmit());
    for (let i = 0; i < 15; i++) { await sleep(1500); if (!page.url().includes("/login")) break; }
    console.log("url:", page.url().replace(BASE, ""));
    await sleep(2500);
    const diag = await page.evaluate(async () => {
      const ov = await fetch("/api/client/overview");
      let body = "";
      try { body = (await ov.json()).slice ? "array" : JSON.stringify(await ov.clone().json()).slice(0, 900); } catch { body = await ov.text(); }
      return { status: ov.status, body, pageText: document.body.innerText.slice(0, 600) };
    });
    console.log("overview status:", diag.status);
    console.log("overview body:", diag.body);
    console.log("PAGE TEXT:", diag.pageText.replace(/\n+/g, " | "));
    await page.screenshot({ path: "scripts/diag-overview.png" }).catch(() => {});
    await browser.close();
  } catch (e) {
    console.log("CRASH:", e.message);
  } finally {
    if (user?.id) await fetch(sbUrl + "/auth/v1/admin/users/" + user.id, { method: "DELETE", headers: H });
    if (auto?.id) await fetch(sbUrl + "/rest/v1/client_automations?id=eq." + auto.id, { method: "DELETE", headers: H });
    if (org?.id) { await fetch(sbUrl + "/rest/v1/organization_memberships?organization_id=eq." + org.id, { method: "DELETE", headers: H }); await fetch(sbUrl + "/rest/v1/organizations?id=eq." + org.id, { method: "DELETE", headers: H }); }
    if (client?.id) await fetch(sbUrl + "/rest/v1/clients?id=eq." + client.id, { method: "DELETE", headers: H });
    console.log("cleanup done");
  }
})();
