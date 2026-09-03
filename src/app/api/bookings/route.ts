import { NextResponse } from "next/server";
import { createBooking, BookingError, loadBookingConfig } from "@/lib/bookings";

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const customer_name = String(body.customer_name || "").trim();
  const customer_email = String(body.customer_email || "").trim().toLowerCase();
  const start = String(body.start || "");
  const timezone = String(body.timezone || "").trim();

  if (!customer_name || customer_name.length > 200) {
    return NextResponse.json({ error: "Please provide your name." }, { status: 400 });
  }
  if (!customer_email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer_email) || customer_email.length > 200) {
    return NextResponse.json({ error: "Please provide a valid email." }, { status: 400 });
  }
  if (!start || isNaN(Date.parse(start))) {
    return NextResponse.json({ error: "Please choose a time slot." }, { status: 400 });
  }
  const cfg = await loadBookingConfig();
  const tz = timezone || cfg.timezone;

  // Start must be in the future within the booking window.
  const startMs = Date.parse(start);
  if (startMs < Date.now()) {
    return NextResponse.json({ error: "That time has already passed." }, { status: 400 });
  }
  if (startMs > Date.now() + (cfg.max_window_days || 30) * 86400000) {
    return NextResponse.json({ error: "That date is outside the booking window." }, { status: 400 });
  }

  try {
    const booking = await createBooking({
      customer_name,
      customer_email,
      customer_phone: body.customer_phone ? String(body.customer_phone).slice(0, 60) : undefined,
      timezone: tz,
      start,
      notes: body.notes ? String(body.notes).slice(0, 2000) : undefined,
      client_id: body.client_id ? String(body.client_id) : null,
      lead_id: body.lead_id ? String(body.lead_id) : null,
      audit_id: body.audit_id ? String(body.audit_id) : null,
      opportunity_id: body.opportunity_id ? String(body.opportunity_id) : null,
    });
    return NextResponse.json({ success: true, booking }, { status: 201 });
  } catch (e) {
    if (e instanceof BookingError) {
      const status = e.code === "calendar_not_connected" ? 409 : 422;
      return NextResponse.json({ error: e.message, code: e.code }, { status });
    }
    return NextResponse.json(
      { error: "We could not complete your booking. Please try again or contact ELION." },
      { status: 500 }
    );
  }
}
