// Regression runner for the ELION audit pipeline.
// Runs deterministic fixtures against the audit modules transpiled to JS
// (tests/audit/compiled via tsc). No live websites, no test framework.
//
// Usage: node tests/audit/run-fixtures.mjs
// Compiles the audit modules to tests/audit/compiled automatically (tsc),
// then evaluates the deterministic fixtures. Exit 0 = all pass; 1 = failures.

import { execFileSync } from "child_process";
import path from "path";
import url from "url";
import fs from "fs";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "compiled");

if (!fs.existsSync(path.join(OUT, "detect.js"))) {
  const tscBin = path.join(__dirname, "..", "..", "node_modules", "typescript", "bin", "tsc");
  execFileSync(process.execPath, [tscBin,
    
    "src/lib/audit/extract.ts", "src/lib/audit/detect.ts", "src/lib/audit/registry.ts",
    "--outDir", OUT,
    "--module", "nodenext", "--moduleResolution", "nodenext",
    "--target", "es2022", "--skipLibCheck", "--strict",
  ], { cwd: path.join(__dirname, "..", ".."), stdio: "pipe" });
}

const { extractPage } = await import(url.pathToFileURL(path.join(OUT, "extract.js")).href);
const { scanPage } = await import(url.pathToFileURL(path.join(OUT, "detect.js")).href);
const { PROVIDER_REGISTRY: registry } = await import(url.pathToFileURL(path.join(OUT, "registry.js")).href);
import { FIXTURES } from "./fixtures.mjs";

const HOME = "https://fixture.example/";
let pass = 0;
const failures = [];

for (const fx of FIXTURES) {
  try {
    const page = extractPage(HOME, fx.html);
    const sig = scanPage(page);
    const cats = buildCategories(sig, fx);

    let ok = false;
    try {
      ok = fx.expect(cats);
    } catch (e) {
      ok = false;
      fx._err = e;
    }
    if (ok) {
      pass++;
      console.log(`PASS  ${fx.name}`);
    } else {
      failures.push(fx.name);
      console.log(`FAIL  ${fx.name}`);
      console.log("      categories:", JSON.stringify(summarize(cats), null, 2).replace(/\n/g, "\n      "));
      if (fx._err) console.log("      expect-error:", fx._err.message);
    }
  } catch (e) {
    failures.push(fx.name);
    console.log(`FAIL  ${fx.name} (runner exception: ${e.message})`);
  }
}

console.log(`\n${pass}/${FIXTURES.length} fixture tests passed`);
if (failures.length) {
  console.log("Failed:", failures.join(" | "));
  process.exit(1);
}

// ── Category construction mirroring pipeline.ts aggregation ──

function buildCategories(sig, fx) {
  const cats = {};

  // WhatsApp
  const waEv = sig.whatsappLinks.map((w) => ({ finding: "WhatsApp deep link", source: "href", match: w, reliability: "strong", provider: null }));
  if (sig.whatsappTextOnly) waEv.push({ finding: "WhatsApp mentioned in text", source: "text", match: "whatsapp", reliability: "weak", provider: null });
  cats.whatsapp = agg(waEv, sig.whatsappTextOnly ? "low" : undefined);

  // Email / phone
  cats.email = agg(sig.emails.map((e) => ({ finding: "Contact email", source: "href", match: e, reliability: "strong", provider: null })));
  cats.email.value = sig.emails[0];
  cats.phone = agg(sig.phones.map((p) => ({ finding: "Contact phone", source: "href", match: p, reliability: "strong", provider: null })));
  cats.phone.value = sig.phones[0];

  // Social
  cats.social = agg(sig.socialProfiles.map((s) => ({ finding: `${s.platform} profile`, source: "href", match: s.url, reliability: "strong", provider: s.platform })));

  // Registry categories from provider hits + category-level paths
  for (const category of ["booking", "live_chat", "crm", "email_marketing", "ecommerce"]) {
    const ev = [];
    for (const h of sig.providerHits) {
      if (h.category === category) ev.push(...h.evidence.map((e) => ({ ...e, provider: h.provider })));
    }
    if (category === "booking") {
      for (const b of sig.bookingPaths.slice(0, 3)) ev.push({ finding: "Booking CTA", source: "text", match: b, reliability: "weak", provider: null });
    }
    if (category === "live_chat") {
      for (const c of sig.chatPaths.slice(0, 2)) ev.push({ finding: "Chat invitation", source: "text", match: c, reliability: "weak", provider: null });
    }
    if (category === "email_marketing") {
      for (const f of sig.newsletterForms.slice(0, 2)) ev.push({ finding: "Newsletter form", source: "form_action", match: `form#${f}`, reliability: "moderate", provider: null });
    }
    const provider = ev.find((e) => e.provider)?.provider || null;
    cats[category] = agg(ev, undefined, provider);
  }

  // Deep-stage network evidence simulation
  if (fx.networkHosts) {
    for (const fp of registry) {
      for (const host of fx.networkHosts) {
        if (fp.networkHosts.some((h) => host === h || host.endsWith("." + h))) {
          const ev = [{ finding: "Runtime network request", source: "network", match: host, reliability: "strong", provider: fp.provider }];
          const existing = cats[fp.category];
          const merged = [...(existing.evidence || []), ...ev];
          cats[fp.category] = agg(merged, undefined, ev[0].provider);
        }
      }
    }
  }

  return cats;
}

function agg(evidence, forceConfidence, provider = null) {
  if (evidence.length === 0) {
    return { status: "not_found", provider: null, confidence: "low", evidence: [] };
  }
  const strong = evidence.some((e) => e.reliability === "strong");
  const moderates = new Set(evidence.filter((e) => e.reliability === "moderate").map((e) => `${e.source}:${e.match}`));
  let confidence = forceConfidence || "low";
  if (!forceConfidence) {
    if (strong) confidence = "high";
    else if (moderates.size >= 2) confidence = "medium";
    else if (moderates.size === 1) confidence = "low";
  }
  const pv = evidence.find((e) => e.provider)?.provider || provider;
  return { status: "found", provider: pv || null, confidence, evidence };
}

function summarize(cats) {
  const out = {};
  for (const [k, v] of Object.entries(cats)) {
    out[k] = { status: v.status, provider: v.provider, confidence: v.confidence, evidence: v.evidence.slice(0, 3).map((e) => `${e.source}:${e.match}`) };
  }
  return out;
}
