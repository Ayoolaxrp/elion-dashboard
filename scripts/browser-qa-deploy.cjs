// Full add-client journey browser test at /admin/deploy (local dev, real Supabase).
// 1. Login as admin  2. Step 1 basic info  3. Step 2 select Lead Response
// 4. Step 3 fill config + connect provider  5. Step 4 activate
// 6. Verify success + deployment record + client created. Then cleanup.
const puppeteer = require("puppeteer-core");
const fs = require("fs");

const BASE = process.env.TEST_BASE || "http://localhost:3000";
const ADMIN_EMAIL = "awodeyiayoola@gmail.com";
const ADMIN_PASSWORD = "Ayoolamikun$123";
const TS = Date.now();
const COMPANY = "Browser QA Client " + TS;

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

// Locate the CONTROL for a label. Field layouts differ:
//   step 1 form:  <div><label/><input/></div>            -> input is label's next sibling
//   step 3 panel: <div class=space-y-1.5><div><label/></div><input/></div>
//                                                    -> input is label's parent's next sibling
async function fieldControl(page, labelPrefix) {
  const h = await page.$$("label");
  for (const lbl of h) {
    const text = await page.evaluate((el) => el.textContent.replace(/\*/g, "").trim(), lbl);
    if (text.startsWith(labelPrefix)) {
      const ctrl = await page.evaluateHandle((el) => {
        const TAGS = ["INPUT", "SELECT", "TEXTAREA", "DIV"];
        // look at the label's siblings first, then walk the header's following siblings
        const scan = (start) => {
          let n = start;
          for (let i = 0; n && i < 5; i++, n = n.nextElementSibling) {
            if (TAGS.includes(n.tagName)) return n;
          }
          return null;
        };
        return scan(el.nextElementSibling) || scan(el.parentElement?.nextElementSibling) || null;
      }, lbl);
      const kind = await ctrl.evaluate((el) => el ? el.tagName + (el.tagName === "INPUT" ? ":" + el.type : "") : "none");
      if (kind === "none") { console.log("  (no control next to " + labelPrefix + ")"); return null; }
      return ctrl;
    }
  }
  console.log("  (label not found: " + labelPrefix + ")");
  return null;
}

async function fillText(page, labelPrefix, value) {
  const ctrl = await fieldControl(page, labelPrefix);
  if (!ctrl) return false;
  const ok = await ctrl.evaluate((el) => el.tagName === "INPUT" && (el.type === "text" || el.type === "email"));
  if (!ok) { console.log("  (control not a text input: " + labelPrefix + ")"); return false; }
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
  await ctrl.type(value, { delay: 4 });
  return true;
}

async function fillNumber(page, labelPrefix, value) {
  const ctrl = await fieldControl(page, labelPrefix);
  if (!ctrl) return false;
  const ok = await ctrl.evaluate((el) => el.tagName === "INPUT" && el.type === "number");
  if (!ok) return false;
  await ctrl.click({ clickCount: 3 });
  await ctrl.type(String(value), { delay: 4 });
  return true;
}

