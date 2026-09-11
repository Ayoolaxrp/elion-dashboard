-- 035 — Provider-neutral prospecting queue
-- Manual/CSV discovery is the zero-cost default. Paid discovery providers can
-- write the same candidate contract later without changing the audit pipeline.
BEGIN;

CREATE TABLE IF NOT EXISTS prospect_candidates (
  id TEXT PRIMARY KEY DEFAULT ('prospect_' || replace(gen_random_uuid()::text, '-', '')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  business_name TEXT NOT NULL,
  website TEXT NOT NULL,
  normalized_website TEXT,
  domain TEXT,
  industry TEXT,
  location TEXT,
  source TEXT NOT NULL,
  source_url TEXT,
  source_record_id TEXT,
  retrieved_at TIMESTAMPTZ,
  preflight_status TEXT NOT NULL DEFAULT 'PENDING',
  preflight_detail TEXT,
  preflight JSONB NOT NULL DEFAULT '{}'::jsonb,
  qualification_state TEXT NOT NULL DEFAULT 'DISCOVERED',
  audit_id TEXT REFERENCES audits(id) ON DELETE SET NULL,
  lead_id TEXT REFERENCES leads(id) ON DELETE SET NULL,
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT
);

ALTER TABLE prospect_candidates ADD COLUMN IF NOT EXISTS normalized_website TEXT;
ALTER TABLE prospect_candidates ADD COLUMN IF NOT EXISTS domain TEXT;
ALTER TABLE prospect_candidates ADD COLUMN IF NOT EXISTS source_url TEXT;
ALTER TABLE prospect_candidates ADD COLUMN IF NOT EXISTS source_record_id TEXT;
ALTER TABLE prospect_candidates ADD COLUMN IF NOT EXISTS retrieved_at TIMESTAMPTZ;
ALTER TABLE prospect_candidates ADD COLUMN IF NOT EXISTS preflight_status TEXT NOT NULL DEFAULT 'PENDING';
ALTER TABLE prospect_candidates ADD COLUMN IF NOT EXISTS preflight_detail TEXT;
ALTER TABLE prospect_candidates ADD COLUMN IF NOT EXISTS preflight JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE prospect_candidates ADD COLUMN IF NOT EXISTS qualification_state TEXT NOT NULL DEFAULT 'DISCOVERED';
ALTER TABLE prospect_candidates ADD COLUMN IF NOT EXISTS audit_id TEXT REFERENCES audits(id) ON DELETE SET NULL;
ALTER TABLE prospect_candidates ADD COLUMN IF NOT EXISTS lead_id TEXT REFERENCES leads(id) ON DELETE SET NULL;
ALTER TABLE prospect_candidates ADD COLUMN IF NOT EXISTS reviewed_by TEXT;
ALTER TABLE prospect_candidates ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
ALTER TABLE prospect_candidates ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_prospect_candidates_domain
  ON prospect_candidates(domain) WHERE domain IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_prospect_candidates_state ON prospect_candidates(qualification_state);
CREATE INDEX IF NOT EXISTS idx_prospect_candidates_preflight ON prospect_candidates(preflight_status);
CREATE INDEX IF NOT EXISTS idx_prospect_candidates_created ON prospect_candidates(created_at DESC);

ALTER TABLE prospect_candidates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS service_role_all_prospect_candidates ON prospect_candidates;
CREATE POLICY service_role_all_prospect_candidates ON prospect_candidates
  FOR ALL TO service_role USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON prospect_candidates TO service_role;

-- Reference-automation idempotency and tenant attribution. A replayed inbound
-- event must not create a second CRM lead or second execution.
ALTER TABLE leads ADD COLUMN IF NOT EXISTS client_id TEXT REFERENCES clients(id) ON DELETE SET NULL;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS inbound_event_id TEXT;
CREATE INDEX IF NOT EXISTS idx_leads_client_id ON leads(client_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_client_event
  ON leads(client_id, inbound_event_id)
  WHERE client_id IS NOT NULL AND inbound_event_id IS NOT NULL;

COMMIT;
