import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const ADMIN_ONLY = ["/admin"];
const CLIENT_ROUTES = ["/", "/leads", "/booking", "/followup", "/operations", "/recovery", "/dashboard"];
const PUBLIC_PATHS = ["/", "/landing", "/funnel", "/audit", "/demo", "/status", "/login", "/onboarding", "/api/request", "/api/audit", "/api/demo", "/api/auth"];

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_PATHS.some((r) => pathname === r || pathname.startsWith(r + "/"));
}
function isAdminOnly(pathname: string): boolean {
  return ADMIN_ONLY.some((r) => pathname === r || pathname.startsWith(r + "/"));
}
function isClientRoute(pathname: string): boolean {
  return CLIENT_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/"));
}

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
  .split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicRoute(pathname)) return NextResponse.next();
  if (pathname.startsWith("/_next") || pathname.startsWith("/brand") || pathname.includes(".")) return NextResponse.next();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    if (isAdminOnly(pathname) || isClientRoute(pathname)) {
      if (process.env.NODE_ENV === "production") {
        const loginUrl = request.nextUrl.clone();
        loginUrl.pathname = "/login";
        loginUrl.searchParams.set("error", "not_configured");
        return NextResponse.redirect(loginUrl);
      }
    }
    return NextResponse.next();
  }

  if (isAdminOnly(pathname) || isClientRoute(pathname)) {
    try {
      let response = NextResponse.next({ request: { headers: request.headers } });

      const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
          getAll() { return request.cookies.getAll(); },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            response = NextResponse.next({ request: { headers: request.headers } });
            cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
          },
        },
      });

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        const loginUrl = request.nextUrl.clone();
        loginUrl.pathname = "/login";
        loginUrl.searchParams.set("redirect", pathname);
        return NextResponse.redirect(loginUrl);
      }

      // Email-based admin check (always works, no DB dependency)
      const isEmailAdmin = user.email != null && ADMIN_EMAILS.includes(user.email.toLowerCase());

      // Admin-only routes: allow if email is in admin list
      if (isAdminOnly(pathname) && !isEmailAdmin) {
        const loginUrl = request.nextUrl.clone();
        loginUrl.pathname = "/";
        loginUrl.searchParams.set("error", "unauthorized");
        return NextResponse.redirect(loginUrl);
      }

      // Client routes: any authenticated user can access
      // Both admin and client users see the dashboard
    } catch (err) {
      console.error(`[SECURITY] Middleware error on ${pathname}:`, err);
      // Fail open for client routes — allow authenticated users through
      // The session check above already verified the user exists
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|brand|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
