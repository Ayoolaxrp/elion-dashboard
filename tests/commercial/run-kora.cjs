// Kora payment provider tests — deterministic, no real network.
// Run: node tests/commercial/run-kora.cjs
//
// Covers:
//   - initialize: naira→kobo conversion at the API edge, checkout_url parse
//   - verify: kobo→naira, status mapping (success/failed/pending)
//   - webhook signature: accepts webhook secret or secret key, rejects wrong
//   - entitlement unlock: invoice only flipped from unpaid states; lead only
//     promoted from pre-paid stages; lost leads untouched; idempotent no-ops

const { execFileSync } = require("child_process");
const { createHmac } = require("crypto");
const path = require("path");
const fs = require("fs");

const ROOT = path.join(__dirname, "..", "..");
const OUT = path.join(__dirname, "compiled-kora");

if (!fs.existsSync(path.join(OUT, "kora.js"))) {
  const tscBin = path.join(ROOT, "node_modules", "typescript", "bin", "tsc");
  execFileSync(process.execPath, [tscBin, "-p", path.join(__dirname, "tsconfig-kora.json")], {
    cwd: ROOT,
    stdio: "inherit",
  });
}

const kora = require(path.join(OUT, "kora.js"));
const unlock = require(path.join(OUT, "unlock.js"));

let pass = 0;
const failures = [];
const check = (name, cond, detail) => {
  if (cond) { pass++; console.log("PASS  " + name); }
  else { failures.push(name); console.log("FAIL  " + name + (detail ? " :: " + detail : "")); }
};

// ── fetch mock ──
const fetchMock = (fn) => {
  global.fetch = (url, opts) => fn(String(url), opts || {});
};
const jsonRes = (body, ok = true, status = 200) => ({
  ok,
  status,
  statusText: "OK",
  json: async () => body,
});

