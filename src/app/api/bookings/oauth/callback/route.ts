import { NextResponse } from "next/server";
import { exchangeCode, googleConfigured, storeTokens } from "@/lib/google-calendar";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");
  const origin = process.env.NEXT_PUBLIC_SITE_URL || url.origin;

  if (error || !code) {
    return NextResponse.redirect(`${origin}/admin/bookings?connected=denied`);
  }
  if (!googleConfigured()) {
    return NextResponse.redirect(`${origin}/admin/bookings?connected=not_configured`);
  }

  try {
    const tokens = await exchangeCode(code, origin);
    await storeTokens(tokens);
    return NextResponse.redirect(`${origin}/admin/bookings?connected=success`);
  } catch (e) {
    console.error("Google OAuth callback failed:", e);
    return NextResponse.redirect(`${origin}/admin/bookings?connected=failed`);
  }
}
