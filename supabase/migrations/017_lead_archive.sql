-- 017_lead_archive.sql
-- Soft archive for admin lead management. Archived leads keep their full
-- history (status, audit reference, source) and can be restored at any time.
-- The admin UI hides archived leads by default and offers Archive / Restore
-- actions. This column must exist before archive actions can be used.

alter table public.leads
  add column if not exists archived_at timestamptz null;

-- Optional index for filtering archived leads out of the default list.
create index if not exists leads_archived_at_idx on public.leads (archived_at)
  where archived_at is not null;
