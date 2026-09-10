-- =====================================================
-- 028 — CHANNEL-SPECIFIC CONTACT PERMISSION (CONSENT)
--
-- Replaces the scalar leads.contact_permission with a
-- normalized per-channel model. One lead may legitimately be:
--   email = opted_in, whatsapp = unknown,
--   sms = opted_out, phone = public_business_contact
-- at the same time. A public WhatsApp number is NEVER
-- opted_in by itself. The scalar column is kept for
-- backward compatibility (audit history) but the new
-- table is the source of truth going forward.
-- =====================================================

CREATE TABLE IF NOT EXISTS lead_contact_permissions (
  id TEXT PRIMARY KEY DEFAULT ('cp_' || gen_random_uuid()::text),
  lead_id TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'whatsapp', 'sms', 'phone')),
  status TEXT NOT NULL CHECK (status IN (
    'unknown', 'public_business_contact', 'opted_in', 'opted_out', 'do_not_contact'
  )),
  consent_source TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (lead_id, channel)
);

CREATE INDEX IF NOT EXISTS idx_contact_perms_lead ON lead_contact_permissions(lead_id);
CREATE INDEX IF NOT EXISTS idx_contact_perms_channel ON lead_contact_permissions(channel);

-- Backfill: preserve the historical scalar semantics into the
-- channel table so no existing lead loses its recorded state.
INSERT INTO lead_contact_permissions (lead_id, channel, status, consent_source, created_at, updated_at)
SELECT l.id, c.channel,
  CASE
    -- 'opted_in_email' meant email opted in; everything else falls back
    -- to a conservative per-channel default.
    WHEN l.contact_permission = 'opted_in_email' AND c.channel = 'email' THEN 'opted_in'
    WHEN l.contact_permission = 'opted_in_whatsapp' AND c.channel = 'whatsapp' THEN 'opted_in'
    WHEN l.contact_permission = 'do_not_contact' THEN 'do_not_contact'
    WHEN l.contact_permission = 'opted_out' THEN 'opted_out'
    WHEN l.contact_permission = 'public_business_contact' THEN 'public_business_contact'
    ELSE 'unknown'
  END AS status,
  l.consent_source,
  COALESCE(l.consent_updated_at, now()),
  COALESCE(l.consent_updated_at, now())
FROM leads l
CROSS JOIN (VALUES ('email'), ('whatsapp'), ('sms'), ('phone')) AS c(channel)
WHERE NOT EXISTS (
  SELECT 1 FROM lead_contact_permissions p WHERE p.lead_id = l.id AND p.channel = c.channel
);
