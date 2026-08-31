-- ELION Multi-Tenancy Migration
-- Organizations, Memberships, Roles

-- ORGANIZATIONS
CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY DEFAULT ('org_' || gen_random_uuid()::text),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  org_type TEXT NOT NULL DEFAULT 'client' CHECK (org_type IN ('platform', 'client')),
  client_id TEXT UNIQUE REFERENCES clients(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  settings JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_orgs_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_orgs_type ON organizations(org_type);
CREATE INDEX IF NOT EXISTS idx_orgs_client ON organizations(client_id);

-- ORGANIZATION MEMBERSHIPS
CREATE TABLE IF NOT EXISTS organization_memberships (
  id TEXT PRIMARY KEY DEFAULT ('mem_' || gen_random_uuid()::text),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('super_admin', 'admin', 'staff', 'client', 'owner')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'invited')),
  invited_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  UNIQUE(user_id, organization_id)
);

CREATE INDEX IF NOT EXISTS idx_mem_user ON organization_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_mem_org ON organization_memberships(organization_id);
CREATE INDEX IF NOT EXISTS idx_mem_role ON organization_memberships(role);

-- USER PROFILES
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  display_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  timezone TEXT DEFAULT 'Africa/Lagos',
  language TEXT DEFAULT 'en',
  onboarding_complete BOOLEAN DEFAULT false
);

-- HELPER FUNCTIONS
CREATE OR REPLACE FUNCTION get_user_role(org_id TEXT)
RETURNS TEXT AS $$
  SELECT role FROM organization_memberships
  WHERE user_id = auth.uid() AND organization_id = org_id AND status = 'active'
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_memberships
    WHERE user_id = auth.uid() AND role = 'super_admin' AND status = 'active'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_admin_or_above()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_memberships
    WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin') AND status = 'active'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_user_org()
RETURNS TEXT AS $$
  SELECT organization_id FROM organization_memberships
  WHERE user_id = auth.uid() AND status = 'active'
  ORDER BY CASE role WHEN 'super_admin' THEN 1 WHEN 'admin' THEN 2 WHEN 'owner' THEN 3 WHEN 'staff' THEN 4 WHEN 'client' THEN 5 END
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- SEED: ELION platform org
INSERT INTO organizations (id, name, slug, org_type, status)
VALUES ('org_elion_platform', 'ELION', 'elion', 'platform', 'active')
ON CONFLICT (id) DO NOTHING;

-- TRIGGER: Auto-create org when client is created
CREATE OR REPLACE FUNCTION create_client_org()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO organizations (name, slug, org_type, client_id, status)
  VALUES (
    NEW.company_name,
    LOWER(REGEXP_REPLACE(REGEXP_REPLACE(NEW.company_name, '[^a-zA-Z0-9]+', '-', 'g'), '^-|-$', '', 'g')),
    'client', NEW.id, 'active'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_create_client_org
  AFTER INSERT ON clients
  FOR EACH ROW EXECUTE FUNCTION create_client_org();

-- TRIGGER: Auto-create membership when auth user is linked
CREATE OR REPLACE FUNCTION create_user_membership()
RETURNS TRIGGER AS $$
DECLARE
  v_org_id TEXT;
  v_role TEXT;
BEGIN
  SELECT id INTO v_org_id FROM organizations WHERE client_id = NEW.id LIMIT 1;
  IF v_org_id IS NULL THEN RETURN NEW; END IF;

  IF NEW.auth_user_id IS NOT NULL AND (OLD.auth_user_id IS NULL OR OLD.auth_user_id != NEW.auth_user_id) THEN
    IF NOT EXISTS (SELECT 1 FROM organization_memberships WHERE organization_id = v_org_id AND status = 'active') THEN
      v_role := 'owner';
    ELSE
      v_role := 'client';
    END IF;

    INSERT INTO organization_memberships (user_id, organization_id, role, status, accepted_at)
    VALUES (NEW.auth_user_id, v_org_id, v_role, 'active', now())
    ON CONFLICT (user_id, organization_id) DO UPDATE SET role = v_role;

    INSERT INTO user_profiles (id, display_name)
    VALUES (NEW.auth_user_id, NEW.contact_name)
    ON CONFLICT (id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_create_user_membership
  AFTER UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION create_user_membership();

-- RLS: organizations
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_service_role" ON organizations FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "org_member_read" ON organizations FOR SELECT TO authenticated
  USING (id IN (SELECT organization_id FROM organization_memberships WHERE user_id = auth.uid() AND status = 'active'));

-- RLS: organization_memberships
ALTER TABLE organization_memberships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mem_service_role" ON organization_memberships FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "mem_org_read" ON organization_memberships FOR SELECT TO authenticated
  USING (organization_id IN (SELECT organization_id FROM organization_memberships WHERE user_id = auth.uid() AND status = 'active'));

-- RLS: user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profile_service_role" ON user_profiles FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "profile_own_read" ON user_profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "profile_own_update" ON user_profiles FOR UPDATE TO authenticated USING (id = auth.uid());

-- Triggers
CREATE TRIGGER update_orgs_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
