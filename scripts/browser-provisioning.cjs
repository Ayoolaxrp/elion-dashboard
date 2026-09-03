// Browser QA: verify /admin/provisioning surfaces real client_automations rows from Supabase.
// Seeds one real client + automation via service role, checks the page renders it under
// "REAL" records (not the demo section), then cleans up.
//
// Usage: TEST_BASE=https://elion.com.ng node scripts/browser-provisioning.cjs
const fs = require("fs");
const path = require("path");

const puppeteer = require(path.join(__dirname, "..", "node_modules", "puppeteer-core"));
const { createClient } = require("@supabase/supabase-js");

// --- env ---
function loadEnv() {
  const envPath = path.join(__dirname, "..", ".env.local");
  const env = {};
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
    }
  }
  return env;
}
const env = loadEnv();
const BASE = process.env.TEST_BASE || "http://localhost:3000";
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_KEY;
const ADMIN_EMAIL = "awodeyiayoola@gmail.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Ayoolamikun$123";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const suffix = Date.now().toString(36);
const CLIENT_NAME = "Prov QA Client " + suffix;

let pass = 0, fail = 0;
const results = [];
function check(name, ok, extra) {
  if (ok) pass++; else fail++;
  results.push((ok ? "PASS" : "FAIL") + ": " + name + (extra ? " - " + extra : ""));
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  if (!SUPABASE_URL || !SERVICE_KEY) throw new Error("Supabase env missing in .env.local");
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

  const { data: template } = await supabase
    .from("workflow_templates").select("id, slug, name")
    .eq("slug", "lead_response").single();
  if (!template) throw new Error("lead_response template not found in DB");

  const { data: client, error: clientErr } = await supabase
    .from("clients")
    .insert({
      company_name: CLIENT_NAME,
      contact_name: "QA Person",
      email: "provqa-" + suffix + "@example.com",
    })
    .select("id").single();
  if (clientErr) throw new Error("seed client failed: " + clientErr.message);

  const { data: automation, error: autoErr } = await supabase
    .from("client_automations")
    .insert({
      client_id: client.id,
      template_id: template.id,
      custom_name: "Lead Response System",
      custom_config: { business_name: CLIENT_NAME, whatsapp_number: "+2348000000000" },
      status: "pending",
    })
    .select("id, status").single();
  if (autoErr) throw new Error("seed automation failed: " + autoErr.message);

  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
    args: ["--no-sandbox", "--window-size=1440,900"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  const consoleErrors = [];
  page.on("console", (msg) => { if (msg.type() === "error") consoleErrors.push(msg.text()); });
  page.on("pageerror", (err) => consoleErrors.push(String(err)));

  try {
    await page.goto(BASE + "/login", { waitUntil: "networkidle2", timeout: 60000 });
    await page.type('input[type="email"]', ADMIN_EMAIL, { delay: 10 });
    await page.type('input[type="password"]', ADMIN_PASSWORD, { delay: 10 });
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll("button")].find((b) =>
        /sign in|log in/i.test(b.textContent || ""));
      if (btn) btn.click();
    });
    await page.waitForFunction(
      () => location.pathname.startsWith("/admin"), { timeout: 30000 });
    const pathAfterLogin = await page.evaluate(() => location.pathname);
    check("logged in", true, pathAfterLogin);

    await page.goto(BASE + "/admin/provisioning", { waitUntil: "networkidle2", timeout: 60000 });
    await sleep(2500);

    const bodyText = await page.evaluate(() => document.body.innerText);
    check("provisioning page loaded", /provision/i.test(bodyText));

    check("real records section present",
      /real/i.test(bodyText) && /production|supabase|database/i.test(bodyText));

    check("seeded real client shown", bodyText.includes(CLIENT_NAME), CLIENT_NAME);
    check("seeded automation shown", /Lead Response System/i.test(bodyText));

    check("demo scenarios labeled", /demo|illustrative/i.test(bodyText));
    check("demo scenario A visible", /Client A|Lead Response/i.test(bodyText));

    check("real row status mapped (pending -> Not Started)", /not started/i.test(bodyText));

    const badApi = consoleErrors.filter((e) => /401|500|failed to fetch/i.test(e));
    check("no auth/server console errors", badApi.length === 0, badApi.slice(0, 3).join(" | ") || "none");

    await page.screenshot({ path: path.join(__dirname, "provisioning-final.png"), fullPage: true });
  } finally {
    await browser.close();
    await supabase.from("client_automations").delete().eq("id", automation.id);
    await supabase.from("clients").delete().eq("id", client.id);
    console.log("cleanup: deleted automation + client:", CLIENT_NAME);
  }

  console.log("\n" + results.join("\n"));
  console.log("\n=== RESULT: " + (fail === 0 ? "ALL PASS" : fail + " FAILED") + " (" + pass + " passed, " + fail + " failed) ===");
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => { console.error("FATAL:", e.message); process.exit(1); });
