// Mobile QA for the AI support assistant widget on /landing/support.
// Chrome DevTools Protocol mobile emulation (touch, mobile UA, DPR 3) at
// 375px + 390px. Covers: bubble visibility + tap target, panel open/close,
// greeting, real chat round-trip (fallback path), 44px targets, form handoff
// prefill, no horizontal overflow, aria labels.
// Usage: node scripts/qa-support-widget-mobile.cjs
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
const noHOverflow = () => document.documentElement.scrollWidth <= window.innerWidth + 1;

async function tap(page, selector) {
  await page.waitForSelector(selector, { timeout: 15000 });
  const el = await page.$(selector);
  const box = await el.boundingBox();
  await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: "new",
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });

  try {
    for (const [label, width, height] of [["375px", 375, 667], ["390px", 390, 844]]) {
      console.log(`\n=== ${label} viewport ===`);
      const page = await browser.newPage();
      await page.emulate({
        viewport: { width, height, isMobile: true, hasTouch: true, deviceScaleFactor: 3 },
        userAgent:
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
      });

      await page.goto(BASE + "/landing/support", { waitUntil: "networkidle2", timeout: 90000 });
      await sleep(800);

      // 1. Bubble exists, visible, >=44px, on-screen (bottom-right quadrant)
      const bubble = await page.evaluate(() => {
        const b = document.querySelector('button[aria-label="Open support assistant"]');
        if (!b) return null;
        const r = b.getBoundingClientRect();
        const s = getComputedStyle(b.parentElement); // wrapper carries the fixed positioning
        const bs = getComputedStyle(b);
        return {
          w: r.width, h: r.height, x: r.x, y: r.y,
          vw: window.innerWidth, vh: window.innerHeight,
          position: s.position, display: bs.display, visibility: bs.visibility,
        };
      });
      check(`${label} bubble: present`, !!bubble);
      if (bubble) {
        check(`${label} bubble: fixed + visible`, bubble.position === "fixed" && bubble.display !== "none" && bubble.visibility !== "hidden");
        check(`${label} bubble: >=44px tap target`, bubble.w >= 44 && bubble.h >= 44, `${Math.round(bubble.w)}x${Math.round(bubble.h)}`);
        check(`${label} bubble: on-screen bottom-right`, bubble.x > bubble.vw / 2 && bubble.y + bubble.h <= bubble.vh && bubble.y > bubble.vh / 2);
      }

      // 2. No horizontal overflow with widget closed
      check(`${label} page: no horizontal overflow (closed)`, await page.evaluate(noHOverflow));

      // 3. Tap bubble -> panel opens, greeting visible, fits viewport
      await tap(page, 'button[aria-label="Open support assistant"]');
      await sleep(600);

      const panel = await page.evaluate(() => {
        const p = document.querySelector('[role="dialog"][aria-label="ELION support assistant"]');
        if (!p) return null;
        const r = p.getBoundingClientRect();
        return { w: r.width, h: r.height, x: r.x, y: r.y, vw: window.innerWidth, vh: window.innerHeight };
      });
      check(`${label} panel: opens on tap`, !!panel);
      if (panel) {
        check(`${label} panel: fully within viewport`, panel.x >= 0 && panel.y >= 0 && panel.x + panel.w <= panel.vw + 1 && panel.y + panel.h <= panel.vh + 1, `panel ${Math.round(panel.w)}x${Math.round(panel.h)} in ${panel.vw}x${panel.vh}`);
      }
      const greeting = await page.evaluate(() => document.querySelector('[role="dialog"]')?.textContent?.includes("free audit") || false);
      check(`${label} panel: greeting shown`, greeting);

      // 4. Close button >=44px, panel closes
      const closeBtn = await page.evaluate(() => {
        const b = document.querySelector('button[aria-label="Close assistant"]');
        if (!b) return null;
        const r = b.getBoundingClientRect();
        return { w: r.width, h: r.height };
      });
      check(`${label} close button: >=44px`, !!closeBtn && closeBtn.w >= 44 && closeBtn.h >= 44, closeBtn ? `${Math.round(closeBtn.w)}x${Math.round(closeBtn.h)}` : "missing");
      await tap(page, 'button[aria-label="Close assistant"]');
      await sleep(400);
      const panelGone = await page.evaluate(() => !document.querySelector('[role="dialog"][aria-label="ELION support assistant"]'));
      check(`${label} panel: closes on tap`, panelGone);

      // 5. Reopen, send a real message through the fallback path
      await tap(page, 'button[aria-label="Open support assistant"]');
      await sleep(500);
      await page.waitForSelector('input[aria-label="Your question"]', { timeout: 10000 });
      await page.type('input[aria-label="Your question"]', "How much is Growth?");
      const sendBtn = await page.evaluate(() => {
        const b = document.querySelector('button[aria-label="Send question"]');
        if (!b) return null;
        const r = b.getBoundingClientRect();
        return { w: r.width, h: r.height };
      });
      check(`${label} send button: >=44px`, !!sendBtn && sendBtn.w >= 44 && sendBtn.h >= 44);
      await tap(page, 'button[aria-label="Send question"]');

      // 5b. Input tap target (measured while panel is definitely open)
      const inputBox = await page.evaluate(() => {
        const i = document.querySelector('input[aria-label="Your question"]');
        if (!i) return null;
        return { h: i.getBoundingClientRect().height };
      });
      check(`${label} input: >=44px tap target`, !!inputBox && inputBox.h >= 44, inputBox ? String(Math.round(inputBox.h)) : "missing");

      // 6. Reply appears (assistant is on fallback until key is set; both paths are valid here)
      let replied = false, replyText = "";
      for (let i = 0; i < 30; i++) {
        await sleep(1000);
        replyText = await page.evaluate(() => {
          const msgs = document.querySelectorAll('[role="dialog"] p');
          return msgs.length ? msgs[msgs.length - 1].textContent : "";
        });
        if (replyText && replyText !== "How much is Growth?" && replyText !== "Typing…") { replied = true; break; }
      }
      check(`${label} chat: reply arrives`, replied, replyText.slice(0, 80));
      // Real (keyed) replies should ground pricing; fallback replies point to the form. Both are valid.
      const grounded = /NGN|350,000|naira/i.test(replyText);
      const fallbackCopy = /support form|24 hours/.test(replyText);
      check(`${label} chat: grounded reply or honest fallback`, grounded || fallbackCopy, (grounded ? "grounded: " : "fallback: ") + replyText.slice(0, 80));

      // 7. Handoff: "Continue in the support form" -> prefill lands in textarea
      const handoffVisible = await page.evaluate(() => {
        const btns = [...document.querySelectorAll('[role="dialog"] button')];
        return btns.some((b) => b.textContent.includes("Continue in the support form"));
      });
      check(`${label} handoff: button appears after messaging`, handoffVisible);
      if (handoffVisible) {
        await page.evaluate(() => {
          const btn = [...document.querySelectorAll('[role="dialog"] button')].find((b) => b.textContent.includes("Continue in the support form"));
          btn.click();
        });
        await sleep(500);
        const prefill = await page.evaluate(() => {
          const ta = document.querySelector('textarea[id="support-message"]');
          return ta ? ta.value : "";
        });
        check(`${label} handoff: form message prefilled with chat context`, prefill.includes("Support chat follow-up") && prefill.includes("How much is Growth?"), prefill.slice(0, 90));
      }

      // 8. No overflow with panel open
      check(`${label} page: no horizontal overflow (open)`, await page.evaluate(noHOverflow));

      await page.close();
    }
  } finally {
    await browser.close();
  }

  console.log(`\n=== RESULT: ${pass} pass, ${fail} fail ===`);
  process.exit(fail === 0 ? 0 : 1);
})();
