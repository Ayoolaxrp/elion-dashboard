// Shared booking domain logic (server-side).
// Availability is computed from the connected Google Calendar via Free/Busy —
// never fabricated. A booking is only created after the calendar event exists.

import { createServerClient } from "@supabase/ssr";
import {
  createEventWithMeet,
  deleteEvent,
  freeBusy,
  getPrimaryCalendarId,
  getStoredTokens,
  type CalendarEventInput,
  type CalendarEventResult,
} from "./google-calendar";

export interface BookingConfig {
  title: string;
  description?: string;
  duration_min: number;
  buffer_min: number;
  min_notice_min: number;
  max_window_days: number;
  timezone: string;
  working_hours: { start: string; end: string; days: string[]; weekends: boolean };
}

const DAY_ORDER = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

function dbClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}

export async function loadBookingConfig(clientId?: string | null): Promise<BookingConfig> {
  const sb = dbClient();
  const { data } = await sb.from("booking_settings").select("value").eq("key", "config").maybeSingle();
  const c = (data?.value || {}) as Partial<BookingConfig>;
  const base: BookingConfig = {
    title: c.title || "Strategy call with ELION",
    description: c.description || "",
    duration_min: c.duration_min ?? 30,
    buffer_min: c.buffer_min ?? 15,
    min_notice_min: c.min_notice_min ?? 120,
    max_window_days: c.max_window_days ?? 30,
    timezone: c.timezone || "Africa/Lagos",
    working_hours: {
      start: c.working_hours?.start || "09:00",
      end: c.working_hours?.end || "17:00",
      days: c.working_hours?.days?.length ? c.working_hours.days : ["mon", "tue", "wed", "thu", "fri"],
      weekends: c.working_hours?.weekends ?? false,
    },
  };

  // Per-client Booking Automation: settings come from the client's own
  // automation configuration (the reusable `booking` template deployed by
  // the admin wizard), falling back to ELION's defaults field by field.
  if (clientId) {
    const { data: auto } = await sb
      .from("client_automations")
      .select("custom_name, custom_config, workflow_templates(slug)")
      .eq("client_id", clientId)
      .order("created_at", { ascending: true })
      .limit(10);
    const row = (auto || []).find((a: any) => {
      const wt = Array.isArray(a.workflow_templates) ? a.workflow_templates[0] : a.workflow_templates;
      return wt?.slug === "booking";
    });
    if (row) {
      const cfg = (row.custom_config || {}) as Record<string, unknown>;
      const tz = String(cfg.timezone || "") || base.timezone;
      const dur = parseMinutes(String(cfg.duration || ""), 30);
      const buf = String(cfg.buffer || "").toLowerCase().includes("none") ? 0 : parseMinutes(String(cfg.buffer || ""), 15);
      const wh = parseWorkingHours(String(cfg.working_hours || ""));
      return {
        title: row.custom_name || "Book a call",
        description: base.description,
        duration_min: dur,
        buffer_min: buf,
        min_notice_min: base.min_notice_min,
        max_window_days: base.max_window_days,
        timezone: tz,
        working_hours: { start: wh.start, end: wh.end, days: wh.days, weekends: wh.weekends },
      };
    }
  }
  return base;
}

function parseMinutes(raw: string, fallback: number): number {
  const m = raw.match(/(\d+)/);
  return m ? Math.max(5, Math.min(240, Number(m[1]))) : fallback;
}

