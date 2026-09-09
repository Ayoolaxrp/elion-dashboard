#!/usr/bin/env node
// 30-business validation harness (MASTER-PLAN Phase 7).
//
// Runs the audit pipeline against a fixed list of ~30 Nigerian businesses
// (5 per vertical bucket) and records, per business:
//   automated : completed, pages inspected, render needed, could-not-verify
//               categories, opportunities found, false-positive review
//   human     : SEPARATE fields the operator fills after a real conversation
//               (owner confirms problem, conversation, call, proposal, sale...)
// Human fields are NEVER fabricated by the tool; they start empty.
//
// Usage:
//   node scripts/validation-30.cjs list
//   node scripts/validation-30.cjs run [--only=slug1,slug2] [--delay=2000]
//   node scripts/validation-30.cjs review <slug> --false-positive
//   node scripts/validation-30.cjs human <slug> --field=owner_confirmed_problem --value=true
//   node scripts/validation-30.cjs report
//
// Results: validation/validation-results.json (gitignored)

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const OUTDIR = path.join(ROOT, "validation");
const OUTFILE = path.join(OUTDIR, "validation-results.json");

// ── The 30-business set (public sites; replace entries only with owner-visible equivalents) ──
const SET = [
  // 5 real estate
  ["re_nigeria_intl", "Real Estate", "https://www.realestate-nigeria.com"],
  ["bellacroft", "Real Estate", "https://bellacroftproperties.com"],
  ["gtextgroup", "Real Estate", "https://gtextgroup.com.ng"],
  ["revolutionplus", "Real Estate", "https://revolutionplusproperty.com"],
  ["pwannigeria", "Real Estate", "https://www.pwanltd.com"],
  // 5 professional services
  ["texem", "Professional Services", "https://texem.org.uk"],
  ["douglas-odunaiya", "Professional Services", "https://www.douglas-odunaiya.com"],
  ["banwo-ighodalo", "Professional Services", "https://banwo-ighodalo.com"],
  ["aluko-oyeloke", "Professional Services", "https://alukooyeloke.com"],
  ["template-house", "Professional Services", "https://thcnigeria.com"],
  // 5 travel/training/recruitment
  ["ingenuity-hrm", "Recruitment", "https://ingenuityhrm.com"],
  ["workforce-group", "Recruitment", "https://theworkforce.com.ng"],
  [" Philips-consulting", "Recruitment", "https://philipsconsultingng.com"],
  ["wakanow", "Travel", "https://www.wakanow.com"],
  ["travelbeta", "Travel", "https://www.travelbeta.com"],
  // 5 ecommerce/product
  ["konga", "E-Commerce", "https://www.konga.com"],
  ["jumia", "E-Commerce", "https://www.jumia.com.ng"],
  ["orireglow", "E-Commerce", "https://orireglow.com"],
  ["spar-nigeria", "E-Commerce", "https://sparnigeria.com"],
  ["simba-group", "E-Commerce", "https://simbanigeria.com"],
  // 5 high-ticket local services
  ["eureka-hosp", "Healthcare", "https://eurekahospitals.com"],
  ["lagoon-hosp", "Healthcare", "https://www.lagoonhospitals.com"],
  ["oxforddental", "Healthcare", "https://oxforddentalclinicng.com"],
  ["verified-homes", "Professional Services", "https://verifiedhomes.com.ng"],
  ["carhire-lagos", "Professional Services", "https://carhirelagos.com"],
  // 5 control/other
  ["gtbank", "Financial Services", "https://www.gtbank.com"],
  ["paystack", "Financial Services", "https://paystack.com"],
  ["flutterwave", "Financial Services", "https://flutterwave.com"],
  ["moniepoint", "Financial Services", "https://moniepoint.com"],
  ["nairabet", "Other", "https://www.nairabet.com"],
];

