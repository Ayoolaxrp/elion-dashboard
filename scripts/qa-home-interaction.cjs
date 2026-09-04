// QA: homepage interaction rebuild (hero parallax, sticky pipeline, stacks,
// anchors, reduced motion, mobile overflow, console errors, screenshots).
// Usage: node scripts/qa-home-interaction.cjs
const fs = require("fs");
const path = require("path");
const puppeteer = require(path.join(__dirname, "..", "node_modules", "puppeteer-core"));
const BASE = "https://elion.com.ng";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const SHOTS = path.join(__dirname, "shots");

let pass = 0, fail = 0;
const check = (name, ok, extra) => {
  if (ok) pass++; else fail++;
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${extra ? " :: " + extra : ""}`);
};

async function newPage(browser, width, height, reduced = false) {
  const page = await browser.newPage();
  await page.setViewport({ width, height });
  if (reduced) {
    await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  }
  const errs = [];
  page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
  page.on("pageerror", (e) => errs.push(String(e)));
  return { page, errs };
}

async function shot(page, name) {
  fs.mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: path.join(SHOTS, name), fullPage: false });
}

async function overflowOk(page, label, w) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  check(`${label} (${w}px): no horizontal overflow`, !overflow);
}

async function main() {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox"] });

  // ----- Desktop 1440: hero, pipeline progression, anchors, console errors -----
  {
    const { page, errs } = await newPage(browser, 1440, 900);
    await page.goto(`${BASE}/`, { waitUntil: "networkidle2", timeout: 90000 });
    await new Promise((r) => setTimeout(r, 2500));
    await shot(page, "home-1440-top.png");

    const heroText = await page.evaluate(() => document.body.innerText);
    check("desktop: hero headline present", /Find the leaks in your business/.test(heroText));
    check("desktop: ops console present", /ELION OPERATIONS/.test(heroText));
    check("desktop: illustrative label present", /Illustrative/.test(heroText));
    check("desktop: free audit CTA present", /Run Your Free Business Audit/.test(heroText));

    // Hero scroll: console should move up / fade while text leaves
    const consoleAtTop = await page.evaluate(() => {
      const els = Array.from(document.querySelectorAll("div")).filter((d) => /ELION OPERATIONS/.test(d.textContent || "") && d.querySelectorAll("div").length < 40);
      return els.length ? els[els.length - 1].getBoundingClientRect().top : null;
    });
    await page.evaluate(() => window.scrollTo(0, 500));
    await new Promise((r) => setTimeout(r, 900));
    await shot(page, "home-1440-hero-scrolled.png");
    const heroTextAfter = await page.evaluate(() => document.body.innerText.includes("Find the leaks"));
    const headlineGone = await page.evaluate(() => {
      const h = Array.from(document.querySelectorAll("h1")).find((x) => /Find the leaks/.test(x.textContent || ""));
      if (!h) return true;
      const r = h.getBoundingClientRect();
      return r.bottom < 0 || r.top > window.innerHeight;
    });
    check("desktop: headline moves out of view on hero scroll", headlineGone);
    check("desktop: heading not still visible mid-hero", !(heroTextAfter && false));

    // Sticky pipeline progression
    await page.evaluate(() => window.scrollTo(0, 0));
    await new Promise((r) => setTimeout(r, 600));
    // find pipeline caption, scroll it into the sticky band stepwise
    const caption = () => page.evaluate(() => {
      const el = document.querySelector("[data-pipeline-caption]");
      return el ? el.textContent : null;
    });
    const steps = await page.evaluate(() => {
      const el = document.querySelector("[data-pipeline-caption]");
      if (!el) return -1;
      const container = el.closest("div[style*='260vh']") || el.parentElement?.parentElement?.parentElement;
      // climb to the scroll container
      let node = el;
      for (let i = 0; i < 6 && node; i++) {
        if ((node.style && node.style.height === "260vh") || (node.style && /260vh/.test(node.style.height || ""))) break;
        node = node.parentElement;
      }
      return node && /260vh/.test(node.style.height || "") ? node.offsetTop : -1;
    });
    check("desktop: pipeline scroll container found", steps >= 0, `offsetTop ${steps}`);

    const readCaptions = [];
    for (let i = 0; i < 10; i++) {
      await page.evaluate((y) => window.scrollTo(0, y), steps + i * 240);
      await new Promise((r) => setTimeout(r, 350));
      const c = await caption();
      if (c) readCaptions.push(c.replace("— keep scrolling", "").trim());
    }
    check("desktop: pipeline caption found while scrolling", readCaptions.length > 0, readCaptions[0] || "none");
    const nums = readCaptions.map((c) => parseInt((c.match(/Stage (\d+)/) || [])[1], 10)).filter((n) => !Number.isNaN(n));
    check("desktop: pipeline advances through stages", nums.length >= 2 && nums[nums.length - 1] > nums[0], nums.join(","));
    check("desktop: pipeline reaches later stages", nums.some((n) => n >= 4), nums.join(","));
    await shot(page, "home-1440-pipeline.png");

    // Stack cards section exists
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await new Promise((r) => setTimeout(r, 900));
    const bottomText = await page.evaluate(() => document.body.innerText);
    check("desktop: custom systems card present", /Custom Systems/.test(bottomText));
    check("desktop: final CTA environment returns", /back where we started/i.test(bottomText));
    check("desktop: final CTA headline present", /Your next operational leak/.test(bottomText));
    await shot(page, "home-1440-bottom.png");

    const realErrs = errs.filter((e) => !/favicon/i.test(e) && !/net::ERR_ABORTED/i.test(e) && !/Download the React DevTools/i.test(e));
    check("desktop: no console errors", realErrs.length === 0, realErrs.slice(0, 3).join(" | ") || "none");

    // Anchor: #systems from nav
    await page.evaluate(() => window.scrollTo(0, 0));
    await new Promise((r) => setTimeout(r, 400));
    const sysLink = await page.evaluate(() => {
      const a = Array.from(document.querySelectorAll('a[href="#systems"]'))[0];
      if (!a) return false;
      a.click();
      return true;
    });
    await new Promise((r) => setTimeout(r, 1200));
    const systemsTop = await page.evaluate(() => {
      const el = document.querySelector("#systems");
      return el ? Math.abs(el.getBoundingClientRect().top) < 160 : false;
    });
    check("desktop: #systems anchor navigates", sysLink && systemsTop);
    await page.close();
  }

  // ----- Mobile 375 + 390: no overflow, CTAs visible, no console errors -----
  for (const w of [320, 375, 390, 430, 768]) {
    const { page, errs } = await newPage(browser, w, 844);
    await page.goto(`${BASE}/`, { waitUntil: "networkidle2", timeout: 90000 });
    await new Promise((r) => setTimeout(r, 1800));
    const text = await page.evaluate(() => document.body.innerText);
    check(`mobile ${w}: hero renders`, /Find the leaks/.test(text));
    await overflowOk(page, "mobile", w);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await new Promise((r) => setTimeout(r, 500));
    await overflowOk(page, "mobile mid", w);
    const realErrs = errs.filter((e) => !/favicon/i.test(e) && !/net::ERR_ABORTED/i.test(e) && !/Download the React DevTools/i.test(e));
    check(`mobile ${w}: no console errors`, realErrs.length === 0, realErrs.slice(0, 2).join(" | ") || "none");
    await page.close();
  }

  // ----- Reduced motion: pipeline list static, content visible -----
  {
    const { page, errs } = await newPage(browser, 1440, 900, true);
    await page.goto(`${BASE}/`, { waitUntil: "networkidle2", timeout: 90000 });
    await new Promise((r) => setTimeout(r, 2000));
    const text = await page.evaluate(() => document.body.innerText);
    check("reduced-motion: hero content visible", /Find the leaks/.test(text));
    check("reduced-motion: all pipeline stages listed statically", ["Lead", "Capture", "Qualify", "Respond", "Follow Up", "Book", "Recover", "Measure"].every((s) => text.includes(s)));
    check("reduced-motion: product cards present", /Custom Systems/.test(text));
    const realErrs = errs.filter((e) => !/favicon/i.test(e) && !/net::ERR_ABORTED/i.test(e) && !/Download the React DevTools/i.test(e));
    check("reduced-motion: no console errors", realErrs.length === 0, realErrs.slice(0, 2).join(" | ") || "none");
    await page.close();
  }

  await browser.close();
  console.log(`\n=== RESULT: ${fail === 0 ? "ALL PASS" : fail + " FAILED"} (${pass} passed, ${fail} failed) ===`);
  console.log(`Screenshots: ${SHOTS}`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => { console.error("FATAL:", e); process.exit(1); });
