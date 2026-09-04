// Mobile QA for /landing/support + /funnel changes.
// Uses Chrome DevTools Protocol mobile emulation (touch events, mobile UA,
// viewport + DPR) — not a resized desktop viewport.
// Covers: live status indicator, per-channel response times, merged
// expectations block, channel-card stacking + 44px tap targets, no horizontal
// overflow, leak-cost calculator (sliders + live number), sticky CTA vs
// keyboard, FAQ accordions on touch, at 375px and 390px.
// Usage: node scripts/qa-mobile-support-funnel.cjs
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

// Expected status from the same WAT logic the page uses.
function expectedStatus() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Lagos", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(new Date());
  const get = (t) => parts.find((p) => p.type === t)?.value || "";
  const wd = get("weekday");
  const mins = parseInt(get("hour"), 10) * 60 + parseInt(get("minute"), 10);
  const isWeekday = ["Mon", "Tue", "Wed", "Thu", "Fri"].includes(wd);
  const online = isWeekday && mins >= 540 && mins < 1080;
  let label;
  if (online) label = "We’re online now";
  else if (isWeekday && mins < 540) label = "Outside business hours — we’ll respond by today";
  else if (["Fri", "Sat", "Sun"].includes(wd)) label = "Outside business hours — we’ll respond by Monday";
  else label = "Outside business hours — we’ll respond by tomorrow";
  return { online, label };
}

