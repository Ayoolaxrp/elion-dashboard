// UI verification for the audit page upgrade: the new "What this audit
// checked" panel, per-category states, and honest wording.
// Usage: node tests/audit/run-ui.mjs <base-url>
const { chromium } = require("playwright");

const BASE = process.argv[2] || "http://localhost:3001";
let pass = 0;
const failures = [];
const check = (name, cond, detail) => {
  if (cond) { pass++; console.log(`PASS  ${name}`); }
  else { failures.push(name); console.log(`FAIL  ${name}${detail ? " :: " + detail : ""}`); }
};

(async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const consoleErrors = [];
    page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text()); });

    await page.goto(BASE + "/audit", { waitUntil: "domcontentloaded", timeout: 30000 });

    // Run a real audit through the UI against a known-good site.
    // The audit form: company input placeholder "e.g. Lagos Real Estate Agency",
    // website input "e.g. business.com.ng". Submit button is type=button with
    // onClick=runAudit (no form submit).
    let companyInput = null, websiteInput = null;
    for (const i of await page.$$("input")) {
      const ph = (await i.getAttribute("placeholder")) || "";
      if (ph.includes("Lagos Real Estate")) companyInput = i;
      if (ph.includes("business.com.ng")) websiteInput = i;
    }
    check("ui: company + website inputs found", Boolean(companyInput && websiteInput));
    if (companyInput) await companyInput.fill("Mozilla");
    if (websiteInput) await websiteInput.fill("https://www.mozilla.org");

    // Click the run-audit button (the one directly after the website field)
    let clicked = false;
    for (const b of await page.$$("button")) {
      const t = ((await b.textContent()) || "").toLowerCase();
      if (/run (free )?(business )?audit|analyze|scan/.test(t) && !/request|modal/.test(t)) {
        const vis = await b.isVisible();
        if (vis) { await b.click(); clicked = true; break; }
      }
    }
    check("ui: run-audit button clicked", clicked);
    try {
      await page.waitForSelector("text=What this audit checked", { timeout: 90000 });
      check("ui: 'What this audit checked' panel appears", true);
    } catch {
      check("ui: 'What this audit checked' panel appears", false, "panel not found after audit");
    }

    // Panel content checks (only if panel appeared)
    const panelText = await page.content();
    check("ui: page-count wording present", /page(s)? inspected/.test(panelText));
    check("ui: honest-footer disclaimer present", /public evidence on the pages successfully inspected/.test(panelText));
    check("ui: categories rendered", ["WhatsApp", "Email", "Phone", "Online booking", "CRM"].every((k) => panelText.includes(k)));
    check("ui: no raw JSON on page", !/"status":\s*"(found|not_found)"/.test(panelText));

    // Honest wording: unreachable site case shows could-not-verify, not fake findings
    // (already covered by API-level tests; here we check the page loaded cleanly)
    check("ui: zero console errors", consoleErrors.length === 0, consoleErrors.slice(0, 2).join(" | "));

    // Mobile viewport sanity
    const mobile = await browser.newPage({ viewport: { width: 375, height: 812 } });
    await mobile.goto(BASE + "/audit", { waitUntil: "domcontentloaded", timeout: 30000 });
    const overflow = await mobile.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    check("ui: mobile 375px no horizontal overflow", !overflow);
    await mobile.close();
  } finally {
    await browser.close();
  }

  console.log(`\n${pass}/${pass + failures.length} UI tests passed`);
  if (failures.length) { console.log("Failed:", failures.join(" | ")); process.exit(1); }
})();
