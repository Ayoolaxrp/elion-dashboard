import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { authUrl, googleConfigured } from "@/lib/google-calendar";

function isAdmin(email: string | undefined): boolean {
  if (!email) return false;
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .includes(email.toLowerCase());
}

// Admin-only. Without ?client_id this connects ELION's own calendar
// (strategy calls). With ?client_id=<id> it connects the calendar for that
// client's Booking Automation — the reusable `booking` template gets its own
// per-client Google Calendar (per-client credentials). The client is carried
// in the OAuth state, never in the redirect URL, and must own a booking
// automation to be eligible.
export async function GET(request: Request) {
  const cookieStore = await cookies();
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
  );
  const { data: { user } } = await sb.auth.getUser();
  if (!user || !isAdmin(user.email || undefined)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!googleConfigured()) {
    return NextResponse.json(
      { error: "Google OAuth is not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET." },
      { status: 503 }
    );
  }

  const url = new URL(request.url);
  const clientId = url.searchParams.get("client_id");

  if (clientId) {
    // The client must exist and have a deployed/planned Booking Automation.
    const { data: auto } = await sb
      .from("client_automations")
      .select("id, workflow_templates(slug)")
      .eq("client_id", clientId)
      .limit(20);
    const hasBooking = (auto || []).some((a: any) => {
      const wt = Array.isArray(a.workflow_templates) ? a.workflow_templates[0] : a.workflow_templates;
      return wt?.slug === "booking";
    });
    if (!hasBooking) {
      return NextResponse.json(
        { error: "This client has no Booking Automation. Deploy one first." },
        { status: 400 }
      );
    }
  }

  const origin = request.headers.get("origin") || new URL(request.url).origin;
  const state = Buffer.from(JSON.stringify({ t: Date.now(), clientId: clientId || null })).toString("base64url");
  const redirect = authUrl(state, origin);
  return NextResponse.redirect(redirect);
}
