-- Persist the audit pipeline's verified category structure so the
-- commercial applicability engine can re-run it for the salesperson UI
-- without re-auditing. Older rows simply have no verified payload.
ALTER TABLE public.audits
  ADD COLUMN IF NOT EXISTS verified JSONB DEFAULT '{}'::jsonb;
