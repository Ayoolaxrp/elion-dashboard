import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Routes that require authentication
const protectedRoutes = [
  "/",
  "/leads",
  "/booking",
  "/followup",
  "/operations",
  "/recovery",
  "/admin",
];

// Routes that are always public
const publicRoutes = [
  "/landing",
  "/funnel",
  "/audit",
  "/demo",
  "/status",
  "/api/request",
  "/api/audit",
  "/api/demo",
  "/login",
  "/icon.svg",
  "/sitemap.xml",
];

function isProtectedRoute(pathname: string): boolean {
  // Check exact matches and prefix matches
  return protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );
}

function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some(
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
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // If Supabase is not configured, allow all routes (development mode)
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.next();
  }

  // For protected routes, check authentication
  if (isProtectedRoute(pathname)) {
    let response = NextResponse.next({
      request: { headers: request.headers },
    });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
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
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      // Redirect to login with return URL
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|brand|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
