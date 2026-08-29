import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Admin email allowlist - only these emails can access admin routes
// In production, use Supabase user metadata or a database table
// For now, check if user has admin role in their metadata
const ADMIN_EMAILS = process.env.ADMIN_EMAILS?.split(",").map(e => e.trim().toLowerCase()) || [];

export function createSupabaseMiddleware(request: NextRequest) {
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

  return { supabase, response };
}

export async function isAdminUser(user: { email?: string; user_metadata?: Record<string, unknown> } | null): Promise<boolean> {
  if (!user) return false;
  
  // Check if user has admin role in metadata
  if (user.user_metadata?.role === "admin") return true;
  
  // Check if email is in admin allowlist
  if (user.email && ADMIN_EMAILS.includes(user.email.toLowerCase())) return true;
  
  // If no allowlist configured, any authenticated user is admin (development mode)
  if (ADMIN_EMAILS.length === 0) return true;
  
  return false;
}
