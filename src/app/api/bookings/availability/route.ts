import { NextResponse } from "next/server";
import { computeAvailability, loadBookingConfig } from "@/lib/bookings";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const cfg = await loadBookingConfig();

    // Local-date range in the booking timezone. Default: today .. +7 days.
    const requested = Math.min(Math.max(parseInt(url.searchParams.get("days") || "7", 10) || 7, 1), 30);
    const days = Math.min(requested, cfg.max_window_days || 30);

    const tz = cfg.timezone;
    const nowParts = new Intl.DateTimeFormat("en-CA", {
      timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit",
    }).format(new Date());
    let start = url.searchParams.get("start") || nowParts; // YYYY-MM-DD local

    // Clamp start to today if a past date was supplied.
    if (start < nowParts) start = nowParts;

    // Compute end local date (start + days - 1).
    const [y, m, d] = start.split("-").map(Number);
    const dayMs = 86400000;
    const endDate = new Date(Date.UTC(y, m - 1, d) + (days - 1) * dayMs)
      .toISOString()
      .slice(0, 10);

    const result = await computeAvailability(start, endDate);
    return NextResponse.json({ ...result, config: { title: cfg.title, duration_min: cfg.duration_min, timezone: cfg.timezone } });
  } catch (e) {
    return NextResponse.json(
      { connected: false, reason: "availability_error", slots: [], message: "We could not check availability right now." },
      { status: 200 }
    );
  }
}