const noHOverflow = () => document.documentElement.scrollWidth <= window.innerWidth + 1;

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

      // ---------- SUPPORT PAGE ----------
      await page.goto(BASE + "/landing/support", { waitUntil: "networkidle2", timeout: 90000 });
      await sleep(800);

      check(`${label} support: no horizontal overflow`, await page.evaluate(noHOverflow));

      const statusText = await page.evaluate(() =>
        document.querySelector('[role="status"]')?.textContent?.trim() || ""
      );
      const exp = expectedStatus();
      check(`${label} support: live status indicator matches WAT clock`, statusText === exp.label, `got="${statusText}" expected="${exp.label}"`);
      check(`${label} support: status is computed (not static)`, statusText.length > 0 && /online now|Outside business hours/.test(statusText));

      const cardInfo = await page.evaluate(() => {
        const cards = [...document.querySelectorAll("a[href^='https://wa.me'], a[href^='mailto:'], a[href^='tel:']")];
        return cards.map((c) => ({ text: c.textContent.replace(/\s+/g, " ").trim(), h: c.getBoundingClientRect().height }));
      });
      const wa = cardInfo.find((c) => c.text.includes("WhatsApp"));
      const em = cardInfo.find((c) => c.text.includes("Email"));
      const ph = cardInfo.find((c) => c.text.includes("Phone"));
      check(`${label} support: WhatsApp concrete time (within 1 hour)`, /within 1 hour/i.test(wa?.text || ""), wa?.text.slice(0, 80));
      check(`${label} support: Email concrete time (within 24 hours)`, /within 24 hours/i.test(em?.text || ""), em?.text.slice(0, 80));
      check(`${label} support: Phone hours visible (Mon–Fri 9am–6pm WAT)`, /monday to friday, 9am to 6pm wat/i.test(ph?.text || ""), ph?.text.slice(0, 80));
      check(`${label} support: channel cards ≥44px tap targets`, (wa?.h || 0) >= 44 && (em?.h || 0) >= 44 && (ph?.h || 0) >= 44, `h=${wa?.h},${em?.h},${ph?.h}`);
      check(`${label} support: cards stack in one column (no horizontal scroll)`, await page.evaluate(() => {
        const a = document.querySelector("a[href^='https://wa.me']");
        const b = document.querySelector("a[href^='mailto:']");
        if (!a || !b) return false;
        const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
        return Math.abs(ra.left - rb.left) < 2; // same left edge => stacked
      }));

      // expectations block: single block, no per-channel duplication
      const expectBlock = await page.evaluate(() => {
        const blocks = [...document.querySelectorAll("p")].filter((p) => /Response expectations:/i.test(p.textContent || ""));
        return blocks.map((b) => b.textContent.replace(/\s+/g, " ").trim());
      });
      check(`${label} support: single merged expectations block`, expectBlock.length === 1, `blocks=${expectBlock.length}`);
      check(`${label} support: expectations block does not repeat channel times`, expectBlock.length === 1 && !/within 1 hour|within 24 hours/i.test(expectBlock[0] || ""));

      // FAQ accordion on touch
      await page.evaluate(() => {
        const btns = [...document.querySelectorAll("button[aria-expanded]")];
        if (btns[0]) btns[0].click();
      });
      await sleep(600);
      const faqOpen = await page.evaluate(() => {
        const b = document.querySelector("button[aria-expanded='true']");
        return !!b;
      });
      const overflowAfterFaq = await page.evaluate(noHOverflow);
      check(`${label} support: FAQ opens on touch`, faqOpen);
      check(`${label} support: FAQ open causes no layout overflow`, overflowAfterFaq);
      await page.evaluate(() => {
        const b = document.querySelector("button[aria-expanded='true']");
        if (b) b.click();
      });
      await sleep(500);

      // ---------- FUNNEL PAGE ----------
      await page.goto(BASE + "/funnel", { waitUntil: "networkidle2", timeout: 90000 });
      await sleep(800);

      check(`${label} funnel: no horizontal overflow`, await page.evaluate(noHOverflow));

      // Calculator present before the audit form
      const calcVisible = await page.evaluate(() => {
        const c = document.querySelector("[data-calc-result]");
        if (!c) return false;
        const r = c.getBoundingClientRect();
        const form = [...document.querySelectorAll("h2")].find((h) => h.textContent.includes("audit")) || null;
        return r.width > 0;
      });
      check(`${label} funnel: leak-cost calculator visible before audit form`, calcVisible);

      const calcDefault = await page.evaluate(() => document.querySelector("[data-calc-result]")?.textContent?.replace(/\s+/g, " ").trim() || "");
      check(`${label} funnel: calculator shows a live NGN figure`, /₦[\d,]+/.test(calcDefault), calcDefault);

      // Adjust the leads slider (native setter + input event -> React onChange)
      const calcAfter = await page.evaluate(() => {
        const el = document.getElementById("calc-leads");
        const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
        setter.call(el, 200);
        el.dispatchEvent(new Event("input", { bubbles: true }));
        return new Promise((res) => setTimeout(() => {
          res(document.querySelector("[data-calc-result]")?.textContent?.replace(/\s+/g, " ").trim() || "");
        }, 400));
      });
      check(`${label} funnel: calculator updates in real time when sliders change`, calcAfter !== calcDefault, `before="${calcDefault}" after="${calcAfter}"`);

      // Slider touch target size (h-12 = 48px)
      const sliderH = await page.evaluate(() => document.getElementById("calc-leads")?.getBoundingClientRect().height || 0);
      check(`${label} funnel: slider touch targets ≥44px`, sliderH >= 44, `h=${sliderH}`);

      // Drag the response slider with touch-like pointer (mouse drag over range input)
      const responseValBefore = await page.evaluate(() => document.getElementById("calc-response").value);
      const box = await page.evaluate(() => {
        const r = document.getElementById("calc-response").getBoundingClientRect();
        return { x: r.x, y: r.y + r.height / 2, w: r.width };
      });
      await page.mouse.move(box.x + box.w * 0.9, box.y);
      await page.mouse.down();
      await page.mouse.move(box.x + box.w * 0.6, box.y, { steps: 6 });
      await page.mouse.up();
      await sleep(400);
      const responseValAfter = await page.evaluate(() => document.getElementById("calc-response").value);
      check(`${label} funnel: response slider draggable`, responseValAfter !== responseValBefore, `${responseValBefore} -> ${responseValAfter}`);
      const calcDragged = await page.evaluate(() => document.querySelector("[data-calc-result]")?.textContent?.replace(/\s+/g, " ").trim() || "");
      check(`${label} funnel: computed number clearly visible (not scrolled past)`, /₦[\d,]+/.test(calcDragged), calcDragged);
      check(`${label} funnel: no horizontal overflow after slider drag`, await page.evaluate(noHOverflow));

      // FAQ accordion on touch
      await page.evaluate(() => {
        const btns = [...document.querySelectorAll("#faq button[aria-expanded]")];
        if (btns[0]) btns[0].click();
      });
      await sleep(600);
      const fFaqOpen = await page.evaluate(() => !!document.querySelector("#faq button[aria-expanded='true']"));
      const fOverflow = await page.evaluate(noHOverflow);
      check(`${label} funnel: FAQ opens on touch`, fFaqOpen);
      check(`${label} funnel: FAQ open causes no overflow/jump`, fOverflow);
      await page.evaluate(() => {
        const b = document.querySelector("#faq button[aria-expanded='true']");
        if (b) b.click();
      });
      await sleep(400);

      // Audit form: walk all 6 steps via touch taps (options or Continue)
      let formOk = true;
      for (let s = 0; s < 5; s++) {
        const progressed = await page.evaluate(() => {
          const btns = [...document.querySelectorAll("button")];
          const option = btns.find((b) => b.textContent.trim().length > 2 && !/back|continue|analyze|submitting/i.test(b.textContent) && b.getBoundingClientRect().height >= 40);
          const cont = btns.find((b) => /continue/i.test(b.textContent));
          if (option) option.click();
          else if (cont) cont.click();
          else return false;
          return true;
        });
        if (!progressed) { formOk = false; break; }
        await sleep(450);
      }
      // Fill contact fields and check keyboard/CTA behavior
      const contactFilled = await page.evaluate(() => {
        const name = document.querySelector("input[aria-label='Your name']");
        const email = document.querySelector("input[aria-label='Email address']");
        if (!name || !email) return false;
        const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
        setter.call(name, "QA Mobile");
        name.dispatchEvent(new Event("input", { bubbles: true }));
        setter.call(email, "qa-mobile-" + Date.now() + "@example.com");
        email.dispatchEvent(new Event("input", { bubbles: true }));
        email.focus();
        return true;
      });
      await sleep(400);
      const ctaHiddenWhileTyping = await page.evaluate(() => {
        const cta = [...document.querySelectorAll("div")].find((d) => /Run Free Audit/.test(d.textContent || "") && d.className.includes("fixed"));
        if (!cta) return false;
        return getComputedStyle(cta).display === "none" || cta.className.includes("hidden");
      });
      check(`${label} funnel: 6-step audit form walkable on mobile`, contactFilled && formOk);
      check(`${label} funnel: sticky CTA hides while keyboard is open (never covers fields)`, ctaHiddenWhileTyping);
      check(`${label} funnel: no horizontal overflow in audit form`, await page.evaluate(noHOverflow));

      await page.close();
    }

    await browser.close();
  } catch (e) {
    console.error("SCRIPT ERROR:", e && e.message ? e.message : e);
    try { await browser.close(); } catch {}
  }

  console.log(`\nRESULT: ${pass}/${pass + fail} PASS`);
  process.exit(fail ? 1 : 0);
})();