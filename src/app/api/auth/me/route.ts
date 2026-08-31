import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { resolveUserContext } from "@/lib/auth/server";

export async function GET() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll() {},
      },
    }
  );

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const ctx = await resolveUserContext(user.id);

  return NextResponse.json({
    userId: ctx.userId,
    email: ctx.email,
    role: ctx.role,
    organizationId: ctx.organizationId,
    organizationName: ctx.organizationName,
    isSuperAdmin: ctx.isSuperAdmin,
    isAdmin: ctx.isAdmin,
    isClient: ctx.isClient,
  });
}
