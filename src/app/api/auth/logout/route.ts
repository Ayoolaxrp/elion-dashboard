import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  // CSRF protection: verify same-origin request
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && host && !origin.includes(host)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ success: true });
  }

  const response = NextResponse.json({ success: true });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return [];
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  await supabase.auth.signOut();

  response.cookies.delete("sb-access-token");
  response.cookies.delete("sb-refresh-token");

  return response;
}