/** Parse "Mon-Fri 9:00 AM - 5:00 PM" style strings into working hours. */
function parseWorkingHours(raw: string): { start: string; end: string; days: string[]; weekends: boolean } {
  const DAYS: Record<string, string> = { mon: "mon", tue: "tue", wed: "wed", thu: "thu", fri: "fri", sat: "sat", sun: "sun" };
  const found: string[] = [];
  const low = raw.toLowerCase();
  for (const key of ["sun", "mon", "tue", "wed", "thu", "fri", "sat"]) {
    if (low.includes(key)) found.push(key);
  }
  const days = found.length ? found : ["mon", "tue", "wed", "thu", "fri"];
  const weekends = days.includes("sat") || days.includes("sun");
  const timeRe = /(\d{1,2})(?::(\d{2}))?\s*(am|pm)\s*-\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i;
  const tm = raw.match(timeRe);
  const to24 = (h: number, min: number, ampm: string) => {
    let hh = h % 12;
    if (ampm.toLowerCase() === "pm") hh += 12;
    return `${String(hh).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
  };
  return {
    start: tm ? to24(+tm[1], +(tm[2] || 0), tm[3]) : "09:00",
    end: tm ? to24(+tm[4], +(tm[5] || 0), tm[6]) : "17:00",
    days,
    weekends,
  };
}

export async function saveBookingConfig(cfg: BookingConfig) {
  const sb = dbClient();
  await sb.from("booking_settings").upsert(
    { key: "config", value: cfg, updated_at: new Date().toISOString() },
    { onConflict: "key" }
  );
}

// ---------------------------------------------------------------
// Timezone-safe conversion (DST-aware via Intl, no deps)
// ---------------------------------------------------------------
function zonedParts(tz: string, utcMs: number) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  });
  const p = Object.fromEntries(fmt.formatToParts(new Date(utcMs)).map((x) => [x.type, x.value]));
  return { y: +p.year, mo: +p.month - 1, d: +p.day, h: +p.hour, mi: +p.minute };
}

/** Convert local wall-clock (y/mo/d/h/mi in tz) to a UTC epoch ms. */
export function zonedWallToUtc(tz: string, y: number, mo: number, d: number, h: number, mi: number): number {
  // First pass: naive guess to learn the offset at that wall time.
  const guess = Date.UTC(y, mo, d, h, mi);
  const parts = zonedParts(tz, guess);
  const offsetGuess = guess - Date.UTC(parts.y, parts.mo, parts.d, parts.h, parts.mi);
  const candidate = guess - offsetGuess;
  // Second pass at the candidate instant to resolve DST transitions.
  const parts2 = zonedParts(tz, candidate);
  const offset = candidate - Date.UTC(parts2.y, parts2.mo, parts2.d, parts2.h, parts2.mi);
  return candidate - (offset - offsetGuess);
}

function toLocalDateStr(tz: string, utcMs: number): string {
  const p = zonedParts(tz, utcMs);
  return `${p.y}-${String(p.mo + 1).padStart(2, "0")}-${String(p.d).padStart(2, "0")}`;
}

/** Next date string (YYYY-MM-DD) after `dateStr` in tz terms. */
function nextDateStr(tz: string, dateStr: string): string {
  const [y, mo, d] = dateStr.split("-").map(Number);
  const utc = zonedWallToUtc(tz, y, mo - 1, d, 12, 0);
  return toLocalDateStr(tz, utc + 86400000);
}

function dayIndex(dateStr: string): number {
  return new Date(dateStr + "T00:00:00Z").getUTCDay();
}

export interface Slot {
  start: string; // UTC ISO
  end: string; // UTC ISO
  localTime: string; // "09:30" in booking tz
  date: string; // YYYY-MM-DD local
}

export interface AvailabilityResult {
  connected: boolean;
  reason?: string;
  account_email?: string | null;
  timezone: string;
  duration_min: number;
  slots: Slot[];
}

/** Generate candidate slots across [dateStart, dateEnd] (local dates inclusive), then
 *  subtract Google Free/Busy busy periods and minimum-notice windows.
 *  Pass clientId to compute availability on that client's Booking Automation
 *  calendar (per-client tokens + per-client configuration).
 */
export async function computeAvailability(
  dateStart: string,
  dateEnd: string,
  clientId?: string | null
): Promise<AvailabilityResult> {
  const cfg = await loadBookingConfig(clientId);
  const tokens = await getStoredTokens(clientId);
  if (!tokens) {
    return {
      connected: false,
      reason: "calendar_not_connected",
      timezone: cfg.timezone,
      duration_min: cfg.duration_min,
      slots: [],
    };
  }

  const calendarId = tokens.calendar_id || (await getPrimaryCalendarId(clientId).catch(() => null));
  if (!calendarId) {
    return {
      connected: false,
      reason: "calendar_unavailable",
      account_email: tokens.account_email || null,
      timezone: cfg.timezone,
      duration_min: cfg.duration_min,
      slots: [],
    };
  }

  const now = Date.now();
  const minNoticeMs = cfg.min_notice_min * 60000;
  const stepMin = cfg.duration_min + cfg.buffer_min;
  const { start: whStart, end: whEnd } = cfg.working_hours;
  const [sh, sm] = whStart.split(":").map(Number);
  const [eh, em] = whEnd.split(":").map(Number);
  const whStartMin = sh * 60 + sm;
  const whEndMin = eh * 60 + em;

  const slots: Slot[] = [];

  let date = dateStart;
  let guard = 0;
  while (date <= dateEnd && guard < 40) {
    guard++;
    const dow = DAY_ORDER[dayIndex(date)];
    const isWeekend = dow === "sat" || dow === "sun";
    // Day is on if it is explicitly configured, or weekends are enabled and it is a weekend day.
    const dayOn = cfg.working_hours.weekends
      ? isWeekend || cfg.working_hours.days.includes(dow)
      : cfg.working_hours.days.includes(dow);

    if (dayOn) {
      const [y, mo, d] = date.split("-").map(Number);
      // Busy windows for this calendar day (UTC window covering the full local day).
      const dayStartUtc = zonedWallToUtc(cfg.timezone, y, mo - 1, d, 0, 0);
      const dayEndUtc = zonedWallToUtc(cfg.timezone, y, mo - 1, d, 23, 59);
      const busy = await freeBusy(calendarId, new Date(dayStartUtc), new Date(dayEndUtc), cfg.timezone, clientId);
      const busyMs: Array<[number, number]> = busy.map((b) => [Date.parse(b.start), Date.parse(b.end)]);

      for (let t = whStartMin; t + cfg.duration_min <= whEndMin; t += stepMin) {
        const h = Math.floor(t / 60);
        const mi = t % 60;
        const start = zonedWallToUtc(cfg.timezone, y, mo - 1, d, h, mi);
        const end = start + cfg.duration_min * 60000;
        if (start < now + minNoticeMs) continue;
        // Overlap check against busy periods (allowing no overlap at all).
        const overlaps = busyMs.some(([bs, be]) => start < be && end > bs);
        if (overlaps) continue;
        slots.push({
          start: new Date(start).toISOString(),
          end: new Date(end).toISOString(),
          localTime: `${String(h).padStart(2, "0")}:${String(mi).padStart(2, "0")}`,
          date,
        });
      }
    }
    date = nextDateStr(cfg.timezone, date);
  }

  return {
    connected: true,
    account_email: tokens.account_email || null,
    timezone: cfg.timezone,
    duration_min: cfg.duration_min,
    slots,
  };
}

// ---------------------------------------------------------------
// Booking creation — the gate: real calendar event BEFORE any row
// ---------------------------------------------------------------
export interface NewBookingInput {
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  timezone: string;
  start: string; // UTC ISO
  end?: string;
  notes?: string;
  client_id?: string | null;
  lead_id?: string | null;
  audit_id?: string | null;
  opportunity_id?: string | null;
}

export interface CreatedBooking {
  id: string;
  calendar_event_id: string;
  google_meet_url: string | null;
  start_at: string;
  end_at: string;
  timezone: string;
}

export async function createBooking(input: NewBookingInput, clientId?: string | null): Promise<CreatedBooking> {
  const cfg = await loadBookingConfig(clientId);
  const tokens = await getStoredTokens(clientId);
  if (!tokens) throw new BookingError("calendar_not_connected", "Google Calendar is not connected yet.");

  const start = new Date(input.start);
  const durationMs = cfg.duration_min * 60000;
  const end = new Date(start.getTime() + durationMs);

  const calendarId = tokens.calendar_id || (await getPrimaryCalendarId(clientId));
  const tz = input.timezone || cfg.timezone;

  // 1) Re-check availability for this exact slot (double-booking protection).
  const busy = await freeBusy(calendarId, new Date(start.getTime() - 5 * 60000), new Date(end.getTime() + 5 * 60000), tz, clientId);
  const overlaps = busy.some((b) => Date.parse(b.start) < end.getTime() && Date.parse(b.end) > start.getTime());
  if (overlaps) throw new BookingError("slot_unavailable", "That time was just booked. Please choose another slot.");

  // 2) Create the calendar event with a Google Meet conference. Failure => no booking.
  const eventInput: CalendarEventInput = {
    summary: cfg.title,
    description: (cfg.description || "") + (input.notes ? `\n\nNotes: ${input.notes}` : ""),
    start,
    end,
    timeZone: tz,
    attendeeEmail: input.customer_email,
    attendeeName: input.customer_name,
  };
  let event: CalendarEventResult;
  try {
    event = await createEventWithMeet(calendarId, eventInput, clientId);
  } catch (e) {
    throw new BookingError(
      "calendar_event_failed",
      "We could not create the calendar event. Please try again or contact ELION."
    );
  }

  // 3) Persist AFTER the event exists; roll the event back if the insert fails.
  const sb = dbClient();
  const { data, error } = await sb
    .from("bookings")
    .insert({
      customer_name: input.customer_name,
      customer_email: input.customer_email,
      customer_phone: input.customer_phone || null,
      timezone: tz,
      start_at: start.toISOString(),
      end_at: end.toISOString(),
      duration_min: cfg.duration_min,
      status: "confirmed",
      calendar_provider: "google_calendar",
      calendar_id: calendarId,
      calendar_event_id: event.eventId,
      google_meet_url: event.hangoutLink || null,
      notes: input.notes || null,
      client_id: input.client_id || null,
      lead_id: input.lead_id || null,
      audit_id: input.audit_id || null,
      opportunity_id: input.opportunity_id || null,
    })
    .select("id, status, calendar_event_id, google_meet_url, start_at, end_at, timezone")
    .single();

  if (error || !data) {
    // Roll back the calendar event (best effort).
    try {
      await deleteEventSafe(calendarId, event.eventId, clientId);
    } catch {
      // ignore
    }
    const isDuplicate = String(error?.message || "").includes("idx_bookings_slot_once");
    throw new BookingError(
      isDuplicate ? "slot_unavailable" : "booking_save_failed",
      isDuplicate ? "That time was just booked. Please choose another slot." : "We could not save your booking."
    );
  }

  const booking = data as CreatedBooking;

  // Confirmation email — sent only now that the booking is REAL (calendar
  // event exists + row persisted). Delivery failure never changes the
  // booking outcome; it is logged so it can be retried.
  try {
    const { sendBookingConfirmationEmail } = await import("@/lib/emails/sender");
    await sendBookingConfirmationEmail(input.customer_email, {
      customer_name: input.customer_name,
      summary: cfg.title,
      start_at: booking.start_at,
      end_at: booking.end_at,
      timezone: booking.timezone,
      meet_url: booking.google_meet_url,
      booking_id: booking.id,
      host: clientId ? cfg.title : "ELION",
    });
  } catch (emailErr) {
    console.error("[BOOKINGS] Confirmation email failed (booking still confirmed):", emailErr);
  }

  return booking;
}

async function deleteEventSafe(calendarId: string, eventId: string, clientId?: string | null) {
  try {
    await deleteEvent(calendarId, eventId, clientId);
  } catch {
    // ignore
  }
}

export class BookingError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}
