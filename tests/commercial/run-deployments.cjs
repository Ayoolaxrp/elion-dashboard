// n8n deployment model tests — deterministic, no network.
// Run: node tests/commercial/run-deployments.cjs
//
// Covers:
//   - execution estimation (driven by demand, not workflow count)
//   - ELION Care classification (included vs change request/upsell)
//   - client-owned deployment readiness gate
//   - vendor-cost register economics (ELION never finances by accident)

const { execFileSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const ROOT = path.join(__dirname, "..", "..");
const OUT = path.join(__dirname, "compiled-deployments");

if (!fs.existsSync(path.join(OUT, "deployments.js"))) {
  const tscBin = path.join(ROOT, "node_modules", "typescript", "bin", "tsc");
  execFileSync(process.execPath, [tscBin, "-p", path.join(__dirname, "tsconfig-deployments.json")], {
    cwd: ROOT,
    stdio: "inherit",
  });
}

const { estimateMonthlyExecutions, classifyCareRequest, validateDeploymentReadiness, INFRASTRUCTURE_CHECKLIST } = require(path.join(OUT, "deployments.js"));
const { evaluateVendorCostRegister } = require(path.join(OUT, "vendor-costs.js"));

let pass = 0;
const failures = [];
const check = (name, cond, detail) => {
  if (cond) { pass++; console.log("PASS  " + name); }
  else { failures.push(name); console.log("FAIL  " + name + (detail ? " :: " + detail : "")); }
};

// ── Execution estimation ──
{
  const e = estimateMonthlyExecutions({
    scheduledRunsPerDay: 1,
    webhookRunsPerMonth: 2000,
    messageRunsPerMonth: 500,
    backgroundRunsPerMonth: 30,
    retryFactor: 1.2,
  });
  const expected = Math.round(1 * 30) + Math.round(2000 * 1.2) + Math.round(500 * 1.2) + Math.round(30 * 1.2);
  check("estimate sums all drivers", e.estimatedMonthlyExecutions === expected, e.estimatedMonthlyExecutions + " vs " + expected);
  check("estimate records assumptions", e.assumptions.length >= 5, e.assumptions.length);
  check("plan band derived from volume", typeof e.planBand === "string", e.planBand);

  const zero = estimateMonthlyExecutions({});
  check("empty estimate is 0 with honest note", zero.estimatedMonthlyExecutions === 0 && zero.assumptions.some((a) => /0 until drivers/.test(a)), JSON.stringify(zero));
  const large = estimateMonthlyExecutions({ webhookRunsPerMonth: 60000, retryFactor: 1 });
  check("high volume maps to enterprise band", large.planBand === "enterprise", large.planBand);
}

// ── ELION Care classification ──
{
  const incident = classifyCareRequest({ isOutage: true, isDefectInShippedWorkflow: false, isRoutineTuning: false, isMinorConfig: false, isNewIntegration: false, isNewWorkflow: false, isMajorScopeExpansion: false });
  check("outage is an included incident", incident.included === true && incident.type === "incident", JSON.stringify(incident));
  const bug = classifyCareRequest({ isOutage: false, isDefectInShippedWorkflow: true, isRoutineTuning: false, isMinorConfig: false, isNewIntegration: false, isNewWorkflow: false, isMajorScopeExpansion: false });
  check("defect in shipped workflow is included bug", bug.included === true && bug.type === "bug", JSON.stringify(bug));
  const minor = classifyCareRequest({ isOutage: false, isDefectInShippedWorkflow: false, isRoutineTuning: false, isMinorConfig: true, isNewIntegration: false, isNewWorkflow: false, isMajorScopeExpansion: false });
  check("minor config is included", minor.included === true && minor.type === "included_change", JSON.stringify(minor));
  const upsell = classifyCareRequest({ isOutage: false, isDefectInShippedWorkflow: false, isRoutineTuning: false, isMinorConfig: false, isNewIntegration: true, isNewWorkflow: false, isMajorScopeExpansion: false });
  check("new integration is NOT included (upsell)", upsell.included === false && upsell.type === "new_workflow", JSON.stringify(upsell));
  const newWorkflow = classifyCareRequest({ isOutage: false, isDefectInShippedWorkflow: false, isRoutineTuning: false, isMinorConfig: false, isNewIntegration: false, isNewWorkflow: true, isMajorScopeExpansion: false });
  check("new workflow is NOT included (upsell)", newWorkflow.included === false, JSON.stringify(newWorkflow));
}

// ── Deployment readiness gate ──
{
  const incomplete = validateDeploymentReadiness({
    billingOwner: null,
    elionAccessState: "none",
    workflowVersion: null,
    lastTestedAt: null,
    outstandingImplementationBalance: 100000,
  });
  check("incomplete deployment is NOT ready", incomplete.ready === false, JSON.stringify(incomplete));
  check("missing list names the gaps", incomplete.missing.length >= 4, JSON.stringify(incomplete.missing));

  const ready = validateDeploymentReadiness({
    billingOwner: "client",
    elionAccessState: "granted",
    workflowVersion: "v1.2",
    lastTestedAt: "2026-09-10T00:00:00Z",
    deploymentState: "live",
    outstandingImplementationBalance: 0,
  });
  check("complete client-owned deployment is ready", ready.ready === true, JSON.stringify(ready));

  const balanceBlock = validateDeploymentReadiness({
    billingOwner: "client",
    elionAccessState: "granted",
    workflowVersion: "v1",
    lastTestedAt: "2026-09-10T00:00:00Z",
    deploymentState: "testing",
    outstandingImplementationBalance: 50000,
  });
  check("outstanding balance blocks go-live", balanceBlock.ready === false && balanceBlock.missing.some((m) => /balance/.test(m)), JSON.stringify(balanceBlock.missing));
}

// ── Vendor-cost register ──
{
  const r = evaluateVendorCostRegister([
    { vendor: "n8n", service: "orchestration", billingOwner: "client", currency: "NGN", fixedFee: 30000 },
    { vendor: "OpenAI", service: "AI", billingOwner: "client", currency: "NGN", fixedFee: 20000 },
    { vendor: "Supabase", service: "db", billingOwner: "elion", currency: "NGN", fixedFee: 15000 },
  ]);
  check("client-paid vendors stay client-paid", r.clientPaidMonthly === 50000, String(r.clientPaidMonthly));
  check("elion-paid vendor is surfaced", r.elionPaidMonthly === 15000, String(r.elionPaidMonthly));
  check("elion-paid vendor warns about direct cost", r.warnings.some((w) => /ELION pays/.test(w)), JSON.stringify(r.warnings));

  const unbounded = evaluateVendorCostRegister([
    { vendor: "OpenAI", service: "AI", billingOwner: "elion", currency: "NGN" },
  ]);
  check("unbounded elion-paid usage is flagged", unbounded.warnings.some((w) => /Unbounded/.test(w)), JSON.stringify(unbounded.warnings));
}

// ── Checklist sanity ──
check("infrastructure checklist exists and defaults to client ownership", INFRASTRUCTURE_CHECKLIST.length >= 5 && INFRASTRUCTURE_CHECKLIST.every((i) => i.defaultOwner === "client"), INFRASTRUCTURE_CHECKLIST.length + " providers");

console.log("\n" + pass + " passed, " + failures.length + " failed");
if (failures.length) {
  console.log("FAILED: " + failures.join(" | "));
  process.exit(1);
}