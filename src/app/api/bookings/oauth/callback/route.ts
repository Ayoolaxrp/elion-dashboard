import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import {
  attachAccountInfo,
  exchangeCode,
  googleConfigured,
  storeTokens,
  verifyOAuthState,
} from "@/lib/google-calendar";

// Google OAuth callback for the booking engine. Handles both scopes:
//   - global (ELION's calendar for /landing/book strategy calls)
//   - ?client_id in state → that client's Booking Automation calendar
// Tokens are stored server-side only, scoped per client, and the client's
// calendar integration status is synced so dashboards reflect reality.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");
  const origin = process.env.NEXT_PUBLIC_SITE_URL || url.origin;

  // Verify the signed state (HMAC + expiry). A tampered/expired state fails
  // closed to the global bookings page : it can never steer token storage
  // toward a client scope chosen by an attacker.
  const verified = verifyOAuthState(url.searchParams.get("state"));
  const clientId = verified?.clientId || null;
  const target = clientId ? `${origin}/admin/bookings?client=${encodeURIComponent(clientId)}` : `${origin}/admin/bookings`;

  if (error || !code) {
    return NextResponse.redirect(`${target}${target.includes("?") ? "&" : "?"}connected=denied`);
  }
  if (!googleConfigured()) {
    return NextResponse.redirect(`${target}${target.includes("?") ? "&" : "?"}connected=not_configured`);
  }

  try {
    const tokens = await exchangeCode(code, origin);
    await attachAccountInfo(tokens, clientId);
    await storeTokens(tokens, clientId);

    // Keep the client's calendar integration status truthful.
    if (clientId) {
      const sb = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { cookies: { getAll: () => [], setAll: () => {} } }
      );
      await sb.from("integration_credentials").upsert(
        {
          client_id: clientId,
          integration_type: "calendar",
          status: "connected",
          health: "healthy",
          last_verified_at: new Date().toISOString(),
        },
        { onConflict: "client_id,integration_type" }
      );
    }
    return NextResponse.redirect(`${target}${target.includes("?") ? "&" : "?"}connected=success`);
  } catch (e) {
    console.error("Google OAuth callback failed:", e);
    return NextResponse.redirect(`${target}${target.includes("?") ? "&" : "?"}connected=failed`);
  }
}
