// Commercial applicability engine tests : deterministic, no network.
// Run: node tests/commercial/run-applicability.cjs
// Compiles src via tests/commercial/tsconfig.json, then runs fixtures.

const { execFileSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const ROOT = path.join(__dirname, "..", "..");
const OUT = path.join(__dirname, "compiled");

// 1. Compile (Windows-safe: node against the tsc JS entry, tsconfig supplies paths)
if (!fs.existsSync(path.join(OUT, "applicability.js"))) {
  const tscBin = path.join(ROOT, "node_modules", "typescript", "bin", "tsc");
  execFileSync(process.execPath, [tscBin, "-p", path.join(__dirname, "tsconfig.json")], {
    cwd: ROOT,
    stdio: "inherit",
  });
}

// tsc preserves folder structure relative to common root; locate applicability.js
function findFile(dir, name) {
  const q = [dir];
  while (q.length) {
    const d = q.shift();
    let entries;
    try {
      entries = fs.readdirSync(d, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const f of entries) {
      const p = path.join(d, f.name);
      if (f.isDirectory()) q.push(p);
      else if (f.name === name) return p;
    }
  }
  throw new Error(name + " not found in " + dir);
}
const applicability = require(findFile(OUT, "applicability.js"));

// 2. Helpers
const cat = (status, confidence, provider) => ({
  category: "x", status, confidence: confidence || "high", provider: provider || null, evidence: [],
});
const baseCategories = {
  whatsapp: cat("not_found"),
  email: cat("found"),
  phone: cat("found"),
  social: cat("found"),
  booking: cat("not_found"),
  live_chat: cat("not_found"),
  crm: cat("could_not_verify"),
  email_marketing: cat("could_not_verify"),
  ecommerce: cat("not_found"),
};

let pass = 0;
const failures = [];
const check = (name, cond, detail) => {
  if (cond) { pass++; console.log("PASS  " + name); }
  else { failures.push(name); console.log("FAIL  " + name + (detail ? " :: " + detail : "")); }
};

const { evaluateOpportunities } = applicability;

// ── Test 1: irrelevant missing technology does NOT create an opportunity ──
{
  const cats = JSON.parse(JSON.stringify(baseCategories));
  const result = evaluateOpportunities(cats, "E-Commerce", true);
  const bookingOpp = result.opportunities.find((o) => o.solution === "booking_no_show");
  check(
    "ecommerce missing booking is not a strong opportunity",
    !bookingOpp || bookingOpp.state !== "strong_opportunity",
    bookingOpp ? "state=" + bookingOpp.state : "not present"
  );
  check(
    "industry exclusion applied and visible",
    result.appliedExclusions.some((x) => x.category === "booking"),
    JSON.stringify(result.appliedExclusions)
  );
}

// ── Test 2: unavailable CRM evidence is NOT converted to "no CRM" / strong pitch ──
{
  const cats = JSON.parse(JSON.stringify(baseCategories));
  const result = evaluateOpportunities(cats, "Professional Services", true);
  const opp = result.opportunities.find((o) => o.solution === "lead_recovery_followup");
  check(
    "unverifiable CRM never becomes strong opportunity",
    !opp || opp.state !== "strong_opportunity",
    opp ? "state=" + opp.state : "not present"
  );
  if (opp) {
    check(
      "unverifiable CRM surfaces as insufficient_evidence/investigate",
      opp.state === "insufficient_evidence" || opp.state === "investigate",
      "state=" + opp.state
    );
  }
}

// ── Test 3: verifiable weakness + clean categories => strong opportunity ──
{
  const cats = JSON.parse(JSON.stringify(baseCategories));
  cats.booking = cat("not_found");
  cats.live_chat = cat("not_found");
  cats.whatsapp = cat("not_found");
  cats.crm = cat("not_found");        // verified negative, not unverifiable
  cats.email_marketing = cat("not_found");
  const result = evaluateOpportunities(cats, "Recruitment", true);
  const strong = result.opportunities.filter((o) => o.state === "strong_opportunity");
  check("verified gaps produce strong opportunities", strong.length >= 2, "count=" + strong.length);
  check("summaryLine reports the count", /identif/.test(result.summaryLine), result.summaryLine);
  for (const o of strong) {
    check(
      "strong opportunity carries mustConfirm questions",
      Array.isArray(o.mustConfirm) && o.mustConfirm.length >= 3,
      o.solution
    );
    check(
      "strong opportunity carries nextBestAction",
      typeof o.nextBestAction === "string" && o.nextBestAction.length > 10,
      o.solution
    );
  }
}

// ── Test 4: unreachable website => no opportunities, honest summary ──
{
  const cats = JSON.parse(JSON.stringify(baseCategories));
  const result = evaluateOpportunities(cats, "Real Estate", false);
  check("unreachable site yields zero opportunities", result.opportunities.length === 0, "count=" + result.opportunities.length);
  check("unreachable summary is honest", /could not be inspected/.test(result.summaryLine), result.summaryLine);
  check("noStrongOpportunity true when unreachable", result.noStrongOpportunity === true);
}

// ── Test 5: every opportunity names a pricing tier from the commercial model ──
{
  const cats = JSON.parse(JSON.stringify(baseCategories));
  cats.booking = cat("not_found");
  const result = evaluateOpportunities(cats, "Healthcare", true);
  const validTiers = new Set(["recovery_sprint", "growth_system", "scale_system", "custom"]);
  const allValid = result.opportunities.every((o) => validTiers.has(o.pricingTier));
  check("all opportunities carry a valid pricing tier", allValid, JSON.stringify(result.opportunities.map((o) => o.pricingTier)));
}

// ── Test 6: disqualified-when-strong path (chat present => no replacement pitch) ──
{
  const cats = JSON.parse(JSON.stringify(baseCategories));
  cats.live_chat = cat("found", "high", "Tawk.to");
  cats.whatsapp = cat("not_found");
  cats.booking = cat("not_found");
  const result = evaluateOpportunities(cats, "Legal Services", true);
  const opp = result.opportunities.find((o) => o.solution === "lead_response_capture");
  check(
    "existing chat provider blocks a replacement pitch (investigate, not strong)",
    !opp || opp.state === "investigate",
    opp ? "state=" + opp.state : "solution not offered"
  );
  if (opp) {
    check("disqualified path says do not pitch a replacement", /not pitch a replacement/.test(opp.nextBestAction), opp.nextBestAction);
  }
}

// ── Test 7: margin guardrails (unit economics) ──
{
  const { checkQuoteMargin, COMMERCIAL_TIERS } = require(findFile(OUT, "pricing-model.js"));
  // Underpriced Growth quote: 350k floor, but direct cost above ceiling.
  const bad = checkQuoteMargin({
    tier: "growth_system",
    quotedImplementation: 350_000,
    quotedCareMonthly: 100_000,
    estimatedDeliveryHours: 60,
    labourRatePerHour: 5_000,       // 300k labour alone -> way over 140k ceiling
    contractorCost: 0,
    clientInfrastructureMonthly: 0,
    apiSetupCost: 0,
    onboardingCost: 0,
    contingencyPercent: 10,
  });
  check("underpriced growth quote fails margin guardrail", bad.passes === false, JSON.stringify(bad.warnings));
  check("margin guardrail recommends renegotiation", /Do NOT silently accept/.test(bad.recommendation), bad.recommendation);

  // Healthy Sprint quote: 150k, 20h at 5k = 100k labour + 10% = 110k... over 60k ceiling.
  // Use realistic sprint hours: 10h = 50k + 10% = 55k <= 60k ceiling.
  const good = checkQuoteMargin({
    tier: "recovery_sprint",
    quotedImplementation: 150_000,
    quotedCareMonthly: 50_000,
    estimatedDeliveryHours: 10,
    labourRatePerHour: 5_000,
    contractorCost: 0,
    clientInfrastructureMonthly: 10_000,
    apiSetupCost: 0,
    onboardingCost: 0,
    contingencyPercent: 10,
  });
  check("healthy sprint quote passes margin guardrail", good.passes === true, JSON.stringify(good.warnings));

  // Tier floors are enforced
  const floor = checkQuoteMargin({
    tier: "recovery_sprint",
    quotedImplementation: 90_000,
    quotedCareMonthly: 50_000,
    estimatedDeliveryHours: 8,
    labourRatePerHour: 5_000,
    contractorCost: 0,
    clientInfrastructureMonthly: 0,
    apiSetupCost: 0,
    onboardingCost: 0,
    contingencyPercent: 0,
  });
  check("below-floor quote produces a floor warning", floor.warnings.some((w) => /below the/.test(w)), JSON.stringify(floor.warnings));
}

console.log("\n" + pass + " passed, " + failures.length + " failed");
if (failures.length) {
  console.log("FAILED: " + failures.join(" | "));
  process.exit(1);
}
