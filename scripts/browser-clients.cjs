// Verify /admin/clients renders the real client list after the auth fix.
const puppeteer = require("puppeteer-core");
const BASE = process.env.TEST_BASE || "https://elion.com.ng";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let passed = 0, failed = 0;
function check(label, cond) {
  console.log((cond ? "  PASS: " : "  FAIL: ") + label);
  if (cond) passed++; else failed++;
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: "new",
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
    defaultViewport: { width: 1440, height: 1000 },
  });
  const page = await browser.newPage();
  const errors = [];
  page.on("response", (r) => { if (r.status() >= 400 && !r.url().includes("favicon")) errors.push(r.status() + " " + r.url()); });
  page.on("pageerror", (e) => errors.push("PAGEERROR " + e.message));

  try {
    // Login
    await page.goto(BASE + "/login", { waitUntil: "networkidle2", timeout: 60000 });
    await page.waitForSelector('input[type="email"]', { timeout: 15000 });
    await page.type('input[type="email"]', "awodeyiayoola@gmail.com", { delay: 15 });
    await page.type('input[type="password"]', "Ayoolamikun$123", { delay: 15 });
    await page.evaluate(() => document.querySelector("form").requestSubmit());
    await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 30000 }).catch(() => {});
    await sleep(2500);
    check("logged in (at " + page.url().replace(BASE, "") + ")", page.url().includes("/admin"));

    // Go to clients list
    await page.goto(BASE + "/admin/clients", { waitUntil: "networkidle2", timeout: 60000 });
    await sleep(3000);

    const url = page.url();
    check("on /admin/clients (now at " + url.replace(BASE, "") + ")", url.includes("/admin/clients"));

    // The page header + count
    const header = await page.evaluate(() => document.body.innerText.includes("Clients"));
    check("Clients page header rendered", header);

    // Did the API return real data? The page shows a count "N clients" when loaded
    const countMatch = await page.evaluate(() => {
      const m = document.body.innerText.match(/(\d+)\s+clients/);
      return m ? parseInt(m[1], 10) : -1;
    });
    check("client count badge shows real number (got " + countMatch + ")", countMatch >= 0);
    check("client list has at least one client row", countMatch > 0);

    // No empty-state error and no "Unauthorized" text
    const authErr = await page.evaluate(() => document.body.innerText.includes("Unauthorized") || document.body.innerText.includes("Failed to load"));
    check("no auth/load error text on page", !authErr);

    // Verify a known client appears (Test Properties / E2E / Awodeyi)
    const known = await page.evaluate(() => {
      const t = document.body.innerText;
      return /Test Properties|Awodeyi|E2E Test|Browser QA/.test(t);
    });
    check("known client names visible in list", known);

    // The "New Client + Deploy" CTA should link to /admin/deploy
    const cta = await page.evaluate(() => {
      const a = Array.from(document.querySelectorAll("a")).find((x) => x.textContent.includes("New Client + Deploy"));
      return a ? a.getAttribute("href") : null;
    });
    check("New Client + Deploy CTA present and points to deploy flow", cta === "/admin/deploy");

    // Screenshot for the record
    await page.screenshot({ path: "scripts/clients-list.png" });
    console.log("  screenshot: scripts/clients-list.png");

    // Console/HTTP errors on this page
    const relevant = errors.filter((e) => e.includes("/api/admin/clients") || e.includes("PAGEERROR") || e.includes("500"));
    check("no HTTP 500s / page errors on clients page", relevant.length === 0);
    if (relevant.length) console.log(relevant.slice(0, 5).join("\n"));
  } catch (err) {
    console.log("TEST CRASHED:", err.message);
    failed++;
  } finally {
    await browser.close();
  }
  console.log("\n=== RESULT: " + (failed === 0 ? "ALL PASS" : failed + " FAILURES") + " (" + passed + " passed) ===");
  process.exit(failed === 0 ? 0 : 1);
})();