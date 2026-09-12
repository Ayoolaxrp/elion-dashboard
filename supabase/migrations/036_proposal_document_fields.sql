-- 036 — Proposal document metadata
-- Keeps the existing proposal lifecycle and pricing columns intact while
-- giving the proposal editor one additive JSON document for client-facing
-- fields that are not part of the original costing schema.
ALTER TABLE proposals
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'NGN';

ALTER TABLE proposals
  ADD COLUMN IF NOT EXISTS document_data JSONB NOT NULL DEFAULT '{}'::jsonb;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_constraint
    WHERE conrelid = 'proposals'::regclass
      AND conname = 'proposals_currency_check'
  ) THEN
    ALTER TABLE proposals ADD CONSTRAINT proposals_currency_check
      CHECK (currency IN ('NGN', 'USD', 'GBP', 'EUR'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_proposals_currency ON proposals(currency);
