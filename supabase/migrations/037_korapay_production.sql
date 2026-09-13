-- 037 — Kora production lifecycle additions
-- Additive only: link accepted proposals to generated invoices and allow the
-- provider lifecycle states required by the payment integration.

ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS proposal_id TEXT REFERENCES public.proposals(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_one_per_proposal
  ON public.invoices (proposal_id)
  WHERE proposal_id IS NOT NULL;

ALTER TABLE public.payments
  DROP CONSTRAINT IF EXISTS payments_status_check;

ALTER TABLE public.payments
  ADD CONSTRAINT payments_status_check
  CHECK (status IN ('pending', 'processing', 'success', 'failed', 'cancelled', 'abandoned', 'refunded'));

CREATE INDEX IF NOT EXISTS idx_payments_provider_status
  ON public.payments (provider, provider_status);
