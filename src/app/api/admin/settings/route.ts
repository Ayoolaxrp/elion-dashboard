// Admin settings + account management API.
//
// Sections:
//   GET/POST /api/admin/settings               -> system config key-values
//   GET/POST /api/admin/settings?section=admins -> admin directory management
//   POST /api/admin/settings?section=account    -> change own email/password
//
// Auth: cookie-based Supabase session + admin gate (same as every other
// admin route). Admin emails come from env bootstrap + admin_directory table
// (migration 026), so granting/revoking admin takes effect without redeploy.
// Credential changes use the service-role admin API; passwords are never
// stored or logged here.

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { invalidateAdminEmailCache } from "@/lib/auth/server";

const getDataClient = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function requireAdmin() {
  const cookieStore = await cookies();
  const authClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return null;
  const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase());
  if (!adminEmails.includes((user.email || "").toLowerCase())) return null;
  return user;
}

// ── Allowed config keys (prevents arbitrary-key pollution) ──
const CONFIG_KEYS = [
  "company_name",
  "support_email",
  "support_phone",
  "whatsapp_number",
  "default_timezone",
] as const;
type ConfigKey = (typeof CONFIG_KEYS)[number];

const CONFIG_MAX_LEN: Record<ConfigKey, number> = {
  company_name: 120,
  support_email: 200,
  support_phone: 40,
  whatsapp_number: 40,
  default_timezone: 60,
};

async function readConfig(): Promise<Record<string, string>> {
  const sb = getDataClient();
  const out: Record<string, string> = {};
  try {
    const { data } = await sb.from("system_config").select("key,value");
    (data || []).forEach((row: { key: string; value: string | null }) => {
      if ((CONFIG_KEYS as readonly string[]).includes(row.key)) out[row.key] = row.value ?? "";
    });
  } catch {
    // table missing: fall through to defaults below
  }
  // Defaults for anything unset
  if (!out.company_name) out.company_name = "ELION";
  if (!out.support_email) out.support_email = "awodeyiayoola@gmail.com";
  if (!out.support_phone) out.support_phone = "09126281855";
  if (!out.whatsapp_number) out.whatsapp_number = "";
  if (!out.default_timezone) out.default_timezone = "Africa/Lagos";
  return out;
}

