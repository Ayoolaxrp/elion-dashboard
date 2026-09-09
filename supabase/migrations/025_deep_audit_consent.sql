-- =====================================================
-- 025 — DEEP AUDIT + CONTACT CONSENT
-- Part of the commercial engine (MASTER-PLAN Phase 2/4).
--
-- 1. deep_audits: progressive Deep Audit results.
--    Truth types are stored SEPARATELY and never merged:
--      reported : answers given by the business (their claim)
--      modeled  : calculations ELION derived FROM reported
--                 inputs, always carrying assumptions
--    Observed public evidence stays in `audits` (pipeline
--    output) and is joined at read time, not duplicated.
--
-- 2. leads.contact_permission: contact/consent state.
--    A publicly discovered WhatsApp number or email is
--    NEVER treated as marketing consent. Default unknown.
-- =====================================================

-- -----------------------------------------------------
-- DEEP AUDITS
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS deep_audits (
  id TEXT PRIMARY KEY DEFAULT ('deep_' || gen_random_uuid()::text),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  lead_id TEXT REFERENCES leads(id) ON DELETE CASCADE,
  audit_id TEXT REFERENCES audits(id) ON DELETE SET NULL,
  website TEXT,
  industry TEXT,
  status TEXT NOT NULL DEFAULT 'completed'
    CHECK (status IN ('draft', 'completed')),
  -- Business-reported answers (what the owner SAID).
  reported JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Derived calculations (modeled, with assumptions attached).
  modeled JSONB NOT NULL DEFAULT '{}'::jsonb,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_deep_audits_lead ON deep_audits(lead_id);
CREATE INDEX IF NOT EXISTS idx_deep_audits_audit ON deep_audits(audit_id);

-- -----------------------------------------------------
-- LEAD CONTACT PERMISSION / CONSENT
-- -----------------------------------------------------
ALTER TABLE leads ADD COLUMN IF NOT EXISTS contact_permission TEXT
  NOT NULL DEFAULT 'unknown'
  CHECK (contact_permission IN (
    'unknown',
    'public_business_contact',
    'opted_in_email',
    'opted_in_whatsapp',
    'opted_out',
    'do_not_contact'
  ));

ALTER TABLE leads ADD COLUMN IF NOT EXISTS consent_source TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS consent_updated_at TIMESTAMPTZ;

-- Guarded constraint rename-safe re-run
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_constraint WHERE conrelid = 'leads'::regclass AND conname = 'leads_contact_permission_check'
  ) THEN
    -- Column may already exist from a partial run without the constraint
    BEGIN
      ALTER TABLE leads ADD CONSTRAINT leads_contact_permission_check
        CHECK (contact_permission IN (
          'unknown', 'public_business_contact',
          'opted_in_email', 'opted_in_whatsapp',
          'opted_out', 'do_not_contact'
        ));
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;
