import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Admin-only routes (super_admin + admin)
const ADMIN_ONLY = ["/admin"];

// Client dashboard routes (all authenticated users)
const CLIENT_ROUTES = ["/", "/leads", "/booking", "/followup", "/operations", "/recovery"];

// Public routes
const PUBLIC_PATHS = ["/landing", "/funnel", "/audit", "/demo", "/status", "/login", "/api/request", "/api/audit", "/api/demo"];

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_PATHS.some((r) => pathname === r || pathname.startsWith(r + "/"));
}

function isAdminOnly(pathname: string): boolean {
  return ADMIN_ONLY.some((r) => pathname === r || pathname.startsWith(r + "/"));
}

function isClientRoute(pathname: string): boolean {
  return CLIENT_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/"));
}

// Admin email allowlist (legacy fallback)
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

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

  // Check auth for admin-only and client routes
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

      // Resolve role from membership table
      const supabaseAdmin = createServerClient(
        supabaseUrl,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { cookies: { getAll() { return []; }, setAll() {} } }
      );

      const { data: memberships } = await supabaseAdmin
        .from("organization_memberships")
        .select("role")
        .eq("user_id", user.id)
        .eq("status", "active");

      // Determine highest role
      const rolePriority: Record<string, number> = {
        super_admin: 1, admin: 2, owner: 3, staff: 4, client: 5,
      };
      const roles = (memberships || []).map((m: { role: string }) => m.role);
      const highestRole = roles.sort((a, b) => (rolePriority[a] || 99) - (rolePriority[b] || 99))[0] || null;

      // Fallback: email-based admin check for legacy users
      let isAdmin = highestRole === "super_admin" || highestRole === "admin";
      if (!isAdmin && roles.length === 0) {
        isAdmin = user.email != null && ADMIN_EMAILS.includes(user.email.toLowerCase());
      }

      // Admin-only routes: require admin role
      if (isAdminOnly(pathname) && !isAdmin) {
        const loginUrl = request.nextUrl.clone();
        loginUrl.pathname = "/";
        loginUrl.searchParams.set("error", "unauthorized");
        return NextResponse.redirect(loginUrl);
      }

      // Client routes: any authenticated user can access
      // (both admin and client users see the dashboard)
    } catch (err) {
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
  matcher: ["/((?!_next/static|_next/image|favicon.ico|brand|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
