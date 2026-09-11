const assert = require("assert");
const fs = require("fs");
const path = require("path");
const ts = require("typescript");
const root = path.join(__dirname, "..", "..");

function loadTsModule(relative) {
  const filename = path.join(root, relative);
  const source = fs.readFileSync(filename, "utf8");
  const transpiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: filename,
  }).outputText;
  const module = { exports: {} };
  const localRequire = (request) => require(require.resolve(request, { paths: [root] }));
  Function("require", "module", "exports", transpiled)(localRequire, module, module.exports);
  return module.exports;
}

let passed = 0;
function check(name, fn) {
  try { fn(); passed++; console.log("PASS  " + name); }
  catch (error) { console.log("FAIL  " + name + " :: " + error.message); process.exitCode = 1; }
}

const structured = loadTsModule("src/lib/ai/structured-output.ts");
check("rejects prose as structured content", () => assert.throws(() => structured.parseStructuredOutput("not json", structured.validateContentOutput)));
check("rejects incomplete content output", () => assert.strictEqual(structured.validateContentOutput({ topic: "x" }).valid, false));
check("accepts valid content output", () => assert.strictEqual(structured.validateContentOutput({ source_event:"release", topic:"audit", angle:"lesson", hook:"hook", linkedin:"post", x_post:"post", instagram_caption:"caption", carousel_slides:[], reel_script:"script", cta:"learn", evidence_sources:["log"], status:"review" }).valid, true));
check("validates lead research confidence", () => assert.strictEqual(structured.validateLeadResearchOutput({ business:"B", industry:"real estate", location:"Lagos", website:"https://b.test", public_contacts:[], evidence:["page"], audit_status:"completed", opportunity:"investigate", confidence:0.8, unknowns:["owner process"] }).valid, true));
check("validates meeting arrays", () => assert.strictEqual(structured.validateMeetingOutput({ participants:[], problems:[], requirements:[], objections:[], commitments:[], next_actions:[], deadlines:[] }).valid, true));

const operating = loadTsModule("src/lib/ai/operating-model.ts");
check("external messages require approval", () => assert.strictEqual(operating.requiresHumanApproval(operating.ELION_OPERATING_WORKFLOWS.find((w) => w.id === "external-message")), true));
check("research is low-risk by default", () => assert.strictEqual(operating.ELION_OPERATING_WORKFLOWS.find((w) => w.id === "research").risk, "low"));

const prospect = loadTsModule("src/lib/prospect/qualification.ts");
check("normalizes prospect domains", () => assert.strictEqual(prospect.normalizeProspectWebsite("example.com/"), "https://example.com/"));
check("rejects private prospect hosts", () => assert.strictEqual(prospect.validateProspectCandidate({ business:"Test", website:"http://localhost:3000", source:"manual", sourceUrl:"https://source.example", retrievedAt:"2026-09-10" }).valid, false));
check("deduplicates by normalized domain", () => assert.strictEqual(prospect.prospectDeduplicationKey({ business:"A", website:"https://Example.com/path", source:"x", sourceUrl:"https://x", retrievedAt:"2026-09-10" }), "domain:example.com"));
check("blocks sales queue without audit", () => assert.strictEqual(prospect.canEnterSalesQueue({ validation:{ valid:true, reasons:[] }, auditCompleted:false, evidenceCount:1, confidence:0.9, opportunity:"investigate", contactPermission:"unknown" }).allowed, false));
check("blocks opted-out sales queue", () => assert.strictEqual(prospect.canEnterSalesQueue({ validation:{ valid:true, reasons:[] }, auditCompleted:true, evidenceCount:1, confidence:0.9, opportunity:"investigate", contactPermission:"opted_out" }).allowed, false));
check("allows reviewed investigation", () => assert.strictEqual(prospect.canEnterSalesQueue({ validation:{ valid:true, reasons:[] }, auditCompleted:true, evidenceCount:1, confidence:0.9, opportunity:"investigate", contactPermission:"unknown" }).allowed, true));

console.log(`\n${passed} passed`);
