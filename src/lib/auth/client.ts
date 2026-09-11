import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";

export interface ClientSession {
  user: User;
  clientId: string;
  organizationId: string;
  role: "owner" | "staff" | "client";
  db: SupabaseClient;
  client: {
    id: string;
    contact_name: string;
    email: string;
    company_name: string;
    onboarding_status: string;
    plan_name: string | null;
  };
}

/**
 * Resolve client portal access from the authenticated user's active
 * organization membership. Client IDs, emails and organization IDs are
 * deliberately never accepted from request input.
 *
 * A user with multiple client organizations is denied until the portal has an
 * explicit organization selector; silently choosing one would risk tenant
 * confusion. Admin/platform memberships do not grant client-portal access.
 */
export async function getClientSession(): Promise<ClientSession | null> {
  const cookieStore = await cookies();
  const auth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return null;

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const { data: memberships, error: membershipError } = await db
    .from("organization_memberships")
    .select("organization_id, role")
    .eq("user_id", user.id)
    .eq("status", "active");
  if (membershipError || !memberships?.length) return null;

  const eligible = memberships.filter((membership) =>
    ["owner", "staff", "client"].includes(String(membership.role))
  );
  if (!eligible.length) return null;

  const { data: organizations, error: organizationError } = await db
    .from("organizations")
    .select("id, client_id, org_type, status")
    .in("id", eligible.map((membership) => membership.organization_id))
    .eq("org_type", "client")
    .eq("status", "active")
    .not("client_id", "is", null);
  if (organizationError || !organizations?.length) return null;

  const clientIds = [...new Set(organizations.map((organization) => organization.client_id).filter(Boolean))] as string[];
  if (clientIds.length !== 1) return null;

  const organization = organizations.find((candidate) => candidate.client_id === clientIds[0]);
  const membership = eligible.find((candidate) => candidate.organization_id === organization?.id);
  if (!organization?.id || !membership) return null;

  const { data: client, error: clientError } = await db
    .from("clients")
    .select("id, contact_name, email, company_name, onboarding_status, plan_name")
    .eq("id", clientIds[0])
    .single();
  if (clientError || !client) return null;

  return {
    user,
    clientId: client.id,
    organizationId: organization.id,
    role: membership.role as ClientSession["role"],
    db,
    client,
  };
}
