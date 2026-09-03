import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { loadBookingConfig, saveBookingConfig, type BookingConfig } from "@/lib/bookings";

function isAdminEmail(email: string | undefined): boolean {
  if (!email) return false;
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .includes(email.toLowerCase());
}

export async function GET() {
  const cookieStore = await cookies();
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
  );
  const { data: { user } } = await sb.auth.getUser();
  if (!user || !isAdminEmail(user.email || undefined)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const config = await loadBookingConfig();
  return NextResponse.json({ config });
}

export async function PUT(request: Request) {
  const cookieStore = await cookies();
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
  );
  const { data: { user } } = await sb.auth.getUser();
  if (!user || !isAdminEmail(user.email || undefined)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await loadBookingConfig();
  let b: Record<string, unknown>;
  try {
    b = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const clamp = (v: unknown, lo: number, hi: number, dflt: number) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return dflt;
    return Math.min(hi, Math.max(lo, Math.round(n)));
  };

  const daysRaw = Array.isArray(b.days) ? b.days.map(String) : existing.working_hours.days;
  const validDays = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
  const days = daysRaw.filter((d) => validDays.includes(d));

  const config: BookingConfig = {
    title: typeof b.title === "string" && b.title.trim() ? b.title.trim().slice(0, 120) : existing.title,
    description: typeof b.description === "string" ? b.description.slice(0, 2000) : existing.description,
    duration_min: clamp(b.duration_min, 15, 240, existing.duration_min),
    buffer_min: clamp(b.buffer_min, 0, 120, existing.buffer_min),
    min_notice_min: clamp(b.min_notice_min, 0, 10080, existing.min_notice_min),
    max_window_days: clamp(b.max_window_days, 1, 60, existing.max_window_days),
    timezone: typeof b.timezone === "string" && b.timezone ? b.timezone.slice(0, 60) : existing.timezone,
    working_hours: {
      start: typeof b.start === "string" && /^\d{2}:\d{2}$/.test(b.start) ? b.start : existing.working_hours.start,
      end: typeof b.end === "string" && /^\d{2}:\d{2}$/.test(b.end) ? b.end : existing.working_hours.end,
      days: days.length ? days : existing.working_hours.days,
      weekends: b.weekends === true || b.weekends === "true",
    },
  };

  await saveBookingConfig(config);
  return NextResponse.json({ success: true, config });
}
