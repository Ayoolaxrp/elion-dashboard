// Attempt to drive the Google Calendar consent flow in a real Chrome window.
// Uses a fresh temp profile so it does not disturb the running Chrome.
// Logs into ELION admin, hits /api/bookings/oauth, then inspects where
// Google redirects. If Google shows a login/consent page, it's the manual
// step the owner must complete — we report the exact URL and stop.
// Usage: node scripts/qa-oauth-consent.cjs [--headed]
const path = require("path");
const fs = require("fs");
const os = require("os");
const puppeteer = require(path.join(__dirname, "..", "node_modules", "puppeteer-core"));

const BASE = "https://elion.com.ng";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const ADMIN_EMAIL = "awodeyiayoola@gmail.com";
const ADMIN_PASSWORD = "Ayoolamikun$123";
const headed = process.argv.includes("--headed");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "elion-oauth-"));
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: headed ? false : "new",
    userDataDir: profile,
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--window-size=1440,1000"],
    defaultViewport: { width: 1440, height: 1000 },
  });
  const page = await browser.newPage();

  // Capture any navigation to accounts.google.com
  let googleUrl = null;
  page.on("framenavigated", (f) => {
    const u = f.url();
    if (u.includes("accounts.google.com") && !googleUrl) googleUrl = u;
  });

  try {
    // 1. Login as admin
    await page.goto(BASE + "/login?redirect=/admin", { waitUntil: "networkidle2", timeout: 90000 });
    await page.waitForSelector('input[type="email"]', { timeout: 20000 });
    await page.type('input[type="email"]', ADMIN_EMAIL, { delay: 10 });
    await page.type('input[type="password"]', ADMIN_PASSWORD, { delay: 10 });
    await page.evaluate(() => { const f = document.querySelector("form"); if (f) f.requestSubmit(); });
    await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 30000 }).catch(() => {});
    await sleep(2500);
    console.log("admin on:", page.url());

    // 2. Go to the OAuth init directly (same as clicking Connect)
    await page.goto(BASE + "/api/bookings/oauth", { waitUntil: "domcontentloaded", timeout: 60000 });
    await sleep(4000);
    console.log("after oauth init, on:", page.url().slice(0, 120));
    if (googleUrl) {
      console.log("GOOGLE URL:", googleUrl.slice(0, 160));
    }

    // 3. Inspect the page: is it a Google login, a consent screen, or an error?
    const info = await page.evaluate(() => {
      const text = (document.body?.innerText || "").slice(0, 400).replace(/\s+/g, " ");
      return {
        title: document.title,
        text,
        hasGoogleForm: !!document.querySelector('input[type="email"]') || !!document.querySelector('input[type="password"]'),
        consentButtons: Array.from(document.querySelectorAll("button, [role=button]")).map((b) => (b.innerText || b.getAttribute("aria-label") || "").trim()).filter(Boolean).slice(0, 8),
      };
    });
    console.log("title:", info.title);
    console.log("hasGoogleForm:", info.hasGoogleForm);
    console.log("consent buttons:", JSON.stringify(info.consentButtons));
    console.log("text:", info.text.slice(0, 260));

    // Save a screenshot for the owner
    await page.screenshot({ path: path.join(__dirname, "..", "oauth-consent.png"), fullPage: false });
    console.log("screenshot saved: oauth-consent.png");

    // Decide verdict
    const onGoogle = page.url().includes("accounts.google.com");
    if (onGoogle && info.hasGoogleForm) {
      console.log("\nVERDICT: Google login required. This is the manual step — the owner must sign in to awodeyiayoola@gmail.com in this browser. Login form is visible; this headless process cannot enter the Google password.");
      console.log("To finish: run with --headed and complete sign-in, or open the URL below in a normal browser logged in as the owner:\n  " + page.url());
    } else if (onGoogle && info.consentButtons.some((b) => /continue|allow|choose|consent/i.test(b))) {
      console.log("\nVERDICT: Google consent screen reached (session present). Clicking allow...");
      const allowBtn = page.evaluate(() => {
        const els = Array.from(document.querySelectorAll("button, [role=button], input[type=submit]")).filter((b) => /allow|continue|choose an account/i.test((b.innerText || b.value || b.getAttribute("aria-label") || "")));
        return els.length ? els[0] : null;
      });
      if (allowBtn) await allowBtn.click();
      await sleep(5000);
      console.log("after consent, on:", page.url());
    } else if (!onGoogle) {
      console.log("\nVERDICT: Did not land on Google. Returned to:", page.url());
    } else {
      console.log("\nVERDICT: On Google but state unrecognized. Inspect screenshot.");
    }
  } catch (e) {
    console.log("ERROR:", String(e).slice(0, 300));
  } finally {
    await browser.close().catch(() => {});
    fs.rmSync(profile, { recursive: true, force: true });
  }
})();