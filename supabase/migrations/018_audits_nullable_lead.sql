-- 018_audits_nullable_lead.sql
-- Allow audits to be persisted even when the visitor does not provide a
-- contact email. The audit experience only requires a company name; forcing
-- a lead (which requires a non-null email) would either lose the audit or
-- create junk leads with placeholder emails. With a nullable lead_id, the
-- audit is kept and attached to a lead when one exists (matched by email).
ALTER TABLE public.audits
  ALTER COLUMN lead_id DROP NOT NULL;

-- Audits are the entry point of the pipeline; surface them in admin lists.
CREATE INDEX IF NOT EXISTS idx_audits_created ON public.audits (created_at DESC);