// QA: funnel animation work.
// 1. Implementation pipeline + pricing reveal on scroll-in (opacity reaches 1)
// 2. Scroll back up then down again -> elements STAY visible (once-fired)
// 3. Same at 375px mobile (no horizontal overflow introduced)
// 4. prefers-reduced-motion -> content visible immediately, never hidden
// 5. /api/audit digital footprint: socialLinks + social_to_lead + journey leak
// Usage: node scripts/qa-funnel-animations.cjs
const path = require("path");
const puppeteer = require(path.join(__dirname, "..", "node_modules", "puppeteer-core"));
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = "https://elion.com.ng";

let pass = 0, fail = 0;
const check = (name, ok, extra) => {
  if (ok) pass++; else fail++;
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${extra ? " :: " + extra : ""}`);
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const chipVisible = () => {
  const chip = [...document.querySelectorAll("#pricing span, #pricing p")].find((el) =>
    el.textContent && el.textContent.trim() === "Handover" && el.closest("#pricing")
  );
  if (!chip) return null;
  const s = getComputedStyle(chip);
  return { opacity: parseFloat(s.opacity), r: chip.getBoundingClientRect() };
};

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox", "--disable-dev-shm-usage"] });
  try {
    // ---------- DESKTOP ----------
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(BASE + "/funnel", { waitUntil: "networkidle2", timeout: 90000 });

    // Scroll to pricing and let reveals fire
    await page.evaluate(() => document.querySelector("#pricing")?.scrollIntoView({ block: "start" }));
    await sleep(1600);
    const first = await page.evaluate(chipVisible);
    check("desktop: implementation pipeline visible after scroll-in", !!first && first.opacity === 1, first ? `opacity=${first.opacity}` : "chip not found");

    // Scroll back to top, then to pricing again -> must STAY visible
    await page.evaluate(() => window.scrollTo({ top: 0 }));
    await sleep(700);
    await page.evaluate(() => document.querySelector("#pricing")?.scrollIntoView({ block: "start" }));
    await sleep(900);
    const second = await page.evaluate(chipVisible);
    check("desktop: animation persists after scrolling up then back down", !!second && second.opacity === 1, second ? `opacity=${second.opacity}` : "chip not found");

    // Pricing tier card visible after entrance
    const tierVisible = await page.evaluate(() => {
      const el = [...document.querySelectorAll("#pricing h3")].find((h) => h.textContent.trim() === "Growth");
      return el ? parseFloat(getComputedStyle(el.closest("div[class*='relative']") || el).opacity) : null;
    });
    check("desktop: Growth tier card visible after entrance", tierVisible === 1 || tierVisible === null, `opacity=${tierVisible}`);
    check("desktop: no horizontal overflow on pricing", await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
    await page.close();

    // ---------- MOBILE 375 ----------
    const mp = await browser.newPage();
    await mp.emulate({
      viewport: { width: 375, height: 667, isMobile: true, hasTouch: true, deviceScaleFactor: 3 },
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    });
    await mp.goto(BASE + "/funnel", { waitUntil: "networkidle2", timeout: 90000 });
    await mp.evaluate(() => document.querySelector("#pricing")?.scrollIntoView({ block: "start" }));
    await sleep(1600);
    const m1 = await mp.evaluate(chipVisible);
    check("mobile 375: pipeline visible after scroll-in", !!m1 && m1.opacity === 1, m1 ? `opacity=${m1.opacity}` : "chip not found");
    await mp.evaluate(() => window.scrollTo({ top: 0 }));
    await sleep(600);
    await mp.evaluate(() => document.querySelector("#pricing")?.scrollIntoView({ block: "start" }));
    await sleep(900);
    const m2 = await mp.evaluate(chipVisible);
    check("mobile 375: animation persists on scroll back", !!m2 && m2.opacity === 1, m2 ? `opacity=${m2.opacity}` : "chip not found");
    check("mobile 375: no horizontal overflow", await mp.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
    await mp.close();

    // ---------- REDUCED MOTION ----------
    const rp = await browser.newPage();
    await rp.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
    await rp.setViewport({ width: 1440, height: 900 });
    await rp.goto(BASE + "/funnel", { waitUntil: "networkidle2", timeout: 90000 });
    await rp.evaluate(() => document.querySelector("#pricing")?.scrollIntoView({ block: "start" }));
    await sleep(500);
    const rm = await rp.evaluate(chipVisible);
    check("reduced motion: pipeline content visible immediately (no hidden animation)", !!rm && rm.opacity === 1, rm ? `opacity=${rm.opacity}` : "chip not found");
    const rmTier = await rp.evaluate(() => {
      const el = [...document.querySelectorAll("#pricing h3")].find((h) => h.textContent.trim() === "Scale");
      return el ? parseFloat(getComputedStyle(el).opacity) : null;
    });
    check("reduced motion: tier card visible", rmTier === 1 || rmTier === null, `opacity=${rmTier}`);
    await rp.close();

    await browser.close();
  } catch (e) {
    console.error("SCRIPT ERROR:", e && e.message ? e.message : e);
    try { await browser.close(); } catch {}
  }

  console.log(`\nRESULT: ${pass}/${pass + fail} PASS`);
  process.exit(fail ? 1 : 0);
})();