function load() {
  if (!fs.existsSync(OUTFILE)) return {};
  return JSON.parse(fs.readFileSync(OUTFILE, "utf8"));
}
function save(db) {
  fs.mkdirSync(OUTDIR, { recursive: true });
  fs.writeFileSync(OUTFILE, JSON.stringify(db, null, 2));
}

// Run the audit pipeline directly (compiles the audit lib the same way the
// test runners do) so this works without a server and without hitting the
// production API.
function runAudit(website) {
  const COMPILED = path.join(ROOT, "tests", "audit", "compiled");
  if (!fs.existsSync(path.join(COMPILED, "pipeline.js"))) {
    const tscBin = path.join(ROOT, "node_modules", "typescript", "bin", "tsc");
    execFileSync(process.execPath, [tscBin,
      "src/lib/audit/extract.ts", "src/lib/audit/detect.ts", "src/lib/audit/registry.ts",
      "src/lib/audit/fetch-safe.ts", "src/lib/audit/crawl.ts", "src/lib/audit/deep.ts", "src/lib/audit/pipeline.ts",
      "--outDir", COMPILED,
      "--module", "nodenext", "--moduleResolution", "nodenext",
      "--target", "es2022", "--skipLibCheck", "--strict",
    ], { cwd: ROOT, stdio: "pipe" });
  }
  // pipeline.ts imports "@/lib/..." alias? No: relative imports only (verified).
  const { runAuditPipeline } = require(path.join(COMPILED, "pipeline.js"));
  return runAuditPipeline({ companyWebsite: website });
}

async function runBusiness(slug, industry, website, db, delayMs) {
  if (!db[slug]) {
    db[slug] = {
      slug, industry, website,
      automated: null,
      falsePositiveReview: "unreviewed", // operator marks confirmed_finding | false_positive | unreviewed
      human: {
        owner_considers_important: null,
        owner_confirms_internal_problem: null,
        conversation_started: null,
        call_booked: null,
        proposal_sent: null,
        sale: null,
        implementation: null,
        result: null,
      },
    };
  }
  const rec = db[slug];
  process.stdout.write("[" + slug + "] auditing " + website + " ... ");
  try {
    const signals = await runAudit(website);
    const cats = signals.categories || {};
    const cnv = Object.entries(cats).filter(([, c]) => c && c.status === "could_not_verify").map(([k]) => k);
    rec.automated = {
      ranAt: new Date().toISOString(),
      reachable: Boolean(signals.reachable),
      completed: Boolean(signals.hasWebsite),
      pagesAttempted: signals.inspected ? signals.inspected.pagesAttempted : null,
      pagesSucceeded: signals.inspected ? signals.inspected.pagesSucceeded : null,
      renderNeeded: Boolean(signals.deepAnalysisAttempted),
      renderSucceeded: Boolean(signals.deepAnalysisSucceeded),
      couldNotVerify: cnv,
      statusByCategory: Object.fromEntries(Object.entries(cats).map(([k, c]) => [k, c ? c.status : "absent"])),
      durationMs: null,
    };
    // Opportunities via the applicability engine (re-run through the commercial compile)
    try {
      const COMM = path.join(ROOT, "tests", "commercial", "compiled");
      if (!fs.existsSync(path.join(COMM, "applicability.js"))) {
        execFileSync(process.execPath, [path.join(ROOT, "node_modules", "typescript", "bin", "tsc"),
          "-p", path.join(ROOT, "tests", "commercial", "tsconfig.json")], { cwd: ROOT, stdio: "pipe" });
      }
      const { evaluateOpportunities } = require(path.join(COMM, "applicability.js"));
      const opp = evaluateOpportunities(cats, industry, Boolean(signals.reachable));
      rec.automated.opportunities = opp.opportunities
        .filter((o) => o.state === "strong_opportunity")
        .map((o) => ({ solution: o.solution, confidence: o.confidence }));
      rec.automated.noStrongOpportunity = opp.noStrongOpportunity;
    } catch (e) {
      rec.automated.opportunityError = String(e && e.message);
    }
    console.log("done" + (rec.automated.completed ? "" : " (UNREACHABLE)"));
  } catch (e) {
    rec.automated = {
      ranAt: new Date().toISOString(), reachable: false, completed: false,
      error: String(e && e.message).slice(0, 300),
    };
    console.log("ERROR " + rec.automated.error);
  }
  save(db);
  if (delayMs) await new Promise((r) => setTimeout(r, delayMs));
}

