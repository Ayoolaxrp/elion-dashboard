-- =====================================================
-- ELION — COMBINED MIGRATION 002-006
-- Run this in Supabase SQL Editor
-- All tables use IF NOT EXISTS so safe to re-run
-- =====================================================

-- First ensure the leads table exists (from 001)
-- If 001 was already run, skip this block
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'leads') THEN
    CREATE TABLE leads (
      id TEXT PRIMARY KEY DEFAULT ('lead_' || gen_random_uuid()::text),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      contact_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      whatsapp TEXT,
      company_name TEXT NOT NULL DEFAULT 'Not specified',
      website TEXT,
      industry TEXT,
      company_size TEXT,
      primary_problem TEXT,
      current_process TEXT,
      desired_outcome TEXT,
      enquiry_channels TEXT,
      source TEXT DEFAULT 'funnel',
      status TEXT DEFAULT 'new',
      notes TEXT,
      data JSONB DEFAULT '{}'::jsonb
    );
  END IF;
END $$;

-- Ensure update_updated_at_column function exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- 017_lead_archive.sql — soft archive for leads (kept idempotent)
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ NULL;
CREATE INDEX IF NOT EXISTS leads_archived_at_idx ON public.leads (archived_at)
  WHERE archived_at IS NOT NULL;


-- 018_audits_nullable_lead.sql — audits can persist without a lead/email
ALTER TABLE public.audits
  ALTER COLUMN lead_id DROP NOT NULL;
CREATE INDEX IF NOT EXISTS idx_audits_created ON public.audits (created_at DESC);


-- 019_commercial_lifecycle.sql — proposals, contracts, invoices, payments
CREATE TABLE IF NOT EXISTS proposals (
  id TEXT PRIMARY KEY DEFAULT ('prop_' || gen_random_uuid()::text),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  client_id TEXT REFERENCES clients(id) ON DELETE SET NULL,
  lead_id TEXT REFERENCES leads(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  company_name TEXT,
  client_name TEXT,
  client_email TEXT,
  summary TEXT,
  items JSONB NOT NULL DEFAULT '[]',
  total_setup INTEGER NOT NULL DEFAULT 0,
  total_monthly INTEGER NOT NULL DEFAULT 0,
  implementation_timeline TEXT,
  support_plan TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  valid_until TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  declined_at TIMESTAMPTZ
);
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS client_name TEXT;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS client_email TEXT;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS source_audit_id TEXT REFERENCES audits(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_proposals_source_audit ON proposals(source_audit_id);
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS summary TEXT;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS total_monthly INTEGER NOT NULL DEFAULT 0;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS implementation_timeline TEXT;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS support_plan TEXT;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS valid_until TIMESTAMPTZ;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS declined_at TIMESTAMPTZ;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_constraint WHERE conrelid = 'proposals'::regclass AND conname = 'proposals_status_check'
  ) THEN
    ALTER TABLE proposals ADD CONSTRAINT proposals_status_check
      CHECK (status IN ('draft','sent','viewed','accepted','rejected','expired'));
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_proposals_client ON proposals(client_id);
CREATE INDEX IF NOT EXISTS idx_proposals_status ON proposals(status);
CREATE INDEX IF NOT EXISTS idx_proposals_created ON proposals(created_at DESC);
CREATE TABLE IF NOT EXISTS contracts (
  id TEXT PRIMARY KEY DEFAULT ('cont_' || gen_random_uuid()::text),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  proposal_id TEXT REFERENCES proposals(id) ON DELETE SET NULL,
  client_id TEXT REFERENCES clients(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  company_name TEXT,
  client_name TEXT,
  scope_summary TEXT,
  total_amount INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','sent','viewed','signed','declined','expired')),
  sent_at TIMESTAMPTZ,
  signed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  signatory TEXT
);
CREATE INDEX IF NOT EXISTS idx_contracts_client ON contracts(client_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_created ON contracts(created_at DESC);
CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY DEFAULT ('inv_' || gen_random_uuid()::text),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  client_id TEXT REFERENCES clients(id) ON DELETE SET NULL,
  contract_id TEXT REFERENCES contracts(id) ON DELETE SET NULL,
  invoice_number TEXT UNIQUE,
  title TEXT NOT NULL,
  company_name TEXT,
  client_name TEXT,
  items JSONB NOT NULL DEFAULT '[]',
  amount INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'NGN',
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','sent','paid','overdue','cancelled')),
  issued_at TIMESTAMPTZ DEFAULT now(),
  due_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_invoices_client ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_created ON invoices(created_at DESC);
ALTER TABLE payments ALTER COLUMN lead_id DROP NOT NULL;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS client_id TEXT REFERENCES clients(id) ON DELETE SET NULL;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS invoice_id TEXT REFERENCES invoices(id) ON DELETE SET NULL;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS contract_id TEXT REFERENCES contracts(id) ON DELETE SET NULL;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS client_name TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS method TEXT NOT NULL DEFAULT 'bank_transfer';
ALTER TABLE payments ADD COLUMN IF NOT EXISTS reference TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS notes TEXT;
CREATE INDEX IF NOT EXISTS idx_payments_client ON payments(client_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created ON payments(created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_one_per_invoice ON payments (invoice_id) WHERE invoice_id IS NOT NULL;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN IF NOT EXISTS (SELECT FROM pg_policies WHERE schemaname='public' AND tablename='proposals' AND policyname='service_role_all') THEN CREATE POLICY "service_role_all" ON proposals FOR ALL TO service_role USING (true) WITH CHECK (true); END IF; END $$;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN IF NOT EXISTS (SELECT FROM pg_policies WHERE schemaname='public' AND tablename='contracts' AND policyname='service_role_all') THEN CREATE POLICY "service_role_all" ON contracts FOR ALL TO service_role USING (true) WITH CHECK (true); END IF; END $$;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN IF NOT EXISTS (SELECT FROM pg_policies WHERE schemaname='public' AND tablename='invoices' AND policyname='service_role_all') THEN CREATE POLICY "service_role_all" ON invoices FOR ALL TO service_role USING (true) WITH CHECK (true); END IF; END $$;
GRANT SELECT, INSERT, UPDATE, DELETE ON proposals, contracts, invoices TO service_role;
