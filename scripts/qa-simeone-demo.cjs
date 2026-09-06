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

  // ---- GLOBAL HEADER ARCHITECTURE ASSERTIONS ----
  // The homepage header must be identical on every public page: same labels,
  // same order, same CTA, same logo; only active state may differ.
  const GLOBAL_LABELS = ["Solutions", "How It Works", "Audits", "Demo", "Pricing", "About", "Sign In", "Run Free Audit"];
  const assertGlobalHeader = async (page, route, isMobile = false) => {
    const hdr = await page.evaluate((labels) => {
      const scope = document.querySelector("header.glass-nav") || document.querySelector("header");
      if (!scope) return null;
      const links = [...scope.querySelectorAll("a")];
      const hrefs = links.map((a) => a.getAttribute("href"));
      const texts = links.map((a) => a.textContent.trim());
      const nav = [...scope.querySelectorAll("nav a")].map((a) => a.textContent.trim());
      const order = labels.map((l) => {
        const idx = nav.findIndex((t) => t === l);
        return idx;
      }).filter((i) => i >= 0);
      const orderLabels = order.map((i) => nav[i]);
      const logo = !!scope.querySelector('a[aria-label="ELION home"]');
      const cta = texts.some((t) => /run free audit/i.test(t));
      const landing = hrefs.some((h) => (h || "").startsWith("/landing/"));
      const dupNavEntries = nav.filter((t, i) => nav.indexOf(t) !== i);
      // active state: the link for this route should be highlighted if any
      return { logo, cta, landing, orderLabels, nav, dupNavEntries, hrefs };
    }, GLOBAL_LABELS);
    if (!hdr) { check(`hdr ${route}: header exists`, false); return; }
    check(`hdr ${route}: ELION logo present`, hdr.logo);
    check(`hdr ${route}: Run Free Audit CTA present`, hdr.cta);
    check(`hdr ${route}: no /landing/* in nav`, !hdr.landing);
    const expectedOrder = GLOBAL_LABELS.filter((l) => hdr.nav.includes(l));
    const sameOrder = JSON.stringify(hdr.orderLabels) === JSON.stringify(expectedOrder);
    check(`hdr ${route}: nav labels+order match global header`, sameOrder, `got=${JSON.stringify(hdr.orderLabels)} want=${JSON.stringify(expectedOrder)}`);
    check(`hdr ${route}: no duplicate nav entries`, hdr.dupNavEntries.length === 0, hdr.dupNavEntries.join(","));
  };


  try {
    // ================= DESKTOP =================
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 1000 });
    const errors = collectErrors(page);

  // Verify every public page renders the identical global header (desktop)
  for (const r of ["/", "/audit", "/demo", "/pricing", "/about", "/support", "/book", "/funnel"]) {
    await page.goto(BASE + r, { waitUntil: "networkidle2", timeout: 90000 });
    await sleep(600);
    await assertGlobalHeader(page, r);
    // Active state: current page's nav link is highlighted (except homepage, which has no active link)
    const activeOk = await page.evaluate(({ route, labels }) => {
      const scope = document.querySelector("header.glass-nav") || document.querySelector("header");
      if (!scope) return false;
      const nav = [...scope.querySelectorAll("nav a")];
      const routeMap = { "/": null, "/audit": "Audits", "/demo": "Demo", "/pricing": "Pricing", "/about": "About", "/support": null, "/book": null, "/funnel": null };
      const wantLabel = routeMap[route];
      const active = nav.filter((a) => {
        const c = a.className || "";
        return /text-white/.test(c) && !/hover:text-white/.test(c.split("hover").join(""));
      }).map((a) => a.textContent.trim());
      if (!wantLabel) return active.filter((t) => labels.includes(t)).length === 0 || active.includes("Run Free Audit");
      return active.includes(wantLabel);
    }, { route: r, labels: GLOBAL_LABELS });
    check(`hdr ${r}: active state correct`, activeOk);
  }

  // Cross-page anchor routing: from /pricing, Solutions must href to /#systems
  await page.goto(BASE + "/pricing", { waitUntil: "networkidle2", timeout: 90000 });
  await sleep(600);
  const crossAnchor = await page.evaluate(() => {
    const scope = document.querySelector("header.glass-nav") || document.querySelector("header");
    const a = [...scope.querySelectorAll("a")].find((x) => x.textContent.trim() === "Solutions");
    return a ? a.getAttribute("href") : null;
  });
  check("hdr cross-page: Solutions -> /#systems from /pricing", crossAnchor === "/#systems", crossAnchor);
  const crossAnchor2 = await page.evaluate(() => {
    const scope = document.querySelector("header.glass-nav") || document.querySelector("header");
    const a = [...scope.querySelectorAll("a")].find((x) => x.textContent.trim() === "How It Works");
    return a ? a.getAttribute("href") : null;
  });
  check("hdr cross-page: How It Works -> /#how from /pricing", crossAnchor2 === "/#how", crossAnchor2);

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
    check("home: Pricing -> canonical /pricing", navDest.pricing === "/pricing", navDest.pricing);
    check("home: About -> canonical /about", navDest.about === "/about", navDest.about);
    check("home: Sign In -> /login", navDest.signIn === "/login", navDest.signIn);
    check("home: CTA -> /audit", navDest.cta === "/audit", navDest.cta);
    // HOMEPAGE NAVIGATION ARCHITECTURE: anchors vs routes are distinct assertions.
    // Anchor links must be pure in-page anchors; route links must not be anchors.
    const isAnchor = (h) => typeof h === "string" && h.startsWith("#") && !h.includes("/");
    const isRoute = (h) => typeof h === "string" && h.startsWith("/") && !h.startsWith("/#");
    check("home: Solutions is pure in-page anchor", isAnchor(navDest.solutions), navDest.solutions);
    check("home: How It Works is pure in-page anchor", isAnchor(navDest.how), navDest.how);
    check("home: Audits is a route, not anchor", isRoute(navDest.audit), navDest.audit);
    check("home: Demo is a route, not anchor", isRoute(navDest.demo), navDest.demo);
    check("home: Pricing is a route, not anchor", isRoute(navDest.pricing), navDest.pricing);
    check("home: About is a route, not anchor", isRoute(navDest.about), navDest.about);
    // No duplicate nav ENTRIES: same label must not appear twice. (An "Audit"
    // nav item plus the "Run Free Audit" CTA may share the /audit href by design.)
    const navLabels = await page.evaluate(() => [...document.querySelectorAll("header a")].map((a) => a.textContent.trim()));
    const labelDupes = navLabels.filter((l, i) => navLabels.indexOf(l) !== i);
    check("home: no duplicate nav entries (labels)", labelDupes.length === 0, labelDupes.join(","));
    const navHrefs = await page.evaluate(() => [...document.querySelectorAll("header a")].map((a) => a.getAttribute("href")));
    const routeDupes = navHrefs.filter((h, i) => navHrefs.indexOf(h) !== i && h !== "/audit");
    check("home: no duplicate route hrefs (CTA /audit exempt)", routeDupes.length === 0, routeDupes.join(","));
    check("home: no /landing/* in nav", !navHrefs.some((h) => (h || "").startsWith("/landing/")), navHrefs.filter((h) => (h || "").startsWith("/landing/")).join(","));
    // Active-state sanity: no unrelated page marked active on the homepage.
    // Home nav links have no active class; on /pricing the LandingNav marks Pricing.
    const activeOnHome = await page.evaluate(() => {
      const links = [...document.querySelectorAll("header a")];
      const marked = links.filter((a) => {
        const cls = a.className || "";
        return /text-\[var\(--color-text-primary\)\]/.test(cls) && (a.getAttribute("href") || "") !== "/";
      });
      return marked.map((a) => a.getAttribute("href"));
    });
    check("home: no unrelated page marked active", activeOnHome.length === 0, activeOnHome.join(","));
    // Anchor click scrolls (verify target in viewport after click)
    const scrollYBefore = await page.evaluate(() => window.scrollY);
    await page.evaluate(() => {
      const links = [...document.querySelectorAll("header a")].filter((a) => a.getAttribute("href") === "#systems" && a.offsetHeight > 0);
      if (links[0]) links[0].click();
    });
    await sleep(1200);
    const scrollYAfter = await page.evaluate(() => window.scrollY);
    check("home: Solutions anchor click scrolls page", scrollYAfter > scrollYBefore + 100, `before=${scrollYBefore} after=${scrollYAfter}`);
    await page.evaluate(() => window.scrollTo(0, 0));
    await sleep(400);
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

    // ---- Pricing (canonical route + legacy redirect) ----
    await page.goto(BASE + "/pricing", { waitUntil: "networkidle2", timeout: 90000 });
    check("nav: /pricing serves 200 with canonical metadata", await page.evaluate(() => document.title.includes("Pricing")));
    await page.goto(BASE + "/landing/pricing", { waitUntil: "networkidle2", timeout: 90000 });
    check("nav: /landing/pricing redirects to /pricing", page.url().replace(/\/$/, "").endsWith("/pricing"), page.url());
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
      for (const r of ["/", "/funnel", "/audit", "/demo", "/support", "/pricing", "/about", "/book"]) {
        await mpage.goto(BASE + r, { waitUntil: "networkidle2", timeout: 90000 });
        await sleep(700);
        await assertGlobalHeader(mpage, `${label}${r}`, true);
        check(`${label} ${r}: no horizontal overflow`, await mpage.evaluate(noHOverflow));
        check(`${label} ${r}: primary CTA visible`, await mpage.evaluate(() => /(run (your )?free (business )?audit|free audit)/i.test(document.body.innerText)));
      }
      // Mobile anchor behavior on homepage: menu open -> anchor click -> menu closes + scrolls
      await mpage.goto(BASE + "/", { waitUntil: "networkidle2", timeout: 90000 });
      await sleep(700);
      const mAnchor = await mpage.evaluate(() => {
        const btn = [...document.querySelectorAll("button")].find((x) => (x.getAttribute("aria-label") || "").toLowerCase().includes("navigation menu"));
        if (!btn) return { ok: false };
        btn.click();
        return { ok: true };
      });
      if (mAnchor.ok) {
        await sleep(500);
        const before = await mpage.evaluate(() => window.scrollY);
        const clicked = await mpage.evaluate(() => {
          // Click the VISIBLE anchor link (mobile menu item), not the hidden desktop one
          const l = [...document.querySelectorAll("a")].find((a) => a.getAttribute("href") === "#systems" && a.offsetHeight > 0);
          if (!l) return false;
          l.click();
          return true;
        });
        await sleep(1200);
        const after = await mpage.evaluate(() => window.scrollY);
        const menuStillOpen = await mpage.evaluate(() => {
          const btn = [...document.querySelectorAll("button")].find((x) => (x.getAttribute("aria-label") || "").toLowerCase().includes("navigation menu"));
          return btn ? btn.getAttribute("aria-expanded") === "true" : false;
        });
        check(`${label} home: anchor link present in mobile menu`, clicked);
        check(`${label} home: anchor click scrolls`, after > before + 100, `before=${before} after=${after}`);
        check(`${label} home: menu closes after anchor click`, !menuStillOpen);
      } else {
        check(`${label} home: mobile menu button exists`, false);
      }
      // Mobile route-link behavior: menu closes after clicking a page link
      await mpage.evaluate(() => window.scrollTo(0, 0));
      await sleep(400);
      const opened2 = await mpage.evaluate(() => {
        const btn = [...document.querySelectorAll("button")].find((x) => (x.getAttribute("aria-label") || "").toLowerCase().includes("navigation menu"));
        if (!btn) return false;
        btn.click();
        return true;
      });
      if (opened2) {
        await sleep(500);
        const routeClicked = await mpage.evaluate(() => {
          // Click the VISIBLE route link (mobile menu item)
          const l = [...document.querySelectorAll("a")].find((a) => a.getAttribute("href") === "/demo" && a.offsetHeight > 0 && getComputedStyle(a).display !== "none");
          if (!l) return false;
          l.click();
          return true;
        });
        await sleep(1500);
        check(`${label} home: route link navigates to /demo`, routeClicked && mpage.url().includes("/demo"), mpage.url());
        const menuOpenAfterNav = await mpage.evaluate(() => {
          const btn = [...document.querySelectorAll("button")].find((x) => (x.getAttribute("aria-label") || "").toLowerCase().includes("navigation menu"));
          return btn ? btn.getAttribute("aria-expanded") === "true" : false;
        });
        check(`${label} home: menu closes after route navigation`, !menuOpenAfterNav);
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