function summarize(db) {
  const all = Object.values(db);
  const done = all.filter((r) => r.automated && r.automated.ranAt);
  const completed = done.filter((r) => r.automated.completed);
  const withStrong = done.filter((r) => Array.isArray(r.automated.opportunities) && r.automated.opportunities.length > 0);
  const cnvHeavy = done.filter((r) => Array.isArray(r.automated.couldNotVerify) && r.automated.couldNotVerify.length >= 4);
  const reviewed = all.filter((r) => r.falsePositiveReview !== "unreviewed");
  const fps = reviewed.filter((r) => r.falsePositiveReview === "false_positive");
  const humanConfirmed = all.filter((r) => r.human && r.human.owner_confirms_internal_problem === true);
  return {
    total: all.length,
    ran: done.length,
    auditCompleted: completed.length,
    withStrongOpportunity: withStrong.length,
    couldNotVerifyHeavy: cnvHeavy.length,
    renderNeeded: done.filter((r) => r.automated.renderNeeded).length,
    reviewed: reviewed.length,
    falsePositives: fps.length,
    humanConfirmed: humanConfirmed.length,
    // Internal targets (NOT industry facts):
    targets: {
      audit_completion: ">= 95%",
      hard_false_positives: "very low (target 0)",
      finding_relevance: ">= 70%",
      owner_confirmation: ">= 50%",
    },
  };
}

async function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  const db = load();

  if (cmd === "list") {
    SET.forEach(([slug, ind, url]) => console.log(slug.padEnd(22), ind.padEnd(22), url));
    return;
  }
  if (cmd === "run") {
    const only = (process.argv.find((a) => a.startsWith("--only=")) || "").split("=")[1];
    const delay = Number((process.argv.find((a) => a.startsWith("--delay=")) || "--delay=1500").split("=")[1]) || 1500;
    const onlySet = only ? new Set(only.split(",")) : null;
    for (const [slug, ind, url] of SET) {
      if (onlySet && !onlySet.has(slug.trim())) continue;
      await runBusiness(slug.trim(), ind, url, db, delay);
    }
    console.log("\nSummary:", JSON.stringify(summarize(db), null, 2));
    return;
  }
  if (cmd === "review") {
    const slug = rest[0];
    const fp = rest.includes("--false-positive");
    if (!db[slug]) { console.error("Unknown slug"); process.exit(1); }
    db[slug].falsePositiveReview = fp ? "false_positive" : "confirmed_finding";
    save(db);
    console.log(slug, "->", db[slug].falsePositiveReview);
    return;
  }
  if (cmd === "human") {
    const slug = rest[0];
    const fieldArg = (process.argv.find((a) => a.startsWith("--field=")) || "").split("=")[1];
    const valueArg = (process.argv.find((a) => a.startsWith("--value=")) || "").split("=")[1];
    if (!db[slug] || !fieldArg) { console.error("Usage: human <slug> --field=... --value=..."); process.exit(1); }
    db[slug].human[fieldArg] = valueArg === "true" ? true : valueArg === "false" ? false : valueArg;
    save(db);
    console.log(slug, fieldArg, "=", db[slug].human[fieldArg]);
    return;
  }
  if (cmd === "report") {
    console.log(JSON.stringify(summarize(db), null, 2));
    return;
  }
  console.log("Unknown command. Use: list | run | review | human | report");
  process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
