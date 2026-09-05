// QA: reusable client provisioning on production APIs.
// Client A (Growth) gets Lead Response + Follow-Up + Booking instances
// and full Growth entitlements. Client B (Starter) gets only Lead Response.
// Verifies isolation, idempotency, honest readiness states. Cleans up.
// Usage: node scripts/qa-provisioning-reuse.cjs
const path = require("path");
const fs = require("fs");
const puppeteer = require(path.join(__dirname, "..", "node_modules", "puppeteer-core"));
const { createClient } = require(path.join(__dirname, "..", "node_modules", "@supabase/supabase-js"));

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
const uid = "qa-prov-" + Date.now();
const createdClientIds = [];

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: "new",
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
    defaultViewport: { width: 1440, height: 1000 },
  });
  const page = await browser.newPage();
  try {
    await page.goto(BASE + "/login?redirect=/admin", { waitUntil: "networkidle2", timeout: 90000 });
    await page.waitForSelector('input[type="email"]', { timeout: 20000 });
    await page.type('input[type="email"]', ADMIN_EMAIL, { delay: 10 });
    await page.type('input[type="password"]', ADMIN_PASSWORD, { delay: 10 });
    await page.evaluate(() => { const f = document.querySelector("form"); if (f) f.requestSubmit(); });
    await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 30000 }).catch(() => {});
    await sleep(2500);
    check("admin login", page.url().includes("/admin"), page.url());

    const anon = await browser.createBrowserContext();
    const anonPage = await anon.newPage();
    await anonPage.goto(BASE + "/", { waitUntil: "domcontentloaded", timeout: 60000 });
    for (const ep of ["/api/admin/provision", "/api/admin/automations", "/api/admin/clients"]) {
      const st = await anonPage.evaluate(async (u) => (await fetch(u)).status, ep);
      check(`anonymous ${ep} -> 401`, st === 401, `status=${st}`);
    }
    await anon.close();

    const api = async (url, opts = {}) =>
      page.evaluate(async ({ u, o }) => {
        const r = await fetch("https://elion.com.ng" + u, {
          method: o.method || "GET",
          headers: { "Content-Type": "application/json", ...(o.headers || {}) },
          body: o.body ? JSON.stringify(o.body) : undefined,
        });
        let j = null;
        try { j = await r.json(); } catch {}
        return { status: r.status, body: j };
      }, { u: url, o: opts });

    // ---- CLIENT A (Growth) ----
    console.log("\n== CLIENT A: Growth real-estate ==");
    const a = await api("/api/admin/clients", { method: "POST", body: {
      company_name: "QA Reuse Realty A " + uid,
      contact_name: "QA Client A",
      email: "qa-reuse-a-" + uid + "@elionqa.test",
      industry: "Real Estate",
      plan_name: "Growth",
    }});
    check("client A created", a.status === 200 && a.body?.client?.id, a.status);
    const clientA = a.body.client;
    createdClientIds.push(clientA.id);

    const aInst = await api("/api/admin/provision?client_id=" + clientA.id);
    const aRows = aInst.body?.automations || [];
    const aSlugs = aRows.map((r) => r.template_slug).sort();
    check("Client A has exactly Growth instances (booking,follow_up,lead_response)",
      aRows.length === 3 && aSlugs.join(",") === "booking,follow_up,lead_response", aSlugs.join(","));
    check("Client A rows derive to needs_configuration",
      aRows.every((r) => r.derived_state === "needs_configuration"), aRows.map((r) => r.derived_state).join(","));
    check("Client A plan label Growth", aRows.every((r) => r.plan === "Growth"), aRows[0]?.plan);

    const { data: entA } = await sb.from("client_entitlements").select("features(key)").eq("client_id", clientA.id);
    const entKeysA = (entA || []).map((e) => e.features.key);
    check("Client A has lead_response entitlement", entKeysA.includes("lead_response"), entKeysA.length + " entitlements");
    check("Client A has booking entitlement", entKeysA.includes("booking_scheduling"));
    check("Client A does NOT have revenue_recovery", !entKeysA.includes("lead_recovery"));

    // ---- CLIENT B (Starter) ----
    console.log("\n== CLIENT B: Starter ==");
    const b = await api("/api/admin/clients", { method: "POST", body: {
      company_name: "QA Reuse Realty B " + uid,
      contact_name: "QA Client B",
      email: "qa-reuse-b-" + uid + "@elionqa.test",
      industry: "Real Estate",
      plan_name: "Starter",
    }});
    check("client B created", b.status === 200 && b.body?.client?.id, b.status);
    const clientB = b.body.client;
    createdClientIds.push(clientB.id);

    const bInst = await api("/api/admin/provision?client_id=" + clientB.id);
    const bRows = bInst.body?.automations || [];
    check("Client B has exactly Starter instance (lead_response only)",
      bRows.length === 1 && bRows[0].template_slug === "lead_response", bRows.map((r) => r.template_slug).join(","));
    check("Client B does NOT have follow_up", !bRows.some((r) => r.template_slug === "follow_up"));

    // ---- ISOLATION ----
    const aOnly = await api("/api/admin/provision?client_id=" + clientA.id);
    const aIds = (aOnly.body?.automations || []).map((r) => r.automation_id);
    const bOnly = await api("/api/admin/provision?client_id=" + clientB.id);
    const bIds = (bOnly.body?.automations || []).map((r) => r.automation_id);
    const overlap = aIds.filter((x) => bIds.includes(x));
    check("Client A and B automation instances are isolated", overlap.length === 0, overlap.join(",") || "no overlap");

    // ---- IDEMPOTENCY ----
    console.log("\n== Idempotency ==");
    const dep1 = await api("/api/admin/deploy", { method: "POST", body: {
      client_id: clientA.id,
      products: [{ template_slug: "lead_response" }, { template_slug: "booking" }],
    }});
    const dep2 = await api("/api/admin/deploy", { method: "POST", body: {
      client_id: clientA.id,
      products: [{ template_slug: "lead_response" }, { template_slug: "booking" }],
    }});
    check("deploy runs succeed", dep1.status === 200 && dep2.status === 200);
    const again = await api("/api/admin/provision?client_id=" + clientA.id);
    check("re-deploy created no duplicate instances", (again.body?.automations || []).length === 3, "count=" + (again.body?.automations || []).length);

    const provAll = await api("/api/admin/provision", { method: "POST", body: { client_id: clientA.id } });
    check("provision-all returns results", Array.isArray(provAll.body?.results), provAll.status);
    const blockedCount = (provAll.body?.results || []).filter((x) => !x.success).length;
    check("provision-all blocks (config missing) not live", blockedCount >= 1, "blocked=" + blockedCount);
    const afterProv = await api("/api/admin/provision?client_id=" + clientA.id);
    check("no automation falsely live after blocked provision", (afterProv.body?.automations || []).every((r) => r.status !== "live"));

    const firstId = (afterProv.body?.automations || [])[0]?.automation_id;
    if (firstId) {
      const badActivate = await api("/api/admin/automations", { method: "PATCH", body: { automation_id: firstId, action: "activate" } });
      check("activate from pending rejected (4xx)", badActivate.status >= 400 && badActivate.status < 500, "status=" + badActivate.status);
      const badPause = await api("/api/admin/automations", { method: "PATCH", body: { automation_id: firstId, action: "pause" } });
      check("pause non-live rejected (4xx)", badPause.status >= 400 && badPause.status < 500, "status=" + badPause.status);
    }
  } catch (err) {
    console.error("QA error:", err);
    fail++;
  } finally {
    console.log("\n== CLEANUP ==");
    for (const cid of createdClientIds) {
      const { error } = await sb.from("clients").delete().eq("id", cid);
      console.log("cleanup client " + cid.slice(0, 8) + ": " + (error ? error.message : "deleted"));
    }
    const { data: leftover } = await sb.from("clients").select("id").like("company_name", "QA Reuse Realty%");
    console.log("leftover QA clients:", leftover?.length ?? 0);
    await browser.close();
    console.log("\nRESULT: " + pass + " passed, " + fail + " failed");
    process.exit(fail > 0 ? 1 : 0);
  }
})();
