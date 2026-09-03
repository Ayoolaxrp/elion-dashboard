const puppeteer = require("puppeteer-core");
const fs = require("fs");
const BASE = process.env.TEST_BASE || "https://elion.com.ng";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const TS = Date.now();
const CO = "Login Diag " + TS;
const EMAIL = "diag" + TS + "@qa.elion.local";
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
  let client = null, org = null, user = null;
  try {
    const c = await (await fetch(sbUrl + "/rest/v1/clients", { method: "POST", headers: HP, body: JSON.stringify({ company_name: CO, contact_name: "D", email: EMAIL, industry: "X", onboarding_status: "completed", status: "active" }) })).json();
    client = one(c);
    let o = await fetch(sbUrl + "/rest/v1/organizations?select=id&client_id=eq." + client.id, { headers: H });
    let rows = await o.json();
    if (!rows.length) {
      const ins = await fetch(sbUrl + "/rest/v1/organizations", { method: "POST", headers: HP, body: JSON.stringify({ name: CO, slug: "diag-" + TS, client_id: client.id, org_type: "client", status: "active" }) });
      rows = ins.status === 409 ? await (await fetch(sbUrl + "/rest/v1/organizations?select=id&client_id=eq." + client.id, { headers: H })).json() : await ins.json();
    }
    org = one(rows);
    const u = await (await fetch(sbUrl + "/auth/v1/admin/users", { method: "POST", headers: H, body: JSON.stringify({ email: EMAIL, password: PW, email_confirm: true }) })).json();
    user = one(u);
    const mem = await fetch(sbUrl + "/rest/v1/organization_memberships", { method: "POST", headers: HP, body: JSON.stringify({ user_id: user.id, organization_id: org.id, role: "client", status: "active" }) });
    console.log("seeded client/org/user/membership:", !!client.id, !!org.id, !!user.id, mem.status);

    // Direct API login to see returned redirect
    const api = await fetch(BASE + "/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: EMAIL, password: PW }) });
    console.log("api login status:", api.status, "body:", (await api.text()).slice(0, 200));

    const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox", "--disable-dev-shm-usage"], defaultViewport: { width: 1440, height: 1000 } });
    const page = await browser.newPage();
    page.on("console", (m) => { if (m.type() === "error") console.log("CONSOLE-ERR:", m.text().slice(0, 200)); });
    page.on("pageerror", (e) => console.log("PAGEERR:", e.message.slice(0, 200)));
    await page.goto(BASE + "/login", { waitUntil: "networkidle2", timeout: 60000 });
    await page.waitForSelector('input[type="email"]', { timeout: 15000 });
    await page.type('input[type="email"]', EMAIL, { delay: 10 });
    await page.type('input[type="password"]', PW, { delay: 10 });
    await page.evaluate(() => document.querySelector("form").requestSubmit());
    for (let i = 0; i < 20; i++) {
      await sleep(1500);
      const url = page.url();
      if (!url.includes("/login")) {
        console.log("redirected to:", url.replace(BASE, ""));
        break;
      }
      if (i === 19) console.log("STILL ON /login; body:", (await page.evaluate(() => document.body.innerText)).slice(0, 200).replace(/\n/g, " | "));
    }
    const me = await page.evaluate(async () => (await fetch("/api/auth/me")).json().then((j) => JSON.stringify(j)));
    console.log("/api/auth/me:", me.slice(0, 300));
    await browser.close();
  } catch (e) {
    console.log("CRASH:", e.message);
  } finally {
    if (user?.id) await fetch(sbUrl + "/auth/v1/admin/users/" + user.id, { method: "DELETE", headers: H });
    if (org?.id) { await fetch(sbUrl + "/rest/v1/organization_memberships?organization_id=eq." + org.id, { method: "DELETE", headers: H }); await fetch(sbUrl + "/rest/v1/organizations?id=eq." + org.id, { method: "DELETE", headers: H }); }
    if (client?.id) await fetch(sbUrl + "/rest/v1/clients?id=eq." + client.id, { method: "DELETE", headers: H });
    console.log("cleanup done");
  }
})();
