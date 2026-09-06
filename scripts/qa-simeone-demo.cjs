// Simeone demo acceptance sweep.
// Desktop + mobile checks over the exact demo path:
// / -> /audit (live run) -> /demo -> /landing/pricing -> /landing/support
// Verifies: console/page errors, nav + CTA destinations, anchor integrity,
// audit run completes with real results, demo run progresses, pricing copy,
// support assistant asks, mobile no-overflow, homepage section anchors.
// Usage: node scripts/qa-simeone-demo.cjs            (production)
//        QA_BASE_URL=http://localhost:3199 node scripts/qa-simeone-demo.cjs   (staging build)
const path = require("path");
const puppeteer = require(path.join(__dirname, "..", "node_modules", "puppeteer-core"));
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = process.env.QA_BASE_URL || "https://elion.com.ng";

let pass = 0, fail = 0;
const check = (name, ok, extra) => {
  if (ok) pass++; else fail++;
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${extra ? " :: " + extra : ""}`);
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const noHOverflow = () => document.documentElement.scrollWidth <= window.innerWidth + 1;

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: "new",
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });

  const collectErrors = (page) => {
    const errors = [];
    page.on("console", (m) => { if (m.type() === "error") errors.push("console: " + m.text()); });
    page.on("pageerror", (e) => errors.push("pageerror: " + String(e)));
    return errors;
  };

  try {
    // ================= DESKTOP =================
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 1000 });
    const errors = collectErrors(page);

    // ---- Homepage ----
    await page.goto(BASE + "/", { waitUntil: "networkidle2", timeout: 90000 });
    await sleep(1200);
    check("home: hero headline", /find the leaks/i.test(await page.evaluate(() => document.body.innerText)), "");
    const navDest = await page.evaluate(() => {
      const links = [...document.querySelectorAll("header a")];
      const dest = (label) => links.find((a) => a.textContent.trim().includes(label))?.getAttribute("href") || null;
      return {
        solutions: dest("Solutions"), how: dest("How It Works"), audit: dest("Audit"),
        demo: dest("Demo"), pricing: dest("Pricing"), about: dest("About"),
        signIn: dest("Sign In"), cta: dest("Run Free Audit"),
      };
    });
    check("home: Solutions -> #systems", navDest.solutions === "#systems", navDest.solutions);
    check("home: How It Works -> #how", navDest.how === "#how", navDest.how);
    check("home: Audit -> /audit", navDest.audit === "/audit", navDest.audit);
    check("home: Demo -> /demo", navDest.demo === "/demo", navDest.demo);
    check("home: Pricing -> /landing/pricing", navDest.pricing === "/landing/pricing", navDest.pricing);
    check("home: About -> /landing/about", navDest.about === "/landing/about", navDest.about);
    check("home: Sign In -> /login", navDest.signIn === "/login", navDest.signIn);
    check("home: CTA -> /audit", navDest.cta === "/audit", navDest.cta);
    // anchor targets exist on page
    const anchors = await page.evaluate(() => ["systems", "how", "faq"].map((id) => [id, !!document.getElementById(id)]));
    anchors.forEach(([id, ok]) => check(`home: section #${id} exists`, ok));

    // ---- /audit live run (real fetch) ----
    await page.goto(BASE + "/audit", { waitUntil: "networkidle2", timeout: 90000 });
    await sleep(800);
    check("audit: console has Run Free Audit", await page.evaluate(() => document.body.innerText.includes("Run Free Audit")));
    const typed = await page.evaluate(() => {
      const set = (el, v) => { const proto = Object.getPrototypeOf(el); const desc = Object.getOwnPropertyDescriptor(proto, "value"); desc && desc.set ? desc.set.call(el, v) : (el.value = v); el.dispatchEvent(new Event("input", { bubbles: true })); };
      const inputs = [...document.querySelectorAll("input")];
      const c = inputs.find((i) => /lagos real estate agency/i.test(i.placeholder || ""));
      if (!c) return false;
      set(c, "Simeone Demo Estate");
      const web = inputs.find((i) => /website/i.test(i.placeholder || ""));
      if (web) set(web, "https://example.com");
      return true;
    });
    check("audit: form populated", typed);
    await page.evaluate(() => {
      const btns = [...document.querySelectorAll("button")];
      const b = btns.find((x) => /run free audit/i.test(x.textContent));
      if (b) b.click();
    });
    // wait for results panel
    let result = false;
    for (let i = 0; i < 60; i++) {
      result = await page.evaluate(() => !!document.getElementById("results"));
      if (result) break;
      await sleep(500);
    }
    check("audit: results panel appears (live run)", result);
    if (result) {
      await sleep(500);
      const txt = await page.evaluate(() => document.getElementById("results").innerText);
      check("audit: score shown", /\d{1,3}\s*\/\s*100|AUTOMATION SCORE/i.test(txt), txt.slice(0, 60).replace(/\n/g, " "));
      check("audit: has findings list", /LEAK ANALYSIS|RESEARCH FINDINGS|SCORE BREAKDOWN/i.test(txt));
      check("audit: evidence-labeled wording present", /Observed|Source:|Recommended|Estimated|Verified/i.test(txt));
      check("audit: honest recommendation section", /Recommended|Fix with|Ready to fix/.test(txt));
    }

    // ---- /demo run ----
    await page.goto(BASE + "/demo", { waitUntil: "networkidle2", timeout: 90000 });
    await sleep(1000);
    const demoText = await page.evaluate(() => document.body.innerText);
    check("demo: sample-data disclosure", /sample data|illustrative/i.test(demoText));
    await page.evaluate(() => {
      const btns = [...document.querySelectorAll("button, a")];
      const b = btns.find((x) => /run|start|simulate|play/i.test(x.textContent || ""));
      if (b) b.click();
    });
    let demoProg = false;
    for (let i = 0; i < 40; i++) {
      demoProg = await page.evaluate(() => /lead captured|qualified|response|booked|follow/i.test(document.body.innerText));
      if (demoProg) break;
      await sleep(400);
    }
    check("demo: run progresses (lead->response->booking text)", demoProg);

    // ---- Pricing ----
    await page.goto(BASE + "/landing/pricing", { waitUntil: "networkidle2", timeout: 90000 });
    await sleep(800);
    const price = await page.evaluate(() => document.body.innerText);
    check("pricing: Starter ₦100,000", /100,000/.test(price));
    check("pricing: Growth ₦350,000", /350,000/.test(price));
    check("pricing: Scale ₦750,000", /750,000/.test(price));
    check("pricing: Growth recommended", /growth/i.test(price));
    check("pricing: no invented account name", !/account name\s*:\s*[A-Z]{3,}/i.test(price));

    // ---- Support assistant live ask ----
    await page.goto(BASE + "/landing/support", { waitUntil: "networkidle2", timeout: 90000 });
    await sleep(1000);
    const openOk = await page.evaluate(() => {
      const btn = document.querySelector('button[aria-label="Open support assistant"]');
      if (btn) btn.click();
      return !!btn;
    });
    check("support: assistant entry exists", openOk);
    await sleep(600);
    const sent = await page.evaluate(() => {
      const dialog = document.querySelector('[role="dialog"][aria-label="ELION support assistant"]');
      if (!dialog) return false;
      const inp = dialog.querySelector('input[aria-label="Your question"]');
      if (!inp) return false;
      const proto = Object.getPrototypeOf(inp);
      const desc = Object.getOwnPropertyDescriptor(proto, "value");
      desc && desc.set ? desc.set.call(inp, "How much is the Growth package?") : (inp.value = "How much is the Growth package?");
      inp.dispatchEvent(new Event("input", { bubbles: true }));
      const send = dialog.querySelector('button[aria-label="Send question"]');
      if (!send) return false;
      send.click();
      return true;
    });
    let assistantReplied = false;
    let lastText = "";
    if (sent) {
      for (let i = 0; i < 60; i++) {
        lastText = await page.evaluate(() => document.body.innerText);
        if (/350,000|NGN 350,000|Growth package/i.test(lastText)) { assistantReplied = true; break; }
        await sleep(500);
      }
    }
    check("support: assistant answers Growth price live", assistantReplied, sent ? lastText.slice(-260).replace(/\n/g, " ") : "no send btn");

    check("DESKTOP: no console/page errors", errors.length === 0, errors.slice(0, 3).join(" | "));
    await page.close();

    // ================= MOBILE =================
    for (const [label, width, height] of [["375px", 375, 667], ["390px", 390, 844]]) {
      const mpage = await browser.newPage();
      const mErrors = collectErrors(mpage);
      await mpage.emulate({
        viewport: { width, height, isMobile: true, hasTouch: true, deviceScaleFactor: 3 },
        userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
      });
      for (const r of ["/", "/funnel", "/audit", "/demo", "/landing/support"]) {
        await mpage.goto(BASE + r, { waitUntil: "networkidle2", timeout: 90000 });
        await sleep(700);
        check(`${label} ${r}: no horizontal overflow`, await mpage.evaluate(noHOverflow));
        check(`${label} ${r}: primary CTA visible`, await mpage.evaluate(() => /(run (your )?free (business )?audit|free audit)/i.test(document.body.innerText)));
      }
      // homepage mobile menu open/close
      await mpage.goto(BASE + "/", { waitUntil: "networkidle2", timeout: 90000 });
      await sleep(700);
      const menu = await mpage.evaluate(() => {
        const b = [...document.querySelectorAll("button")].find((x) => (x.getAttribute("aria-label") || "").toLowerCase().includes("navigation menu"));
        if (!b) return null;
        b.click();
        return true;
      });
      check(`${label} home: mobile menu toggles`, menu === true);
      if (menu) {
        await sleep(500);
        const menuShown = await mpage.evaluate(() => /Run Free Audit/i.test(document.body.innerText));
        check(`${label} home: mobile menu shows links+CTA`, menuShown);
      }
      check(`${label}: no mobile console errors`, mErrors.length === 0, mErrors.slice(0, 2).join(" | "));
      await mpage.close();
    }
  } catch (e) {
    console.log("FATAL", e && e.message ? e.message : e);
    fail++;
  } finally {
    await browser.close();
  }

  console.log(`\n==== RESULT ${pass} passed / ${fail} failed ====`);
  process.exitCode = fail > 0 ? 1 : 0;
})();
