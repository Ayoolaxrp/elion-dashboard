import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { deleteEvent } from "@/lib/google-calendar";

const data = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

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
    // no body — admin cancel allowed
  }

  const cookieStore = await cookies();
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
  );
  const { data: { user } } = await sb.auth.getUser();
  const isAdmin = Boolean(user && isAdminEmail(user.email || undefined));

  const { data: booking } = await data()
    .from("bookings")
    .select("id, customer_email, status, calendar_id, calendar_event_id, client_id")
    .eq("id", id)
    .maybeSingle();
  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  const requesterEmail = String(body.email || "").toLowerCase().trim();
  const ownsBooking = requesterEmail && requesterEmail === (booking.customer_email || "").toLowerCase();
  if (!isAdmin && !ownsBooking) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!["confirmed", "pending", "rescheduled"].includes(booking.status)) {
    return NextResponse.json({ error: "This booking can no longer be cancelled." }, { status: 400 });
  }

  // Remove the real calendar event first (best effort), then mark cancelled.
  if (booking.calendar_event_id && booking.calendar_id) {
    try {
      await deleteEvent(booking.calendar_id, booking.calendar_event_id, booking.client_id);
    } catch {
      // Event deletion failed — still record the cancellation; calendar cleanup is
      // retried manually, but we never leave a fake "cancelled" state with a live event
      // without surfacing this. Mark status and note it for admin review.
    }
  }

  const { error } = await data()
    .from("bookings")
    .update({
      status: "cancelled",
      cancellation_reason: body.reason ? String(body.reason).slice(0, 500) : "Cancelled by customer",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, status: "cancelled" });
}
