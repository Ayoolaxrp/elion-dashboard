// Quote-economics enforcement tests — deterministic, no network.
// Run: node tests/commercial/run-margin.cjs
//
// Proves the acceptance gate:
//   - economically blind quote (no cost inputs) is rejected
//   - below-guardrail quote is rejected without a founder override
//   - below-guardrail quote is accepted WITH a logged founder override
//   - a substantive override reason is required
//   - within-guardrail quote is accepted without an override

const { execFileSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const ROOT = path.join(__dirname, "..", "..");
const OUT = path.join(__dirname, "compiled-margin");

if (!fs.existsSync(path.join(OUT, "margin-enforcement.js"))) {
  const tscBin = path.join(ROOT, "node_modules", "typescript", "bin", "tsc");
  execFileSync(process.execPath, [tscBin, "-p", path.join(__dirname, "tsconfig-margin.json")], {
    cwd: ROOT,
    stdio: "inherit",
  });
}

const { enforceProposalAcceptance } = require(path.join(OUT, "margin-enforcement.js"));
const { checkQuoteMargin, COMMERCIAL_TIERS } = require(path.join(OUT, "pricing-model.js"));

let pass = 0;
const failures = [];
const check = (name, cond, detail) => {
  if (cond) { pass++; console.log("PASS  " + name); }
  else { failures.push(name); console.log("FAIL  " + name + (detail ? " :: " + detail : "")); }
};

// ── Gate: economically blind quote ──
{
  const r = enforceProposalAcceptance({ marginCheck: null, costInputsPresent: false });
  check("blind quote (no cost inputs) is rejected", r.allowed === false && /economics required/.test(r.error), r.error);
  const r2 = enforceProposalAcceptance({ marginCheck: null, costInputsPresent: true });
  check("uncomputable margin is rejected even with inputs", r2.allowed === false, r2.error);
}

// ── Gate: below-guardrail quote ──
{
  const bad = checkQuoteMargin({
    tier: "growth_system",
    quotedImplementation: 350_000,
    quotedCareMonthly: 100_000,
    estimatedDeliveryHours: 60,
    labourRatePerHour: 5_000,
    contractorCost: 0,
    clientInfrastructureMonthly: 0,
    apiSetupCost: 0,
    onboardingCost: 0,
    contingencyPercent: 10,
  });
  check("fixture: growth quote is genuinely below guardrails", bad.passes === false, JSON.stringify(bad.warnings));

  const noOverride = enforceProposalAcceptance({
    marginCheck: bad,
    costInputsPresent: true,
  });
  check("below-guardrail quote rejected without override", noOverride.allowed === false && /Below margin guardrails/.test(noOverride.error), noOverride.error);
  check("rejection names the guardrail warnings", /direct cost/i.test(noOverride.error) || /ceiling/i.test(noOverride.error), noOverride.error);

  const weakOverride = enforceProposalAcceptance({
    marginCheck: bad,
    costInputsPresent: true,
    overrideReason: "ok",
  });
  check("non-substantive override reason is rejected", weakOverride.allowed === false, weakOverride.error);

  const withOverride = enforceProposalAcceptance({
    marginCheck: bad,
    costInputsPresent: true,
    overrideReason: "Client is a strategic reference account; accept below-guardrail for the pilot.",
  });
  check("founder override with substantive reason allows acceptance", withOverride.allowed === true && withOverride.marginStatus === "founder_override", JSON.stringify(withOverride));

  const passing = enforceProposalAcceptance({
    marginCheck: { passes: true, warnings: [], recommendation: "Within guardrails." },
    costInputsPresent: true,
  });
  check("within-guardrail quote accepted without override", passing.allowed === true && passing.marginStatus === "within_guardrails", JSON.stringify(passing));
}

// ── Sanity: guardrail ceilings exist per tier ──
{
  const sprint = COMMERCIAL_TIERS.find((t) => t.id === "recovery_sprint");
  check("sprint ceiling enforces 60% margin at floor", sprint.maxImplementationDirectCost === 60_000, String(sprint.maxImplementationDirectCost));
  check("sprint recurring ceiling enforces 70% margin at floor", sprint.maxRecurringDirectCostMonthly === 15_000, String(sprint.maxRecurringDirectCostMonthly));
}

console.log("\n" + pass + " passed, " + failures.length + " failed");
if (failures.length) {
  console.log("FAILED: " + failures.join(" | "));
  process.exit(1);
}