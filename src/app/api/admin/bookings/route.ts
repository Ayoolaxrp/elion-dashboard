import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { getStoredTokens, googleConfigured } from "@/lib/google-calendar";

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

  const tokens = await getStoredTokens();
  const [upcoming, recent] = await Promise.all([
    sb
      .from("bookings")
      .select("*")
      .in("status", ["pending", "confirmed", "rescheduled"])
      .gte("start_at", new Date().toISOString())
      .order("start_at", { ascending: true })
      .limit(50),
    sb
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  return NextResponse.json({
    connection: {
      configured: googleConfigured(),
      connected: Boolean(tokens),
      account_email: tokens?.account_email || null,
    },
    upcoming: upcoming.data || [],
    recent: recent.data || [],
  });
}
