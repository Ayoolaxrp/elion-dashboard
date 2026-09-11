-- Lean founder Content Studio.
-- Content is sourced from a real ELION event or explicit founder input;
-- publication remains a separate human-approved action.
CREATE TABLE IF NOT EXISTS public.content_items (
  id TEXT PRIMARY KEY DEFAULT ('content_' || replace(gen_random_uuid()::text, '-', '')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  source_event TEXT NOT NULL,
  topic TEXT NOT NULL,
  angle TEXT NOT NULL,
  hook TEXT NOT NULL DEFAULT '',
  linkedin TEXT NOT NULL DEFAULT '',
  x_post TEXT NOT NULL DEFAULT '',
  instagram_caption TEXT NOT NULL DEFAULT '',
  carousel_slides JSONB NOT NULL DEFAULT '[]'::jsonb,
  reel_script TEXT NOT NULL DEFAULT '',
  cta TEXT NOT NULL DEFAULT '',
  evidence_sources JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'idea'
    CHECK (status IN ('idea','draft','review','approved','scheduled','published','rejected')),
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  rejection_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_content_items_status ON public.content_items(status);
CREATE INDEX IF NOT EXISTS idx_content_items_updated ON public.content_items(updated_at DESC);
ALTER TABLE public.content_items ENABLE ROW LEVEL SECURITY;
