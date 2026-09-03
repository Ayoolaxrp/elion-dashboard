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

  const origin = request.headers.get("origin") || new URL(request.url).origin;
  const state = Buffer.from(JSON.stringify({ t: Date.now() })).toString("base64url");
  const redirect = authUrl(state, origin);
  return NextResponse.redirect(redirect);
}
