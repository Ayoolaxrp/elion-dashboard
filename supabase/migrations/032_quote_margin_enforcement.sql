-- Quote economics enforcement on the actual proposal path (P0 sprint).
--
-- A proposal may not be ACCEPTED below the margin guardrails unless a
-- founder override with reason is logged. Cost inputs are stored so the
-- margin check is reproducible and cannot be bypassed by another endpoint.
ALTER TABLE public.proposals
  ADD COLUMN IF NOT EXISTS tier TEXT,
  ADD COLUMN IF NOT EXISTS estimated_delivery_hours INTEGER,
  ADD COLUMN IF NOT EXISTS labour_rate_per_hour INTEGER,
  ADD COLUMN IF NOT EXISTS contractor_cost INTEGER,
  ADD COLUMN IF NOT EXISTS client_infrastructure_monthly INTEGER,
  ADD COLUMN IF NOT EXISTS api_setup_cost INTEGER,
  ADD COLUMN IF NOT EXISTS onboarding_cost INTEGER,
  ADD COLUMN IF NOT EXISTS contingency_percent NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS margin_check JSONB,
  ADD COLUMN IF NOT EXISTS margin_status TEXT DEFAULT 'not_checked'
    CHECK (margin_status IN ('not_checked','within_guardrails','below_guardrails','founder_override')),
  ADD COLUMN IF NOT EXISTS margin_override JSONB;
