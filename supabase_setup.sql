-- =====================================================================
-- supabase_setup.sql
-- -----------------------------------------------------------------
-- Run this in your Supabase project's SQL Editor (Dashboard -> SQL Editor
-- -> New Query -> paste this -> Run) BEFORE using the sync feature.
-- =====================================================================

-- 1. NOTES TABLE (mirrors the local SQLite "notes" table)
create table if not exists notes (
  id text primary key,
  title text not null,
  body text,
  tags text,
  created_at text not null,
  updated_at text not null
);

-- 2. ATTACHMENTS TABLE (mirrors the local SQLite "attachments" table)
create table if not exists attachments (
  id text primary key,
  note_id text not null references notes (id) on delete cascade,
  type text not null,
  remote_url text,
  file_name text
);

-- 3. ENABLE ROW LEVEL SECURITY (recommended even for a demo project)
alter table notes enable row level security;
alter table attachments enable row level security;

-- 4. SIMPLE OPEN POLICY FOR DEVELOPMENT
-- NOTE: This allows anyone with the anon key to read/write. This is fine
-- for an intern evaluation demo, but in production you would restrict
-- this to authenticated users only (see Supabase Auth docs).
create policy "Allow all access for demo" on notes
  for all using (true) with check (true);

create policy "Allow all access for demo" on attachments
  for all using (true) with check (true);

-- =====================================================================
-- 5. STORAGE BUCKET
-- -----------------------------------------------------------------
-- Cannot be created via SQL. Instead, in the Supabase Dashboard:
--   1. Go to "Storage" in the left sidebar
--   2. Click "New Bucket"
--   3. Name it exactly:  media
--   4. Toggle "Public bucket" ON (so getPublicUrl() works for playback)
--   5. Click "Create Bucket"
-- =====================================================================
