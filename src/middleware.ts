import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Routes that require authentication + admin authorization
const ADMIN_ROUTES = [
  "/",
  "/leads",
  "/booking",
  "/followup",
  "/operations",
  "/recovery",
  "/admin",
];

// Admin email allowlist (from env var)
const ADMIN_EMAILS = (
  process.env.ADMIN_EMAILS || ""
)
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

function isAdminRoute(pathname: string): boolean {
  return ADMIN_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );
}

function isPublicRoute(pathname: string): boolean {
  const publicPaths = [
    "/landing",
    "/funnel",
    "/audit",
    "/demo",
    "/status",
    "/login",
    "/api/request",
    "/api/audit",
    "/api/demo",
  ];
  return publicPaths.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes through
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Allow static assets and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/brand") ||
    pathname.startsWith("/api/auth") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Check if Supabase is configured
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // Supabase not configured: block admin routes
    if (isAdminRoute(pathname)) {
      if (process.env.NODE_ENV === "production") {
        const loginUrl = request.nextUrl.clone();
        loginUrl.pathname = "/login";
        loginUrl.searchParams.set("error", "not_configured");
        return NextResponse.redirect(loginUrl);
      }
      // Development: warn but allow through
      console.warn(
        `[SECURITY] Admin route ${pathname} accessed without Supabase configured`
      );
    }
    return NextResponse.next();
  }

  // For admin routes, check authentication + authorization
  if (isAdminRoute(pathname)) {
    try {
      let response = NextResponse.next({
        request: { headers: request.headers },
      });

      const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            response = NextResponse.next({
              request: { headers: request.headers },
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      });

      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Not authenticated -> redirect to login
      if (!user) {
        const loginUrl = request.nextUrl.clone();
        loginUrl.pathname = "/login";
        loginUrl.searchParams.set("redirect", pathname);
        return NextResponse.redirect(loginUrl);
      }

      // Authenticated but not authorized -> redirect to login with error
      const isAllowed =
        ADMIN_EMAILS.length === 0 || // No allowlist = any user is admin (dev mode)
        user.user_metadata?.role === "admin" ||
        (user.email && ADMIN_EMAILS.includes(user.email.toLowerCase()));

      if (!isAllowed) {
        const loginUrl = request.nextUrl.clone();
        loginUrl.pathname = "/login";
        loginUrl.searchParams.set("error", "unauthorized");
        return NextResponse.redirect(loginUrl);
      }
    } catch (err) {
      // If middleware crashes, block admin routes (fail closed)
      console.error(`[SECURITY] Middleware error on ${pathname}:`, err);
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.searchParams.set("error", "auth_error");
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|brand|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
