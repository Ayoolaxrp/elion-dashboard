-- =====================================================
-- 021 — Public status page data model + component hygiene
-- =====================================================
-- Adds incident-update tracking and daily status snapshots (for the 30-day
-- uptime bars) and cleans up which components are visible to the PUBLIC page.
-- The admin view still lists everything (visible or not).

BEGIN;

-- Incident timeline updates: Investigating -> Identified -> Monitoring -> Resolved
CREATE TABLE IF NOT EXISTS incident_updates (
  id TEXT PRIMARY KEY DEFAULT ('incident_update_' || gen_random_uuid()::text),
  incident_id TEXT NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'investigating'
    CHECK (status IN ('investigating', 'identified', 'monitoring', 'resolved')),
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_incident_updates_incident ON incident_updates(incident_id, created_at);

-- Daily snapshot per public component: the worst status observed that day.
-- Used ONLY for the uptime bars — never invented beyond what is recorded here.
CREATE TABLE IF NOT EXISTS status_daily_snapshots (
  id TEXT PRIMARY KEY DEFAULT ('status_snapshot_' || gen_random_uuid()::text),
  component_id TEXT NOT NULL REFERENCES system_status(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  worst_status TEXT NOT NULL DEFAULT 'operational'
    CHECK (worst_status IN ('operational', 'degraded', 'partial-outage', 'major-outage', 'maintenance', 'not-configured')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (component_id, date)
);
CREATE INDEX IF NOT EXISTS idx_status_snapshots_component ON status_daily_snapshots(component_id, date);

-- Components that genuinely exist today and are user-facing (both are live:
-- the shared ELION calendar is connected and bookings create real events).
INSERT INTO system_status (component_name, status, note, sort_order, is_visible)
SELECT 'Booking System', 'operational', 'Real Google Calendar bookings + Meet', 10, true
WHERE NOT EXISTS (SELECT 1 FROM system_status WHERE component_name = 'Booking System');

INSERT INTO system_status (component_name, status, note, sort_order, is_visible)
SELECT 'Google Calendar Connection', 'operational', 'Connected (awodeyiayoola@gmail.com)', 11, true
WHERE NOT EXISTS (SELECT 1 FROM system_status WHERE component_name = 'Google Calendar Connection');

-- PUBLIC PAGE HYGIENE: unconfigured internal infrastructure must never appear
-- on the public page (the admin view still lists every row). Email/Wa/CRM/
-- Payments/n8n/Database are internal plumbing, not user-facing services.
UPDATE system_status SET is_visible = false
WHERE component_name IN ('n8n Automation', 'Email Notifications', 'WhatsApp', 'CRM Integrations', 'Payments', 'Database');

-- Uptime history: seed a snapshot for every day each public component has
-- actually existed (created_at -> today) with the status it was seeded as.
-- No day before a component existed is claimed as operational.
INSERT INTO status_daily_snapshots (component_id, date, worst_status)
SELECT s.id, d.day, s.status
FROM system_status s
JOIN LATERAL generate_series((s.created_at)::date, CURRENT_DATE, interval '1 day') AS d(day) ON true
WHERE s.is_visible = true AND s.status <> 'not-configured'
  AND NOT EXISTS (
    SELECT 1 FROM status_daily_snapshots snap
    WHERE snap.component_id = s.id AND snap.date = d.day
  )
ON CONFLICT (component_id, date) DO NOTHING;

COMMIT;