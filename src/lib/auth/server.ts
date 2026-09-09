import { createClient } from "@supabase/supabase-js";

export type UserRole = "super_admin" | "admin" | "staff" | "client" | "owner";

export interface UserContext {
  userId: string;
  email: string | null;
  role: UserRole | null;
  organizationId: string | null;
  organizationName: string | null;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isClient: boolean;
}

let _supabase: ReturnType<typeof createClient> | null = null;

function getServiceClient() {
  if (!_supabase) {
    _supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return _supabase;
}

// Cache the admin email set for 60s so we don't hit the DB per request,
// while changes made in Admin > Settings take effect almost immediately.
let _adminEmailCache: { emails: Set<string>; fetchedAt: number } | null = null;

export async function getAdminEmails(): Promise<Set<string>> {
  if (_adminEmailCache && Date.now() - _adminEmailCache.fetchedAt < 60_000) {
    return _adminEmailCache.emails;
  }
  const emails = new Set<string>();
  // Bootstrap fallback from env (owner account) - works even if migration 026
  // has not been applied yet.
  (process.env.ADMIN_EMAILS || "awodeyiayoola@gmail.com")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
    .forEach((e) => emails.add(e));
  try {
    const supabase = getServiceClient();
    const { data } = await supabase.from("admin_directory").select("email");
    ((data || []) as Array<{ email: string | null }>).forEach((row) => {
      if (row.email) emails.add(String(row.email).trim().toLowerCase());
    });
  } catch {
    // Table missing or transient failure: env fallback is already loaded.
  }
  _adminEmailCache = { emails, fetchedAt: Date.now() };
  return emails;
}

export function invalidateAdminEmailCache(): void {
  _adminEmailCache = null;
}

/** Check an email against env + dynamic admin directory. */
export async function isAdminEmail(email: string | null | undefined): Promise<boolean> {
  if (!email) return false;
  const admins = await getAdminEmails();
  return admins.has(email.trim().toLowerCase());
}

export async function resolveUserContext(userId: string): Promise<UserContext> {
  const supabase = getServiceClient();
  const { data: { user } } = await supabase.auth.admin.getUserById(userId);

  const { data: memberships } = await supabase
    .from("organization_memberships")
    .select("role, organization_id, organizations(name)")
    .eq("user_id", userId)
    .eq("status", "active") as { data: { role: string; organization_id: string; organizations: { name: string } }[] | null };

  const rolePriority: Record<UserRole, number> = {
    super_admin: 1, admin: 2, owner: 3, staff: 4, client: 5,
  };

  let primaryRole: UserRole | null = null;
  let orgId: string | null = null;
  let orgName: string | null = null;

  if (memberships && memberships.length > 0) {
    const sorted = memberships.sort(
      (a: any, b: any) => (rolePriority[a.role as UserRole] || 99) - (rolePriority[b.role as UserRole] || 99)
    );
    primaryRole = sorted[0].role as UserRole;
    orgId = sorted[0].organization_id;
    orgName = sorted[0].organizations?.name || null;
  }

  if (!primaryRole) {
    const adminEmailMatch = user?.email ? await isAdminEmail(user.email) : false;
    if (adminEmailMatch) {
      primaryRole = "super_admin";
      orgId = "org_elion_platform";
      orgName = "ELION";
    }
  }

  return {
    userId,
    email: user?.email || null,
    role: primaryRole,
    organizationId: orgId,
    organizationName: orgName,
    isSuperAdmin: primaryRole === "super_admin",
    isAdmin: primaryRole === "super_admin" || primaryRole === "admin",
    isClient: primaryRole === "client" || primaryRole === "owner" || primaryRole === "staff",
  };
}

export function getPostLoginRedirect(role: UserRole | null, fallback: string = "/"): string {
  switch (role) {
    case "super_admin":
    case "admin":
      return "/admin";
    case "owner":
    case "staff":
    case "client":
      return fallback || "/";
    default:
      return "/login?error=unauthorized";
  }
}
