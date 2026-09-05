-- =====================================================
-- 024 — Client portal: projects, tasks, onboarding form,
--       access requests, reports
-- =====================================================
-- Vertical slice backing tables: verified client -> onboarding saved ->
-- project created -> task completed -> report accessed.
-- Isolation: every row carries client_id; RLS is service-role-only and the
-- portal API resolves the caller's client from the auth session (same
-- pattern as the existing /api/client/* routes).

BEGIN;

-- Client-visible onboarding form (saved + resumable, per-step completion)
CREATE TABLE IF NOT EXISTS portal_onboarding_form (
  id TEXT PRIMARY KEY DEFAULT ('pform_' || gen_random_uuid()::text),
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  current_step INTEGER NOT NULL DEFAULT 1 CHECK (current_step BETWEEN 1 AND 4),
  step1_data JSONB,
  step1_saved_at TIMESTAMPTZ,
  step2_data JSONB,
  step2_saved_at TIMESTAMPTZ,
  step3_data JSONB,
  step3_saved_at TIMESTAMPTZ,
  step4_data JSONB,
  step4_saved_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (client_id)
);
CREATE INDEX IF NOT EXISTS idx_pform_client ON portal_onboarding_form(client_id);

-- Projects shown in the portal workspace
CREATE TABLE IF NOT EXISTS portal_projects (
  id TEXT PRIMARY KEY DEFAULT ('pproj_' || gen_random_uuid()::text),
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  phase TEXT NOT NULL DEFAULT 'onboarding'
    CHECK (phase IN ('onboarding','configuration','build','testing','live','handover')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pproj_client ON portal_projects(client_id);

-- Tasks with client-visible statuses
CREATE TABLE IF NOT EXISTS portal_tasks (
  id TEXT PRIMARY KEY DEFAULT ('ptask_' || gen_random_uuid()::text),
  project_id TEXT NOT NULL REFERENCES portal_projects(id) ON DELETE CASCADE,
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  details TEXT,
  owner TEXT NOT NULL DEFAULT 'ELION',
  status TEXT NOT NULL DEFAULT 'not_started'
    CHECK (status IN ('not_started','in_progress','needs_input','complete','failed')),
  due_date DATE,
  client_approved BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ptask_project ON portal_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_ptask_client ON portal_tasks(client_id);

-- Access requests (collaborator invites / provider authorization, never passwords)
CREATE TABLE IF NOT EXISTS portal_access_requests (
  id TEXT PRIMARY KEY DEFAULT ('pacc_' || gen_random_uuid()::text),
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  access_kind TEXT NOT NULL DEFAULT 'collaborator_invite'
    CHECK (access_kind IN ('collaborator_invite','provider_authorization','instructions')),
  instructions TEXT,
  status TEXT NOT NULL DEFAULT 'not_started'
    CHECK (status IN ('not_started','request_sent','awaiting_access','connected','failed')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (client_id, service_name)
);
CREATE INDEX IF NOT EXISTS idx_pacc_client ON portal_access_requests(client_id);

-- Reports (only real rows ever render; empty means no report yet)
CREATE TABLE IF NOT EXISTS portal_reports (
  id TEXT PRIMARY KEY DEFAULT ('prep_' || gen_random_uuid()::text),
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  project_id TEXT REFERENCES portal_projects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  metrics JSONB NOT NULL DEFAULT '[]', -- [{label, value, source}]
  narrative JSONB NOT NULL DEFAULT '{}', -- {what_changed, completed, next_steps}
  data_source TEXT,
  last_updated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_prep_client ON portal_reports(client_id);

-- RLS: admin/service manages content; clients reach rows only via the
-- session-resolved portal API (which filters by their own client_id).
ALTER TABLE portal_onboarding_form ENABLE ROW LEVEL SECURITY;
ALTER TABLE portal_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE portal_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE portal_access_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE portal_reports ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['portal_onboarding_form','portal_projects','portal_tasks','portal_access_requests','portal_reports']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS service_role_all_%I ON %I', t, t);
    EXECUTE format('CREATE POLICY service_role_all_%I ON %I FOR ALL TO service_role USING (true) WITH CHECK (true)', t, t);
  END LOOP;
END $$;

COMMIT;
