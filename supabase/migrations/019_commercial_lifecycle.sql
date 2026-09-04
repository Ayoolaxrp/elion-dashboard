-- =====================================================
-- 019 — COMMERCIAL LIFECYCLE (proposals, contracts,
--       invoices, payments)
-- Replaces the hardcoded mock-lifecycle demo data with
-- real tables so the admin console can operate the full
-- LEAD -> PROPOSAL -> CONTRACT -> INVOICE -> PAYMENT
-- pipeline. All tables follow the existing ELION
-- conventions (TEXT ids, service-role RLS).
-- Amounts are integer NGN (consistent with clients.plan_price).
-- NOTE: a payments table already exists from 001 (Paystack,
-- lead-keyed). We EXTEND it with client/invoice columns
-- rather than creating a duplicate concept.
-- =====================================================

-- -----------------------------------------------------
-- PROPOSALS
-- -----------------------------------------------------
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

-- Recover any partially-created table (earlier schema attempts).
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS client_name TEXT;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS client_email TEXT;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS summary TEXT;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS total_monthly INTEGER NOT NULL DEFAULT 0;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS implementation_timeline TEXT;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS support_plan TEXT;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS valid_until TIMESTAMPTZ;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS declined_at TIMESTAMPTZ;

-- Guarded status constraint (Postgres lacks ADD CONSTRAINT IF NOT EXISTS).
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

-- -----------------------------------------------------
-- CONTRACTS
-- -----------------------------------------------------
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

-- -----------------------------------------------------
-- INVOICES
-- -----------------------------------------------------
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

-- -----------------------------------------------------
-- PAYMENTS — extend the existing 001 (Paystack) table
-- with client/invoice/commercial columns.
-- -----------------------------------------------------
-- lead_id is NOT NULL in 001 but client-level payments (against
-- invoices/contracts) are not tied to a lead; drop the constraint.
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

-- -----------------------------------------------------
-- RLS: service-role only (admin console reads/writes
-- via the server-side service role; clients never
-- access these tables directly). payments already has
-- its service_role_all policy from 001.
-- -----------------------------------------------------
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON proposals
  FOR ALL TO service_role USING (true) WITH CHECK (true);

ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON contracts
  FOR ALL TO service_role USING (true) WITH CHECK (true);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON invoices
  FOR ALL TO service_role USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON proposals, contracts, invoices TO service_role;