// Outcome dashboard QA against production:
//  - seeds Client A (live automation, partial integrations, real activity)
//  - seeds Client B (fresh, nothing deployed)
//  - creates real auth users for both, logs in via the browser
//  - verifies A sees real outcomes/attention/health and B sees the honest
//    empty state with zero leakage of A's data, at 1440 / 768 / 375 px
const puppeteer = require("puppeteer-core");
const fs = require("fs");

const BASE = process.env.TEST_BASE || "https://elion.com.ng";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const TS = Date.now();
const CO_A = "Dashboard QA A " + TS;
const CO_B = "Dashboard QA B " + TS;
const EMAIL_A = "qaclienta" + TS + "@qa.elion.local";
const EMAIL_B = "qaclientb" + TS + "@qa.elion.local";
const PASSWORD = "QaClientPass!2026";

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

let passed = 0, failed = 0;
function check(label, cond) {
  console.log((cond ? "  PASS: " : "  FAIL: ") + label);
  if (cond) passed++; else failed++;
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const one = (body) => (Array.isArray(body) ? body[0] : body);

(async () => {
  // ---- SEED ---------------------------------------------------------
  let clientA = null, clientB = null, orgA = null, orgB = null, userA = null, userB = null, autoA = null;
  const actIds = [];
  const credIds = [];
  try {
    console.log("\n== SEED ==");
    // Lead Response template (already seeded in the DB)
    const tplRes = await fetch(sbUrl + "/rest/v1/workflow_templates?select=id,slug,required_integrations&slug=eq.lead_response", { headers: H });
    const tpls = await tplRes.json();
    const tpl = one(tpls);
    check("lead_response template present", !!tpl?.id);

    // Client A
    const ca = await fetch(sbUrl + "/rest/v1/clients", {
      method: "POST", headers: HP,
      body: JSON.stringify({ company_name: CO_A, contact_name: "QA Owner A", email: EMAIL_A, industry: "Real Estate", website: "https://a.example.com", onboarding_status: "completed", status: "active" }),
    });
    clientA = one(await ca.json());
    check("client A seeded", !!clientA?.id);

    // Org A (some environments auto-create the org on client insert, so fetch first, then insert if absent)
    async function ensureOrg(name, slug, clientId) {
      const existing = await fetch(sbUrl + "/rest/v1/organizations?select=id&client_id=eq." + clientId, { headers: H });
      const rows = await existing.json();
      if (Array.isArray(rows) && rows.length > 0) return one(rows);
      const ins = await fetch(sbUrl + "/rest/v1/organizations", {
        method: "POST", headers: HP,
        body: JSON.stringify({ name, slug, client_id: clientId, org_type: "client", status: "active" }),
      });
      if (ins.status === 409 || !ins.ok) {
        const again = await fetch(sbUrl + "/rest/v1/organizations?select=id&client_id=eq." + clientId, { headers: H });
        const rows2 = await again.json();
        if (Array.isArray(rows2) && rows2.length > 0) return one(rows2);
      }
      return one(await ins.json());
    }
    orgA = await ensureOrg(CO_A, "qa-dash-a-" + TS, clientA.id);
    check("org A seeded", !!orgA?.id);

    // Auth user A
    const ua = await fetch(sbUrl + "/auth/v1/admin/users", {
      method: "POST", headers: H,
      body: JSON.stringify({ email: EMAIL_A, password: PASSWORD, email_confirm: true }),
    });
    userA = one(await ua.json());
    check("auth user A created", !!userA?.id);

    // Membership A
    const ma = await fetch(sbUrl + "/rest/v1/organization_memberships", {
      method: "POST", headers: HP,
      body: JSON.stringify({ user_id: userA.id, organization_id: orgA.id, role: "client", status: "active" }),
    });
    check("membership A", (await ma.status) === 201 || (await ma.clone().json())?.id);

    // Automation A (live, healthy)
    const aa = await fetch(sbUrl + "/rest/v1/client_automations", {
      method: "POST", headers: HP,
      body: JSON.stringify({
        client_id: clientA.id, template_id: tpl.id, custom_name: "Lead Response System",
        status: "live", total_runs: 3, success_rate: 67, last_run_at: new Date(Date.now() - 120000).toISOString(), deployed_at: new Date().toISOString(),
        custom_config: { business_name: CO_A, whatsapp_number: "+2348001112222" },
      }),
    });
    autoA = one(await aa.json());
    check("automation A live", !!autoA?.id && autoA.status === "live");

    // Integration A: WhatsApp connected, Email missing (attention)
    const credA = await fetch(sbUrl + "/rest/v1/integration_credentials", {
      method: "POST", headers: HP,
      body: JSON.stringify({ client_id: clientA.id, integration_type: "whatsapp", status: "connected", health: "healthy", last_verified_at: new Date().toISOString() }),
    });
    credIds.push(one(await credA.json())?.id);

    // Activity A: 2 responded + 1 failed (real execution events)
    for (const [status, lead] of [["responded", "Ada Obi"], ["responded", "Tunde Bakare"], ["failed", "Chidi Nwosu"]]) {
      const ev = await fetch(sbUrl + "/rest/v1/activity_log", {
        method: "POST", headers: HP,
        body: JSON.stringify({
          event_type: "lead_response_automation",
          event_data: { client_id: clientA.id, automation_id: autoA.id, status, lead_name: lead, reason: status === "failed" ? "WhatsApp message timed out" : undefined },
        }),
      });
      const row = one(await ev.json());
      if (row?.id) actIds.push(row.id);
    }
    check("activity rows A seeded", actIds.length === 3);

    // Client B (fresh) + org + user + membership
    const cb = await fetch(sbUrl + "/rest/v1/clients", {
      method: "POST", headers: HP,
      body: JSON.stringify({ company_name: CO_B, contact_name: "QA Owner B", email: EMAIL_B, industry: "Healthcare", onboarding_status: "pending", status: "active" }),
    });
    clientB = one(await cb.json());
    orgB = await ensureOrg(CO_B, "qa-dash-b-" + TS, clientB.id);
    const ub = await fetch(sbUrl + "/auth/v1/admin/users", {
      method: "POST", headers: H,
      body: JSON.stringify({ email: EMAIL_B, password: PASSWORD, email_confirm: true }),
    });
    userB = one(await ub.json());
    await fetch(sbUrl + "/rest/v1/organization_memberships", {
      method: "POST", headers: HP,
      body: JSON.stringify({ user_id: userB.id, organization_id: orgB.id, role: "client", status: "active" }),
    });
    check("client B seeded fresh", !!clientB?.id && !!orgB?.id && !!userB?.id);

    // ---- BROWSER -----------------------------------------------------
    const browser = await puppeteer.launch({
      executablePath: CHROME, headless: "new",
      args: ["--no-sandbox", "--disable-dev-shm-usage"],
      defaultViewport: { width: 1440, height: 1000 },
    });

    async function loginAs(page, email) {
      for (let attempt = 0; attempt < 3; attempt++) {
        await page.goto(BASE + "/login", { waitUntil: "networkidle2", timeout: 60000 });
        await page.waitForSelector('input[type="email"]', { timeout: 15000 });
        await page.type('input[type="email"]', email, { delay: 10 });
        await page.type('input[type="password"]', PASSWORD, { delay: 10 });
        await page.evaluate(() => document.querySelector("form").requestSubmit());
        const moved = await Promise.race([
          page.waitForFunction(() => location.pathname !== "/login", { timeout: 25000 }).then(() => true).catch(() => false),
          sleep(26000).then(() => false),
        ]);
        if (moved) { await sleep(2500); return; }
        const err = await page.evaluate(() =>
          (document.body.innerText.match(/Too many login attempts|Invalid email or password|Email not confirmed/i) || [""])[0]
        );
        if (/Too many login attempts/i.test(err)) { console.log("  login rate-limited — waiting 70s"); await sleep(70000); continue; }
        console.log("  login did not redirect:", err || "(no error message)");
        await sleep(5000);
      }
    }

    // ---- Client A: desktop ----
    console.log("\n== CLIENT A (1440px) ==");
    const ctxA = await browser.createBrowserContext();
    const pageA = await ctxA.newPage();
    const logsA = [];
    pageA.on("console", (m) => logsA.push(m.type() + ": " + m.text()));
    pageA.on("pageerror", (e) => logsA.push("PAGEERROR: " + e.message));
    await loginAs(pageA, EMAIL_A);
    check("A lands on /dashboard", pageA.url().includes("/dashboard"));
    const textA = await pageA.evaluate(() => document.body.innerText);
    check("A sees company name", textA.includes(CO_A));
    check("A sees Needs your attention", textA.includes("Needs your attention"));
    check("A sees Email needs attention", textA.includes("Email needs attention"));
    check("A sees Reconnect action", textA.includes("Reconnect"));
    check("A sees system healthy", textA.includes("Healthy") && textA.includes("Lead Response System"));
    check("A sees real runs", textA.includes("3 runs") || textA.includes("· last"));
    check("A sees Leads handled outcome", textA.includes("Leads handled"));
    check("A sees Responses sent outcome", textA.includes("Responses sent"));
    check("A sees failed execution noted", textA.includes("failed"));
    check("A sees WhatsApp Connected", textA.includes("WhatsApp") && textA.includes("Connected"));
    check("A has NO fake 8s avg-response", !textA.includes("8s"));
    check("A sees recent activity", textA.includes("Recent activity"));
    check("A activity text present", textA.includes("Ada Obi") || textA.includes("response sent"));

    const errorsA = logsA.filter((l) => l.startsWith("PAGEERROR") || (l.startsWith("error:") && !l.includes("favicon")));
    check("A no console errors", errorsA.length === 0);
    if (errorsA.length) console.log(errorsA.slice(0, 4).join("\n"));

    // ---- Client A: mobile ----
    for (const w of [768, 375]) {
      await pageA.setViewport({ width: w, height: 900 });
      await sleep(700);
      const m = await pageA.evaluate(() => ({ w: innerWidth, sw: document.documentElement.scrollWidth }));
      check("A no horizontal overflow @ " + w + "px", m.sw <= m.w);
      const mt = await pageA.evaluate(() => document.body.innerText);
      check("A attention + system visible @ " + w + "px", mt.includes("Needs your attention") && mt.includes("Lead Response System"));
    }
    await pageA.screenshot({ path: "scripts/qa-dash-a.png" }).catch(() => {});

    // ---- Client B: isolation ----
    console.log("\n== CLIENT B (isolation) ==");
    const ctxB = await browser.createBrowserContext();
    const pageB = await ctxB.newPage();
    const logsB = [];
    pageB.on("console", (m) => logsB.push(m.type() + ": " + m.text()));
    pageB.on("pageerror", (e) => logsB.push("PAGEERROR: " + e.message));
    await loginAs(pageB, EMAIL_B);
    check("B lands on /dashboard", pageB.url().includes("/dashboard"));
    const textB = await pageB.evaluate(() => document.body.innerText);
    check("B sees own company name", textB.includes(CO_B));
    check("B does NOT see Client A data", !textB.includes(CO_A) && !textB.includes("Ada Obi") && !textB.includes("Email needs attention"));
    check("B sees empty state (systems on their way)", textB.includes("Your systems are on their way") || textB.includes("being set up"));
    for (const w of [768, 375]) {
      await pageB.setViewport({ width: w, height: 900 });
      await sleep(500);
      const m = await pageB.evaluate(() => ({ w: innerWidth, sw: document.documentElement.scrollWidth }));
      check("B no horizontal overflow @ " + w + "px", m.sw <= m.w);
    }
    const errorsB = logsB.filter((l) => l.startsWith("PAGEERROR") || (l.startsWith("error:") && !l.includes("favicon")));
    check("B no console errors", errorsB.length === 0);

    await ctxA.close();
    await ctxB.close();
    await browser.close();
  } catch (err) {
    console.log("QA CRASHED:", err.message);
    failed++;
  } finally {
    // ---- CLEANUP ----
    console.log("\n== CLEANUP ==");
    if (userA?.id) await fetch(sbUrl + "/auth/v1/admin/users/" + userA.id, { method: "DELETE", headers: H }).catch(() => {});
    if (userB?.id) await fetch(sbUrl + "/auth/v1/admin/users/" + userB.id, { method: "DELETE", headers: H }).catch(() => {});
    for (const id of actIds) await fetch(sbUrl + "/rest/v1/activity_log?id=eq." + id, { method: "DELETE", headers: H });
    for (const id of credIds) if (id) await fetch(sbUrl + "/rest/v1/integration_credentials?id=eq." + id, { method: "DELETE", headers: H });
    if (autoA?.id) await fetch(sbUrl + "/rest/v1/client_automations?id=eq." + autoA.id, { method: "DELETE", headers: H });
    if (orgA?.id) await fetch(sbUrl + "/rest/v1/organization_memberships?organization_id=eq." + orgA.id, { method: "DELETE", headers: H });
    if (orgB?.id) await fetch(sbUrl + "/rest/v1/organization_memberships?organization_id=eq." + orgB.id, { method: "DELETE", headers: H });
    if (orgA?.id) await fetch(sbUrl + "/rest/v1/organizations?id=eq." + orgA.id, { method: "DELETE", headers: H });
    if (orgB?.id) await fetch(sbUrl + "/rest/v1/organizations?id=eq." + orgB.id, { method: "DELETE", headers: H });
    if (clientA?.id) await fetch(sbUrl + "/rest/v1/clients?id=eq." + clientA.id, { method: "DELETE", headers: H });
    if (clientB?.id) await fetch(sbUrl + "/rest/v1/clients?id=eq." + clientB.id, { method: "DELETE", headers: H });
    console.log("  cleanup done");
  }
  console.log("\n=== RESULT: " + (failed === 0 ? "ALL PASS" : failed + " FAILURES") + " (" + passed + " passed) ===");
  process.exit(failed === 0 ? 0 : 1);
})();
