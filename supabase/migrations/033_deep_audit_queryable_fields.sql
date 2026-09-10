-- Deep Audit queryable fields (P1 sprint): frequently analyzed reported
-- fields are normalized into first-class columns for cohort/validation
-- queries while the full Reported/Modeled JSONB snapshots remain the source
-- of truth for display. No second source of truth: these are projections of
-- reported at save time.

ALTER TABLE public.deep_audits
  ADD COLUMN IF NOT EXISTS monthly_enquiries INTEGER,
  ADD COLUMN IF NOT EXISTS monthly_customers INTEGER,
  ADD COLUMN IF NOT EXISTS avg_transaction_ngn INTEGER,
  ADD COLUMN IF NOT EXISTS unconverted_leads_monthly INTEGER,
  ADD COLUMN IF NOT EXISTS response_time_category TEXT,
  ADD COLUMN IF NOT EXISTS acquisition_channels JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS sales_channel TEXT,
  ADD COLUMN IF NOT EXISTS lead_owner TEXT,
  ADD COLUMN IF NOT EXISTS followup_category TEXT,
  ADD COLUMN IF NOT EXISTS repeat_purchase_signal TEXT,
  ADD COLUMN IF NOT EXISTS desired_outcome TEXT;

CREATE INDEX IF NOT EXISTS idx_deep_audits_monthly_enquiries ON public.deep_audits(monthly_enquiries);
CREATE INDEX IF NOT EXISTS idx_deep_audits_followup ON public.deep_audits(followup_category);
