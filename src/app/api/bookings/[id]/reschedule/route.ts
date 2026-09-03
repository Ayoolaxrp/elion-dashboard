import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { freeBusy, moveEvent, getPrimaryCalendarId, getStoredTokens } from "@/lib/google-calendar";
import { loadBookingConfig } from "@/lib/bookings";

function isAdminEmail(email: string | undefined): boolean {
  if (!email) return false;
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .includes(email.toLowerCase());
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const start = String(body.start || "");
  if (!start || isNaN(Date.parse(start))) {
    return NextResponse.json({ error: "Please choose a new time slot." }, { status: 400 });
  }

  const cookieStore = await cookies();
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
  );
  const { data: { user } } = await sb.auth.getUser();
  const isAdmin = Boolean(user && isAdminEmail(user.email || undefined));

  const { data: booking } = await sb
    .from("bookings")
    .select("id, customer_email, status, calendar_id, calendar_event_id, timezone, client_id")
    .eq("id", id)
    .maybeSingle();
  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  const requesterEmail = String(body.email || "").toLowerCase().trim();
  const ownsBooking = requesterEmail && requesterEmail === (booking.customer_email || "").toLowerCase();
  if (!isAdmin && !ownsBooking) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!["confirmed", "rescheduled"].includes(booking.status)) {
    return NextResponse.json({ error: "Only confirmed bookings can be rescheduled." }, { status: 400 });
  }

  const cfg = await loadBookingConfig(booking.client_id);
  const startMs = Date.parse(start);
  const endMs = startMs + cfg.duration_min * 60000;
  const newStart = new Date(startMs);
  const newEnd = new Date(endMs);

  // Re-check availability on the new slot (scoped to the owning client's calendar).
  const tokens = await getStoredTokens(booking.client_id);
  if (!tokens) return NextResponse.json({ error: "Calendar is not connected." }, { status: 409 });
  const calendarId = booking.calendar_id || tokens.calendar_id || (await getPrimaryCalendarId(booking.client_id).catch(() => null));
  if (!calendarId) return NextResponse.json({ error: "Calendar is not connected." }, { status: 409 });

  const busy = await freeBusy(calendarId, new Date(startMs - 5 * 60000), new Date(endMs + 5 * 60000), booking.timezone || cfg.timezone, booking.client_id);
  const overlaps = busy.some((b) => Date.parse(b.start) < endMs && Date.parse(b.end) > startMs);
  if (overlaps) {
    return NextResponse.json({ error: "That time is no longer available. Please choose another slot.", code: "slot_unavailable" }, { status: 422 });
  }

  // Move the real calendar event first.
  try {
    await moveEvent(calendarId, booking.calendar_event_id, newStart, newEnd, booking.timezone || cfg.timezone, booking.client_id);
  } catch {
    return NextResponse.json({ error: "We could not update your booking on the calendar. Please try again." }, { status: 502 });
  }

  const { error } = await sb
    .from("bookings")
    .update({
      start_at: newStart.toISOString(),
      end_at: newEnd.toISOString(),
      status: "rescheduled",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, status: "rescheduled", start_at: newStart.toISOString(), end_at: newEnd.toISOString() });
}