async function pickSelect(page, labelPrefix, optionText) {
  const ctrl = await fieldControl(page, labelPrefix);
  if (!ctrl) return false;
  const ok = await ctrl.evaluate((el) => el.tagName === "SELECT");
  if (!ok) { console.log("  (control not a select: " + labelPrefix + ")"); return false; }
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
  console.log("  (chip not found: " + labelPrefix + " / " + optionText + ")");
  return false;
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
    executablePath: CHROME,
    headless: "new",
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--window-size=1440,1000"],
    defaultViewport: { width: 1440, height: 1000 },
  });
  const page = await browser.newPage();
  const logs = [];
  page.on("console", (m) => logs.push(m.type() + ": " + m.text()));
  page.on("pageerror", (e) => logs.push("PAGEERROR: " + e.message));

  try {
    // ---- LOGIN ----
    console.log("\n== LOGIN ==");
    await page.goto(BASE + "/login?redirect=/admin/deploy", { waitUntil: "networkidle2", timeout: 60000 });
    await page.waitForSelector('input[type="email"]', { timeout: 15000 });
    await page.type('input[type="email"]', ADMIN_EMAIL, { delay: 20 });
    await page.type('input[type="password"]', ADMIN_PASSWORD, { delay: 20 });
    // submit the form
    await page.evaluate(() => {
      const form = document.querySelector("form");
      if (form) form.requestSubmit();
    });
    await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 30000 }).catch(() => {});
    await sleep(2500);
    const url = page.url();
    check("login succeeded (now at " + url.replace(BASE, "") + ")", url.includes("/admin"));
    // Login lands on /admin by design; navigate to the deploy wizard
    await page.goto(BASE + "/admin/deploy", { waitUntil: "networkidle2", timeout: 60000 });
    await sleep(1500);
    const hasWizard = await page.evaluate(() => document.body.innerText.includes("Basic client information"));
    check("deploy wizard loaded (Basic client information visible)", hasWizard);

    // ---- STEP 1: basic client info ----
    console.log("\n== STEP 1: CLIENT INFO ==");
    await fillText(page, "Business name", COMPANY);
    await pickSelect(page, "Industry", "Real Estate");
    await fillText(page, "Website", "https://browser-qa.example.com");
    await fillText(page, "Contact person", "Browser QA Tester");
    await fillText(page, "Email", "browserqa" + TS + "@test.elion.local");
    await fillText(page, "Phone", "+234 800 123 4567");
    const contBtn = await buttonByText(page, "Continue");
    if (contBtn) { await contBtn.click(); await sleep(1200); } else check("continue button found", false);
    const step2 = await page.evaluate(() => document.body.innerText.includes("What should ELION deploy"));
    check("moved to step 2 (systems selection)", step2);

    // ---- STEP 2: select WhatsApp Lead Response ----
    console.log("\n== STEP 2: SELECT SYSTEM ==");
    const productBtn = await buttonByText(page, "WhatsApp Lead Response");
    if (productBtn) { await productBtn.click(); await sleep(800); } else check("product card found", false);
    const selCount = await page.evaluate(() => document.body.innerText.includes("1 selected"));
    check("product selected (1 selected badge)", selCount);
    const cfgBtn = await buttonByText(page, "Configure (1)");
    if (cfgBtn) { await cfgBtn.click(); await sleep(1000); } else check("configure button found", false);
    const step3 = await page.evaluate(() => document.body.innerText.includes("Only the fields required"));
    check("moved to step 3 (dynamic config)", step3);

    // ---- STEP 3: expand product + fill required config ----
    console.log("\n== STEP 3: CONFIGURATION ==");
    // the collapsible header is a <button> containing the product name + "config fields"
    const headers = await page.$$("button");
    for (const hb of headers) {
      const t = await page.evaluate((el) => el.textContent.trim().replace(/\s+/g, " "), hb);
      if (t.includes("WhatsApp Lead Response") && t.includes("config fields")) {
        await hb.click();
        await sleep(900);
        break;
      }
    }
    const panelOpen = await page.evaluate(() => document.body.innerText.includes("How the system represents the business"));
    check("product config panel expanded", panelOpen);
    // Business section
    await fillText(page, "Business name", COMPANY);
    await fillText(page, "Industry", "Real Estate");
    await fillText(page, "Business description", "Browser QA test business for the deploy flow end-to-end journey.");
    // WhatsApp section
    await fillText(page, "WhatsApp Business number", "+2348001234567");
    await pickSelect(page, "WhatsApp provider", "Meta Cloud API");
    await fillText(page, "Phone Number ID", "PNID-BROWSERQA-" + TS);
    await fillText(page, "WhatsApp Business Account ID", "WABA-BROWSERQA-" + TS);
    // Lead sources (multiselect chips)
    await clickChip(page, "Channels that send leads here", "Website");
    await clickChip(page, "Channels that send leads here", "Instagram");
    // Response rules
    await pickSelect(page, "Response mode", "Fixed template");
    await pickSelect(page, "Maximum response time", "Immediate");
    await fillText(page, "Business hours", "Mon-Fri 8:00 AM - 6:00 PM WAT");
    await pickSelect(page, "Outside business hours", "Send availability message");
    await fillTextarea(page, "First response message", "Hello {{name}}, thanks for reaching " + COMPANY + "! How can we help?");
    await fillText(page, "Human escalation WhatsApp number", "+2348007654321");
    // Follow-up
    await pickSelect(page, "First follow-up after", "24 hours");
    await fillNumber(page, "Maximum follow-ups", 3);
    await sleep(600);

    // Mark the required provider connected (Meta) — demo state toggle
    const providersVisible = await page.evaluate(() => document.body.innerText.includes("Provider connections"));
    check("provider connections panel visible", providersVisible);
    const connectedBtns = await page.$$("button");
    for (const b of connectedBtns) {
      const t = await page.evaluate((el) => el.textContent.trim(), b);
      if (t === "Connected") {
        const rowText = await page.evaluate((el) => el.parentElement?.parentElement?.textContent || "", b);
        if (rowText.includes("Meta")) { await b.click(); break; }
      }
    }
    await sleep(600);

    const reviewBtn = await buttonByText(page, "Review & deploy");
    if (reviewBtn) { await reviewBtn.click(); await sleep(1200); } else check("review & deploy button found", false);
    const step4 = await page.evaluate(() => document.body.innerText.includes("Deployment readiness"));
    check("moved to step 4 (readiness review)", step4);

    // ---- STEP 4: readiness + activate ----
    console.log("\n== STEP 4: READY + ACTIVATE ==");
    const readyBadge = await page.evaluate(() => document.body.innerText.includes("READY TO ACTIVATE"));
    check("product shows READY TO ACTIVATE", readyBadge);
    const stillBlocked = await page.evaluate(() => document.body.innerText.includes("CANNOT ACTIVATE YET"));
    check("no product is stuck on CANNOT ACTIVATE", !stillBlocked);

    const createBtn = await buttonByText(page, "Create client record");
    if (createBtn) { await createBtn.click(); await sleep(4000); } else check("create client record button found", false);

    const success = await page.evaluate(() => document.body.innerText.includes("Deployment queued"));
    check("success banner shown (Deployment queued)", success);
    const detail = await page.evaluate(() => {
      const m = document.body.innerText.match(/Client \+ systems created[\s\S]{0,40}?automation record/);
      return m ? m[0] : "";
    });
    const recordNote = await page.evaluate(() => document.body.innerText.includes("automation record") && document.body.innerText.includes("created in Supabase"));
    check("success detail mentions automation record created in Supabase", recordNote);

    // Verify in the deployments list
    const listShows = await page.evaluate((nm) => {
      const cards = Array.from(document.querySelectorAll("h3, p")).filter((el) => el.textContent.includes(nm));
      return cards.length > 0;
    }, COMPANY);
    check("deployment card lists the new client", listShows);
    const recordBadge = await page.evaluate((nm) => {
      const cards = Array.from(document.querySelectorAll("div")).filter((el) => el.textContent.includes(nm));
      return cards.some((el) => el.textContent.includes("automation record created in Supabase"));
    }, COMPANY);
    check("deployment card shows ✓ automation record created in Supabase", recordBadge);

    // ---- DB VERIFICATION ----
    console.log("\n== DB VERIFICATION ==");
    // find client in supabase via REST
    const restRes = await fetch(sbUrl + "/rest/v1/clients?select=id,company_name,email,onboarding_status&company_name=eq." + encodeURIComponent(COMPANY), {
      headers: { apikey: sbKey, Authorization: "Bearer " + sbKey },
    });
    const clients = await restRes.json();
    check("client row exists in Supabase", Array.isArray(clients) && clients.length === 1);
    let clientId = clients?.[0]?.id;
    if (clientId) {
      const autoRes = await fetch(sbUrl + "/rest/v1/client_automations?select=id,status,custom_config,workflow_templates(name)&client_id=eq." + clientId, {
        headers: { apikey: sbKey, Authorization: "Bearer " + sbKey },
      });
      const autos = await autoRes.json();
      check("client_automations row created", Array.isArray(autos) && autos.length === 1);
      if (autos?.[0]) {
        check("automation status is pending (not live)", autos[0].status === "pending");
        const cfg = autos[0].custom_config || {};
        check("custom_config persisted (business name matches)", cfg.business_name === COMPANY);
        check("custom_config persisted (whatsapp number matches)", cfg.whatsapp_number === "+2348001234567");
        check("template is Lead Response System", autos[0].workflow_templates?.name === "Lead Response System");
      }
      // cleanup
      await fetch(sbUrl + "/rest/v1/client_automations?id=eq." + autos[0].id, { method: "DELETE", headers: { apikey: sbKey, Authorization: "Bearer " + sbKey } });
      await fetch(sbUrl + "/rest/v1/clients?id=eq." + clientId, { method: "DELETE", headers: { apikey: sbKey, Authorization: "Bearer " + sbKey } });
      console.log("  CLEANUP: removed test client + automation row");
    }

    // console errors (ignore favicon/analytics noise)
    const errors = logs.filter((l) => l.startsWith("PAGEERROR") || (l.startsWith("error:") && !l.includes("favicon")));
    check("no console errors / page errors", errors.length === 0);
    if (errors.length) console.log(errors.slice(0, 5).join("\n"));
  } catch (err) {
    console.log("TEST CRASHED:", err.message);
    failed++;
  } finally {
    await page.screenshot({ path: "scripts/browser-qa-final.png", fullPage: false }).catch(() => {});
    await browser.close();
  }
  console.log("\n=== RESULT: " + (failed === 0 ? "ALL PASS" : failed + " FAILURES") + " (" + passed + " passed) ===");
  process.exit(failed === 0 ? 0 : 1);
})();
