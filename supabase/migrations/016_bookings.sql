-- =====================================================
-- 016 — BOOKINGS (Google Calendar / Google Meet)
-- Real bookings created via the Google Calendar API.
-- A booking is only ever CONFIRMED after a real calendar
-- event exists (calendar_event_id + google_meet_url set).
-- =====================================================

CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY DEFAULT ('bk_' || gen_random_uuid()::text),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  client_id TEXT REFERENCES clients(id) ON DELETE SET NULL,
  lead_id TEXT,
  audit_id TEXT,
  opportunity_id TEXT,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  timezone TEXT NOT NULL DEFAULT 'Africa/Lagos',
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  duration_min INTEGER NOT NULL DEFAULT 30,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','confirmed','cancelled','rescheduled','completed','no_show')),
  calendar_provider TEXT NOT NULL DEFAULT 'google_calendar'
    CHECK (calendar_provider IN ('google_calendar','manual')),
  calendar_id TEXT,
  calendar_event_id TEXT,
  google_meet_url TEXT,
  cancellation_reason TEXT,
  rescheduled_from TEXT,
  notes TEXT,
  created_by TEXT NOT NULL DEFAULT 'public'
    CHECK (created_by IN ('public','admin','client'))
);

CREATE INDEX IF NOT EXISTS idx_bookings_start ON bookings(start_at);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_customer_email ON bookings(customer_email);
CREATE INDEX IF NOT EXISTS idx_bookings_client ON bookings(client_id);

-- Double-booking protection at the database level: only one
-- active (pending/confirmed/rescheduled) booking may occupy a
-- given slot on a given calendar. The API additionally re-checks
-- Google Free/Busy immediately before creating the event.
CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_slot_once
  ON bookings (calendar_id, start_at)
  WHERE status IN ('pending','confirmed','rescheduled');

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------
-- booking_settings — server-side configuration + tokens.
-- google_tokens is ONLY ever read/written server-side.
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS booking_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO booking_settings (key, value) VALUES
  ('config', jsonb_build_object(
    'title', 'Strategy call with ELION',
    'description', 'A 30-minute call to review your audit findings and map the right automations for your business.',
    'duration_min', 30,
    'buffer_min', 15,
    'min_notice_min', 120,
    'max_window_days', 30,
    'timezone', 'Africa/Lagos',
    'working_hours', jsonb_build_object(
      'start', '09:00',
      'end', '17:00',
      'days', jsonb_build_array('mon','tue','wed','thu','fri'),
      'weekends', false
    )
  ))
ON CONFLICT (key) DO NOTHING;

ALTER TABLE booking_settings ENABLE ROW LEVEL SECURITY;