// ── System config (key-value) ──

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const section = new URL(req.url).searchParams.get("section") || "config";

  if (section === "config") {
    return NextResponse.json({ config: await readConfig() });
  }

  if (section === "admins") {
    const sb = getDataClient();
    const { data, error } = await sb.from("admin_directory").select("user_id,email,role,added_at,added_by").order("added_at", { ascending: true });
    if (error && !/admin_directory|relation/.test(error.message || "")) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    // Env-bootstrap admins are shown as immutable entries.
    const envAdmins = (process.env.ADMIN_EMAILS || "awodeyiawodeyi@gmail.com").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
    const tableEmails = new Set((data || []).map((r: { email: string }) => String(r.email).toLowerCase()));
    return NextResponse.json({
      admins: data || [],
      envAdmins: envAdmins.filter((e) => !tableEmails.has(e)),
    });
  }

  return NextResponse.json({ error: "Unknown section" }, { status: 400 });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const section = new URL(req.url).searchParams.get("section") || "config";
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const sb = getDataClient();

  // ── System config save ──
  if (section === "config") {
    const updates = Object.entries(body)
      .filter(([k]) => (CONFIG_KEYS as readonly string[]).includes(k))
      .map(([k, v]) => ({ key: k, value: String(v ?? "").slice(0, CONFIG_MAX_LEN[k as ConfigKey]), updated_by: admin.email, updated_at: new Date().toISOString() }));
    if (updates.length === 0) return NextResponse.json({ error: "No valid keys" }, { status: 400 });
    const { error } = await sb.from("system_config").upsert(updates, { onConflict: "key" });
    if (error) {
      if (/system_config|relation/.test(error.message || "")) {
        return NextResponse.json({ error: "Settings storage is not deployed yet (migration 026 pending)." }, { status: 503 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  // ── Admin directory: grant admin by email (user must already exist in auth) ──
  if (section === "admins") {
    const action = String(body.action || "");
    const email = String(body.email || "").trim().toLowerCase();

    if (action === "grant") {
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        return NextResponse.json({ error: "Valid email required" }, { status: 400 });
      }
      // Find the auth user by email via the admin API (paginated lookup).
      const { data: users } = await sb.auth.admin.listUsers({ perPage: 500 });
      const target = (users?.users || []).find((u: { email?: string | null }) => (u.email || "").toLowerCase() === email);
      if (!target) {
        return NextResponse.json({ error: `No auth user found with email ${email}. Ask them to sign up via /login first, or create the user with 'create'.` }, { status: 404 });
      }
      const { error } = await sb.from("admin_directory").upsert(
        { user_id: target.id, email, role: "admin", added_by: admin.email },
        { onConflict: "user_id" }
      );
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      invalidateAdminEmailCache();
      return NextResponse.json({ ok: true });
    }

    if (action === "revoke") {
      const envAdmins = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
      if (envAdmins.includes(email)) {
        return NextResponse.json({ error: "This admin is protected by the bootstrap env configuration and cannot be revoked here." }, { status: 400 });
      }
      if (email === (admin.email || "").toLowerCase()) {
        return NextResponse.json({ error: "You cannot revoke your own admin access." }, { status: 400 });
      }
      const { error } = await sb.from("admin_directory").delete().eq("email", email);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      invalidateAdminEmailCache();
      return NextResponse.json({ ok: true });
    }

    if (action === "create") {
      // Create a brand-new auth user with a temporary password; they must set a real one.
      const password = "ChangeMe-" + Math.random().toString(36).slice(2, 10) + "!7A";
      const { data: created, error: createErr } = await sb.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      if (createErr) return NextResponse.json({ error: createErr.message }, { status: 400 });
      const { error } = await sb.from("admin_directory").upsert(
        { user_id: created.user!.id, email, role: "admin", added_by: admin.email },
        { onConflict: "user_id" }
      );
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      invalidateAdminEmailCache();
      // Return the temp password ONCE over HTTPS to the authenticated admin.
      return NextResponse.json({ ok: true, temporaryPassword: password, note: "Share this with the new admin; they should change it immediately via Settings > Account." });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  // ── Account: change own email or password (self-service) ──
  if (section === "account") {
    const action = String(body.action || "");

    if (action === "change_email") {
      const newEmail = String(body.newEmail || "").trim().toLowerCase();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(newEmail)) {
        return NextResponse.json({ error: "Valid new email required" }, { status: 400 });
      }
      const { data: changed, error } = await sb.auth.admin.updateUserById(admin.id, { email: newEmail });
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      // Keep the admin directory in sync so access survives the email change.
      await sb.from("admin_directory").upsert(
        { user_id: admin.id, email: newEmail, role: "admin", added_by: admin.email },
        { onConflict: "user_id" }
      );
      invalidateAdminEmailCache();
      return NextResponse.json({ ok: true, newEmail: changed.user?.email });
    }

    if (action === "change_password") {
      const newPassword = String(body.newPassword || "");
      const currentPassword = String(body.currentPassword || "");
      if (newPassword.length < 10) {
        return NextResponse.json({ error: "New password must be at least 10 characters." }, { status: 400 });
      }
      // Verify current password before allowing the change.
      const verify = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { error: verifyErr } = await verify.auth.signInWithPassword({
        email: admin.email!,
        password: currentPassword,
      });
      if (verifyErr) {
        return NextResponse.json({ error: "Current password is incorrect." }, { status: 403 });
      }
      const { error } = await sb.auth.admin.updateUserById(admin.id, { password: newPassword });
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  return NextResponse.json({ error: "Unknown section" }, { status: 400 });
}
