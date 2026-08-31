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
    const isAdminEmail =
      user?.email &&
      (process.env.ADMIN_EMAILS || "")
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .includes(user.email.toLowerCase());
    if (isAdminEmail) {
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
