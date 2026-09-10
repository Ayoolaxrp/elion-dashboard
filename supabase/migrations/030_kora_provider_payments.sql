-- Provider-neutral payment columns + webhook idempotency (Kora live).
--
-- `amount` is stored in NAIRA (matching the existing admin payment flow);
-- conversion to/from kobo happens only at the provider API edge.
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS provider TEXT,
  ADD COLUMN IF NOT EXISTS provider_reference TEXT,
  ADD COLUMN IF NOT EXISTS provider_status TEXT,
  ADD COLUMN IF NOT EXISTS provider_fee INTEGER,
  ADD COLUMN IF NOT EXISTS verification_source TEXT,
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

-- Webhook idempotency guard: a provider can only ever have one payment row
-- per reference, so duplicate webhook deliveries cannot duplicate anything.
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_provider_ref
  ON public.payments (provider, provider_reference)
  WHERE provider_reference IS NOT NULL;