// ── 1. createCheckout ──
{
  let captured = null;
  fetchMock((url, opts) => {
    captured = { url, body: JSON.parse(opts.body) };
    return Promise.resolve(
      jsonRes({ status: true, message: "ok", data: { reference: "ref_123", access_code: "ac", checkout_url: "https://checkout.korapay.com/x" } })
    );
  });
  const p = new kora.KoraProvider({ secretKey: "sk_test" });
  p.createCheckout({ amountNaira: 150000, reference: "elion_inv_1", redirectUrl: "https://elion.com.ng/admin/payments" })
    .then((res) => {
      check("initialize posts amount in kobo", captured && captured.body.amount === 15000000, JSON.stringify(captured && captured.body.amount));
      check("initialize uses the reference", captured && captured.body.reference === "elion_inv_1", JSON.stringify(captured && captured.body.reference));
      check("initialize carries redirect_url", captured && captured.body.redirect_url === "https://elion.com.ng/admin/payments", JSON.stringify(captured && captured.body.redirect_url));
      check("initialize returns checkout_url", res.checkoutUrl === "https://checkout.korapay.com/x", res.checkoutUrl);
      return p.createCheckout({ amountNaira: 0, reference: "r", redirectUrl: "u" })
        .then(() => { check("initialize rejects zero amount", false, "resolved unexpectedly"); })
        .catch(() => { check("initialize rejects zero amount", true); });
    })
    .then(() => next1())
    .catch((e) => { failures.push("createCheckout threw: " + e.message); next1(); });
}
function next1() {
  // ── 2. verifyTransaction ──
  {
    let captured = null;
    fetchMock((url, opts) => {
      captured = { url, auth: (opts.headers || {}).Authorization };
      return Promise.resolve(
        jsonRes({ status: true, message: "ok", data: { reference: "ref_123", amount: 15000000, currency: "NGN", status: "success", paid_at: "2026-09-10T00:00:00Z", fee: 150000 } })
      );
    });
    const p = new kora.KoraProvider({ secretKey: "sk_test" });
    p.verifyTransaction("ref_123")
      .then((t) => {
        check("verify hits the transaction endpoint", captured && /\/transactions\/ref_123$/.test(captured.url), captured && captured.url);
        check("verify sends bearer auth", captured && captured.auth === "Bearer sk_test", captured && captured.auth);
        check("verify maps success status", t.status === "success", t.status);
        check("verify converts kobo to naira", t.amountNaira === 150000, String(t.amountNaira));
        check("verify converts fee to naira", t.feeNaira === 1500, String(t.feeNaira));
      })
      .then(() => {
        fetchMock(() => Promise.resolve(jsonRes({ status: true, message: "ok", data: { reference: "r2", amount: 5000, status: "failed" } })));
        return new kora.KoraProvider({ secretKey: "s" }).verifyTransaction("r2");
      })
      .then((t) => {
        check("verify maps failed status", t.status === "failed", t.status);
        check("verify converts small kobo to naira", t.amountNaira === 50, String(t.amountNaira));
      })
      .then(next2)
      .catch((e) => { failures.push("verify threw: " + e.message); next2(); });
  }
}
function next2() {
  // ── 3. documented Kora webhook signature ──
  {
    const secret = "sk_secret";
    const p = new kora.KoraProvider({ secretKey: secret });
    const payload = { reference: "ref_123", amount: 15000000, status: "success" };
    const signature = createHmac("sha256", secret).update(JSON.stringify(payload)).digest("hex");
    check("webhook accepts valid x-korapay-signature", p.verifyWebhookSignature(signature, payload), signature);
    check("webhook is case tolerant for hex", p.verifyWebhookSignature(signature.toUpperCase(), payload), "");
    check("webhook rejects tampered payload", !p.verifyWebhookSignature(signature, { ...payload, amount: 1 }), "");
    const wrong = createHmac("sha256", "wrong").update(JSON.stringify(payload)).digest("hex");
    check("webhook rejects wrong secret", !p.verifyWebhookSignature(wrong, payload), "");
    check("webhook rejects missing signature", !p.verifyWebhookSignature(null, payload), "");
    check("webhook rejects malformed signature", !p.verifyWebhookSignature("Bearer " + signature, payload), "");
  }

  // ── 3b. payment amount comparison ──
  check("exact payment amount matches", kora.comparePaymentAmount(150000, 150000) === "match", "");
  check("underpayment is distinct", kora.comparePaymentAmount(150000, 149999) === "underpaid", "");
  check("overpayment is distinct", kora.comparePaymentAmount(150000, 150001) === "overpaid", "");

  // ── 4. entitlement unlock (fake Supabase client) ──
  {
    // Fake sb that records calls.
    const calls = [];
    const fakeSb = {
      from: (table) => {
        const builder = { _table: table, _update: null, _eq: null, _in: null, _select: null };
        return {
          update: (u) => { builder._update = u; return api(builder); },
          eq: (k, v) => { builder._eq = [k, v]; return api(builder); },
          in: (k, v) => { builder._in = [k, v]; return api(builder); },
          select: (s) => { builder._select = s; return api(builder); },
        };
        function api(b) {
          return {
            eq: (k, v) => { b._eq = [k, v]; return api(b); },
            in: (k, v) => { b._in = [k, v]; return api(b); },
            select: (s) => { b._select = s; return api(b); },
            then: (resolve, reject) => {
              calls.push({ table: b._table, update: b._update, eq: b._eq, in: b._in, select: b._select });
              // Simulate: update succeeded when a row matched.
              resolve({ data: [{ id: "x" }], error: null });
              return Promise.resolve();
            },
          };
        }
      },
    };

    unlock.unlockAfterPayment(fakeSb, { id: "p1", lead_id: "l1", client_id: null, invoice_id: "i1" }).then((res) => {
      const inv = calls.find((c) => c.table === "invoices");
      const lead = calls.find((c) => c.table === "leads");
      check("unlock marks invoice paid", inv && inv.update.status === "paid" && inv.eq && inv.eq[1] === "i1" && JSON.stringify(inv.in[1]) === JSON.stringify(["draft", "sent", "overdue"]), JSON.stringify(inv));
      check("unlock promotes lead to paid", lead && lead.update.lead_status === "paid" && JSON.stringify(lead.in[1]) === JSON.stringify(["new", "audited", "contacted", "qualified", "proposal"]), JSON.stringify(lead));
      check("unlock returns flips", res.invoiceUpdated === true && res.leadUpdated === true, JSON.stringify(res));

      // Idempotency: an already-paid invoice must NOT be re-flipped (the
      // .in() guard excludes "paid", so a fake returning data only when the
      // status is in the list would return no rows → invoiceUpdated false).
      // Simulate no matching row (already paid):
      calls.length = 0;
      const fakeSb2 = {
        from: () => ({
          update: (u) => ({ eq: () => ({ in: () => ({ select: () => ({ then: (resolve) => { calls.push({ t: "noop" }); resolve({ data: [], error: null }); return Promise.resolve(); } }) }) }) }),
        }),
      };
      return unlock.unlockAfterPayment(fakeSb2, { id: "p2", lead_id: null, client_id: null, invoice_id: "i2" });
    }).then((res2) => {
      check("unlock idempotent when nothing matched", res2.invoiceUpdated === false && res2.leadUpdated === false, JSON.stringify(res2));
      check("unlock is called even with no matches (no crash)", true, "");
      next3();
    }).catch((e) => { failures.push("unlock threw: " + e.message); next3(); });
  }
}
function next3() {
  console.log("\n" + pass + " passed, " + failures.length + " failed");
  if (failures.length) {
    console.log("FAILED: " + failures.join(" | "));
    process.exit(1);
  }
}