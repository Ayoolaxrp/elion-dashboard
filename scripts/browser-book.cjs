// Browser QA: /landing/book renders (landing shell) + truthful not-connected state.
// Usage: node scripts/browser-book.cjs
const path = require("path");
const puppeteer = require(path.join(__dirname, "..", "node_modules", "puppeteer-core"));
const BASE = "https://elion.com.ng";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";

let pass = 0, fail = 0;
const check = (name, ok, extra) => {
  if (ok) pass++; else fail++;
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${extra ? " :: " + extra : ""}`);
};

async function go() {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox"] });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 });
  const consoleErrors = [];
  page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text()); });
  page.on("pageerror", (e) => consoleErrors.push(String(e)));
  try {
    await page.goto(`${BASE}/landing/book`, { waitUntil: "networkidle2", timeout: 60000 });
    await new Promise((r) => setTimeout(r, 2000));
    const text = await page.evaluate(() => document.body.innerText);
    check("page rendered", /Book a (strategy call|call with ELION)/i.test(text), "heading found");
    check("truthful scheduling state shown", /Live scheduling is being switched on|coming online/i.test(text));
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    check("no horizontal overflow at 390px", !overflow);
    const errs = consoleErrors.filter((e) => !/favicon/i.test(e));
    check("no console errors", errs.length === 0, errs.slice(0, 2).join(" | ") || "none");
  } finally {
    await browser.close();
  }
  console.log(`\n=== RESULT: ${fail === 0 ? "ALL PASS" : fail + " FAILED"} (${pass} passed, ${fail} failed) ===`);
  process.exit(fail === 0 ? 0 : 1);
}
go().catch((e) => { console.error("FATAL:", e); process.exit(1); });
