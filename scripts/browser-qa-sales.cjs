// AI Sales Agent deploy journey: verifies the agent product can be selected,
// configured (qualification, claims, objections, escalation), validated and
// provisioned from the admin Deploy wizard — with real client + automation rows.
const puppeteer = require("puppeteer-core");
const fs = require("fs");

const BASE = process.env.TEST_BASE || "https://elion.com.ng";
const ADMIN_EMAIL = "awodeyiayoola@gmail.com";
const ADMIN_PASSWORD = "Ayoolamikun$123";
const TS = Date.now();
const COMPANY = "Sales QA Client " + TS;
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";

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

let passed = 0, failed = 0;
function check(label, cond) {
  console.log((cond ? "  PASS: " : "  FAIL: ") + label);
  if (cond) passed++; else failed++;
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fieldControl(page, labelPrefix) {
  const h = await page.$$("label");
  for (const lbl of h) {
    const text = await page.evaluate((el) => el.textContent.replace(/\*/g, "").trim(), lbl);
    if (text.startsWith(labelPrefix)) {
      return page.evaluateHandle((el) => {
        const TAGS = ["INPUT", "SELECT", "TEXTAREA", "DIV", "BUTTON"];
        const scan = (start) => {
          let n = start;
          for (let i = 0; n && i < 6; i++, n = n.nextElementSibling) {
            if (TAGS.includes(n.tagName)) return n;
          }
          return null;
        };
        return scan(el.nextElementSibling) || scan(el.parentElement?.nextElementSibling) || null;
      }, lbl);
    }
  }
  return null;
}
async function fillText(page, labelPrefix, value) {
  const ctrl = await fieldControl(page, labelPrefix);
  if (!ctrl) return false;
  const ok = await ctrl.evaluate((el) => el.tagName === "INPUT" && (el.type === "text" || el.type === "email" || el.type === "tel"));
  if (!ok) return false;
  await ctrl.click({ clickCount: 3 });
  await ctrl.type(value, { delay: 8 });
  return true;
}
async function fillTextarea(page, labelPrefix, value) {
  const ctrl = await fieldControl(page, labelPrefix);
  if (!ctrl) return false;
  const ok = await ctrl.evaluate((el) => el.tagName === "TEXTAREA");
  if (!ok) return false;
  await ctrl.click();
  await ctrl.type(value, { delay: 3 });
  return true;
}
async function pickSelect(page, labelPrefix, optionText) {
  const ctrl = await fieldControl(page, labelPrefix);
  if (!ctrl) return false;
  const ok = await ctrl.evaluate((el) => el.tagName === "SELECT");
  if (!ok) return false;
  await ctrl.select(optionText);
  return true;
}
async function clickChip(page, labelPrefix, optionText) {
  const ctrl = await fieldControl(page, labelPrefix);
  if (!ctrl) return false;
  const btns = await ctrl.$$("button");
  for (const b of btns) {
    const t = await page.evaluate((el) => el.textContent.trim(), b);
    if (t.includes(optionText)) { await b.click(); return true; }
  }
  return false;
}
// Boolean toggle rows render as a <button> whose label is its own text
// ("Enabled"/"Disabled"). Click the control under the given label to enable.
async function clickBool(page, labelPrefix) {
  const ctrl = await fieldControl(page, labelPrefix);
  if (!ctrl) return false;
  const ok = await ctrl.evaluate((el) => el.tagName === "BUTTON" || el.tagName === "DIV");
  if (!ok) return false;
  const txt = await ctrl.evaluate((el) => el.textContent.trim());
  if (!txt.includes("Disabled")) return true; // already enabled
  await ctrl.click();
  return true;
}
async function buttonByText(page, text) {
  const btns = await page.$$("button");
  for (const b of btns) {
    const t = await page.evaluate((el) => el.textContent.trim().replace(/\s+/g, " "), b);
    if (t.includes(text)) return b;
  }
  return null;
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: "new",
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
    defaultViewport: { width: 1440, height: 1100 },
  });
  const page = await browser.newPage();
  const logs = [];
  page.on("console", (m) => logs.push(m.type() + ": " + m.text()));
  page.on("pageerror", (e) => logs.push("PAGEERROR: " + e.message));

  try {
    // ---- LOGIN ----
    console.log("\n== LOGIN ==");
    await page.goto(BASE + "/login", { waitUntil: "networkidle2", timeout: 60000 });
    await page.waitForSelector('input[type="email"]', { timeout: 15000 });
    await page.type('input[type="email"]', ADMIN_EMAIL, { delay: 15 });
    await page.type('input[type="password"]', ADMIN_PASSWORD, { delay: 15 });
    await page.evaluate(() => document.querySelector("form").requestSubmit());
    await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 30000 }).catch(() => {});
    await sleep(2500);
    check("logged in (at " + page.url().replace(BASE, "") + ")", page.url().includes("/admin"));
    await page.goto(BASE + "/admin/deploy", { waitUntil: "networkidle2", timeout: 60000 });
    await sleep(1500);

    // ---- STEP 1 ----
    console.log("\n== STEP 1: CLIENT INFO ==");
    await fillText(page, "Business name", COMPANY);
    await pickSelect(page, "Industry", "Real Estate");
    await fillText(page, "Website", "https://sales-qa.example.com");
    await fillText(page, "Contact person", "Sales QA Tester");
    await fillText(page, "Email", "salesqa" + TS + "@test.elion.local");
    await fillText(page, "Phone", "+234 800 777 8888");
    const cont = await buttonByText(page, "Continue");
    if (cont) { await cont.click(); await sleep(1200); }
    check("step 1 -> step 2", await page.evaluate(() => document.body.innerText.includes("What should ELION deploy")));

    // ---- STEP 2: select AI Sales Agent ----
    console.log("\n== STEP 2: SELECT AI SALES AGENT ==");
    const card = await buttonByText(page, "AI Sales Agent");
    check("AI Sales Agent card present in wizard", !!card);
    if (card) { await card.click(); await sleep(800); }
    check("1 system selected", await page.evaluate(() => document.body.innerText.includes("1 selected")));
    const cfg = await buttonByText(page, "Configure (1)");
    if (cfg) { await cfg.click(); await sleep(1000); }
    check("step 3 config shown", await page.evaluate(() => document.body.innerText.includes("Only the fields required")));

    // ---- STEP 3: expand + fill sales agent config ----
    console.log("\n== STEP 3: SALES AGENT CONFIGURATION ==");
    const headers = await page.$$("button");
    for (const hb of headers) {
      const t = await page.evaluate((el) => el.textContent.trim().replace(/\s+/g, " "), hb);
      if (t.includes("AI Sales Agent") && t.includes("config fields")) { await hb.click(); await sleep(900); break; }
    }
    check("config panel expanded", await page.evaluate(() => document.body.innerText.includes("What the agent is selling and to whom")));

    await fillTextarea(page, "Offer summary", "Luxury and commercial real estate agency in Lagos selling and letting properties.");
    await fillTextarea(page, "Target customer", "Professionals and diaspora buyers looking for property in Lagos.");
    await fillTextarea(page, "Qualification criteria", "Budget above N50m, timeline under 6 months, interested in Lagos.");
    await fillTextarea(page, "Approved claims", "Free site inspection, verified titles, 2% agency fee.");
    await fillTextarea(page, "Disallowed claims", "Never promise rental yield percentages or guaranteed ROI.");
    await clickBool(page, "Objection handling");
    await pickSelect(page, "Minimum lead quality", "Qualified only");
    await clickBool(page, "Can book meetings");
    await fillText(page, "Human sales WhatsApp", "+2348003334444");
    await clickChip(page, "Escalation triggers", "High-value lead detected");
    await clickChip(page, "Escalation triggers", "Customer requests human");
    await sleep(600);

    // Connect the REQUIRED provider (AI model provider)
    const connectedBtns = await page.$$("button");
    for (const b of connectedBtns) {
      const t = await page.evaluate((el) => el.textContent.trim(), b);
      if (t === "Connected") {
        const rowText = await page.evaluate((el) => el.parentElement?.parentElement?.textContent || "", b);
        if (rowText.includes("AI model provider")) { await b.click(); break; }
      }
    }
    await sleep(600);
    const review = await buttonByText(page, "Review & deploy");
    if (review) { await review.click(); await sleep(1200); }
    check("step 4 readiness review", await page.evaluate(() => document.body.innerText.includes("Deployment readiness")));

    // ---- STEP 4 ----
    console.log("\n== STEP 4: READY + ACTIVATE ==");
    check("READY TO ACTIVATE shown", await page.evaluate(() => document.body.innerText.includes("READY TO ACTIVATE")));
    const createBtn = await buttonByText(page, "Create client record");
    if (createBtn) { await createBtn.click(); await sleep(4000); }
    check("success banner", await page.evaluate(() => document.body.innerText.includes("Deployment queued")));
    check("automation record created in Supabase noted", await page.evaluate(() => document.body.innerText.includes("automation record") && document.body.innerText.includes("created in Supabase")));

    // ---- DB VERIFICATION ----
    console.log("\n== DB VERIFICATION ==");
    const H = { apikey: sbKey, Authorization: "Bearer " + sbKey };
    const rest = await fetch(sbUrl + "/rest/v1/clients?select=id,company_name&company_name=eq." + encodeURIComponent(COMPANY), { headers: H });
    const clients = await rest.json();
    check("client row exists", Array.isArray(clients) && clients.length === 1);
    const clientId = clients?.[0]?.id;
    let autoId = null;
    if (clientId) {
      const autoRes = await fetch(
        sbUrl + "/rest/v1/client_automations?select=id,status,custom_config,workflow_templates(name,slug)&client_id=eq." + clientId,
        { headers: H }
      );
      const autos = await autoRes.json();
      check("automation row created", Array.isArray(autos) && autos.length === 1);
      if (autos?.[0]) {
        autoId = autos[0].id;
        check("status pending (not live)", autos[0].status === "pending");
        check("template auto-created: ai_sales_agent", autos[0].workflow_templates?.slug === "ai_sales_agent");
        check("template name AI Sales Agent", autos[0].workflow_templates?.name === "AI Sales Agent");
        const cfg = autos[0].custom_config || {};
        check("config persisted (offer summary)", typeof cfg.offer_summary === "string" && cfg.offer_summary.includes("real estate"));
        check("config persisted (disallowed claims)", typeof cfg.disallowed_claims === "string" && cfg.disallowed_claims.includes("yield"));
        check("config persisted (min lead quality)", cfg.lead_quality_min === "Qualified only");
        check("config persisted (objection handling enabled)", cfg.objection_handling === true);
        check("config persisted (human escalation)", cfg.human_number === "+2348003334444");
        check("config persisted (escalation triggers)", Array.isArray(cfg.escalation_triggers) && cfg.escalation_triggers.includes("Customer requests human"));
      }
      const tpl = await fetch(sbUrl + "/rest/v1/workflow_templates?select=id,slug,category&slug=eq.ai_sales_agent", { headers: H });
      const tpls = await tpl.json();
      check("workflow_templates row exists for ai_sales_agent", Array.isArray(tpls) && tpls.length === 1);
    }

    // cleanup
    if (autoId) await fetch(sbUrl + "/rest/v1/client_automations?id=eq." + autoId, { method: "DELETE", headers: H });
    if (clientId) await fetch(sbUrl + "/rest/v1/clients?id=eq." + clientId, { method: "DELETE", headers: H });
    const tplDel = await fetch(sbUrl + "/rest/v1/workflow_templates?slug=eq.ai_sales_agent", { method: "DELETE", headers: H });
    console.log("  cleanup status:", "auto:", autoId ? "deleted" : "n/a", "client:", clientId ? "deleted" : "n/a", "template:", tplDel.status);
    await page.screenshot({ path: "scripts/sales-qa-final.png" }).catch(() => {});

    const errors = logs.filter((l) => l.startsWith("PAGEERROR") || (l.startsWith("error:") && !l.includes("favicon")));
    check("no console/page errors", errors.length === 0);
    if (errors.length) console.log(errors.slice(0, 5).join("\n"));
  } catch (err) {
    console.log("TEST CRASHED:", err.message);
    failed++;
  } finally {
    await browser.close();
  }
  console.log("\n=== RESULT: " + (failed === 0 ? "ALL PASS" : failed + " FAILURES") + " (" + passed + " passed) ===");
  process.exit(failed === 0 ? 0 : 1);
})();
