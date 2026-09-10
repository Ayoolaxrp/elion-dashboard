-- Client-owned n8n deployment model + vendor-cost register (P0 sprint).
--
-- Default production model: the CLIENT owns the n8n account/instance and
-- normally pays n8n directly. ELION configures, deploys, tests and monitors
-- while Care is active. No plaintext credentials are ever stored here.

ALTER TABLE public.client_automations
  ADD COLUMN IF NOT EXISTS deployment_type TEXT,              -- cloud | self_hosted
  ADD COLUMN IF NOT EXISTS orchestration_provider TEXT DEFAULT 'n8n',
  ADD COLUMN IF NOT EXISTS instance_ref TEXT,                 -- n8n instance/workspace URL or id
  ADD COLUMN IF NOT EXISTS billing_owner TEXT DEFAULT 'client' CHECK (billing_owner IN ('client','elion')),
  ADD COLUMN IF NOT EXISTS elion_access_state TEXT DEFAULT 'none' CHECK (elion_access_state IN ('none','pending','granted','revoked')),
  ADD COLUMN IF NOT EXISTS n8n_plan TEXT,
  ADD COLUMN IF NOT EXISTS estimated_monthly_executions INTEGER,
  ADD COLUMN IF NOT EXISTS actual_monthly_executions INTEGER,
  ADD COLUMN IF NOT EXISTS workflow_version TEXT,
  ADD COLUMN IF NOT EXISTS last_tested_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS backup_ref TEXT,
  ADD COLUMN IF NOT EXISTS monitoring_state TEXT DEFAULT 'not_monitored' CHECK (monitoring_state IN ('not_monitored','monitoring','ended')),
  ADD COLUMN IF NOT EXISTS care_state TEXT DEFAULT 'none' CHECK (care_state IN ('none','active','cancelled')),
  ADD COLUMN IF NOT EXISTS go_live_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS offboarded_at TIMESTAMPTZ;

-- Client-level vendor-cost register: who owns and pays every vendor.
CREATE TABLE IF NOT EXISTS public.vendor_costs (
  id TEXT PRIMARY KEY DEFAULT ('vc_' || gen_random_uuid()::text),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  client_id TEXT REFERENCES public.clients(id) ON DELETE CASCADE,
  vendor TEXT NOT NULL,
  service TEXT NOT NULL,
  purpose TEXT,
  billing_owner TEXT NOT NULL DEFAULT 'client' CHECK (billing_owner IN ('client','elion')),
  currency TEXT NOT NULL DEFAULT 'NGN',
  fixed_fee INTEGER,
  included_allowance TEXT,
  variable_basis TEXT,
  expected_monthly_usage NUMERIC(12,2),
  actual_monthly_usage NUMERIC(12,2),
  renewal_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','pending','cancelled')),
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_vendor_costs_client ON public.vendor_costs(client_id);
