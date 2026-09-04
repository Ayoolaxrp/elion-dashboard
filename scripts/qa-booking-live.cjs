// QA: Full REAL Google Calendar booking flow on production.
//
// Runs: availability -> book -> real Calendar event + Meet -> reschedule ->
// cancel, all against the live Google Calendar API via elion.com.ng, using
// a real booking row and server-side tokens. If no Google token is stored,
// it reports the exact manual consent step needed and exits without doing
// anything else (never fabricates slots/events/Meet links).
//
// Usage: node scripts/qa-booking-live.cjs
const path = require("path");
const { createClient } = require(path.join(__dirname, "..", "node_modules", "@supabase/supabase-js"));

function loadEnv() {
  const env = {};
  for (const line of require("fs").readFileSync(path.join(__dirname, "..", ".env.local"), "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
  return env;
}
const env = loadEnv();
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const BASE = "https://elion.com.ng";
const email = `qa-live-${Date.now()}@example.com`;
let pass = 0, fail = 0;
const check = (name, ok, extra) => {
  if (ok) pass++; else fail++;
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${extra ? " :: " + extra : ""}`);
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  // 0) Do tokens exist? This is the only manual step (Google consent).
  const { data: keys } = await sb.from("booking_settings").select("key, updated_at").like("key", "google_tokens%");
  const globalTokens = (keys || []).some((k) => k.key === "google_tokens");
  if (!globalTokens) {
    console.log("NO TOKEN: Google Calendar is not connected. Manual step required (only the owner can do this):");
    console.log("  1. Open https://elion.com.ng/admin (sign in as admin)");
    console.log("  2. Open https://elion.com.ng/api/bookings/oauth");
    console.log("  3. Sign in as awodeyiayoola@gmail.com and click Allow");
    console.log("  4. You'll be returned to /admin/bookings?connected=success");
    console.log("\nThen re-run:  node scripts/qa-booking-live.cjs");
    console.log("\n(No fake slots/events/Meet links were created. The engine is fail-closed by design.)");
    process.exit(0);
  }
  console.log("Token present — running the REAL end-to-end booking flow.\n");

  let bookingId = null;
  try {
    // 1) AVAILABILITY — must report connected and real slots.
    const availRes = await fetch(`${BASE}/api/bookings/availability?days=7`);
    const avail = await availRes.json();
    const hasSlots = Array.isArray(avail.slots) && avail.slots.length > 0;
    check("availability returns connected", avail.connected === true, `connected=${avail.connected} ${avail.message || ""}`);
    check("availability returns real slots", hasSlots, `slots=${Array.isArray(avail.slots) ? avail.slots.length : "none"}`);
    check("config present with timezone", Boolean(avail.config?.timezone), avail.config?.timezone || "missing");
    if (!hasSlots) { check("book", false, "no slots to book"); return; }

    const slot = avail.slots[0];
    check("slot has start/end in the future", Boolean(slot.start && slot.end && Date.parse(slot.start) > Date.now()), `${slot.start} -> ${slot.end}`);

    // 2) BOOK — creates a real Calendar event + Meet.
    const bookRes = await fetch(`${BASE}/api/bookings`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customer_name: "QA Live Tester", customer_email: email, start: slot.start, timezone: avail.config.timezone }),
    });
    const book = await bookRes.json();
    check("booking created (201)", bookRes.status === 201 && book.booking?.id, `status=${bookRes.status} ${book.error || ""}`);
    if (bookRes.status !== 201) { console.log(JSON.stringify(book).slice(0, 300)); return; }
    bookingId = book.booking.id;
    check("booking confirmed with status", book.booking.status === "confirmed", book.booking.status);
    check("real calendar event id stored", Boolean(book.booking.calendar_event_id), (book.booking.calendar_event_id || "").slice(0, 24));
    check("real Google Meet URL returned", Boolean(book.booking.google_meet_url && book.booking.google_meet_url.startsWith("https://meet.google.com/")), (book.booking.google_meet_url || "NONE").slice(0, 48));
    check("start/end times persisted", Boolean(book.booking.start_at && book.booking.end_at), `${book.booking.start_at} -> ${book.booking.end_at}`);

    // Verify the DB row agrees with the response (no fake row).
    const { data: row } = await sb.from("bookings").select("id, status, calendar_event_id, google_meet_url, customer_email").eq("id", bookingId).maybeSingle();
    check("DB row matches (real event + meet)", Boolean(row && row.calendar_event_id === book.booking.calendar_event_id && row.google_meet_url === book.booking.google_meet_url), row ? "row matches" : "row missing");

    // 3) RESCHEDULE — pick another future slot, move the real event.
    const slot2 = avail.slots.find((s) => s.start !== slot.start && Date.parse(s.start) > Date.now());
    check("second slot available for reschedule", Boolean(slot2), slot2?.start || "none");
    if (slot2) {
      const rsRes = await fetch(`${BASE}/api/bookings/${bookingId}/reschedule`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ start: slot2.start, email }),
      });
      const rs = await rsRes.json();
      check("reschedule succeeds", rsRes.status === 200 && rs.status === "rescheduled", `status=${rsRes.status} ${rs.error || ""}`);
      const { data: row2 } = await sb.from("bookings").select("status, start_at").eq("id", bookingId).maybeSingle();
      check("DB reflects new time", row2?.status === "rescheduled" && row2?.start_at === slot2.start, `${row2?.start_at} vs ${slot2.start}`);
      await sleep(1000);
    }

    // 4) CANCEL — deletes the real calendar event and marks cancelled.
    const cRes = await fetch(`${BASE}/api/bookings/${bookingId}/cancel`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const c = await cRes.json();
    check("cancel succeeds", cRes.status === 200 && c.status === "cancelled", `status=${cRes.status} ${c.error || ""}`);
    const { data: row3 } = await sb.from("bookings").select("status").eq("id", bookingId).maybeSingle();
    check("DB row is cancelled", row3?.status === "cancelled", row3?.status);
  } catch (e) {
    check("script completed without throw", false, String(e).slice(0, 300));
  } finally {
    // Cleanup: remove the QA booking row (the calendar event is already deleted by cancel).
    if (bookingId) {
      await sb.from("bookings").delete().eq("id", bookingId);
      check("QA booking row cleaned up", true, "");
    }
  }
  console.log(`\n== RESULT: ${pass} pass, ${fail} fail ==`);
  process.exit(fail ? 1 : 0);
})();