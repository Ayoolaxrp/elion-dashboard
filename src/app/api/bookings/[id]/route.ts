import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const email = new URL(request.url).searchParams.get("email")?.toLowerCase().trim();

  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );

  const { data: booking } = await sb
    .from("bookings")
    .select("id, customer_name, customer_email, timezone, start_at, end_at, status, calendar_event_id, google_meet_url, notes, created_at, cancellation_reason")
    .eq("id", id)
    .maybeSingle();

  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  if (!email || email !== (booking.customer_email || "").toLowerCase()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ booking });
}
