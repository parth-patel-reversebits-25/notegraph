-- NoteGraph schema
-- Run in Supabase SQL editor

create extension if not exists "pgcrypto";

-- Notes table
create table notes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null default '',
  tags text[] not null default '{}',
  is_placeholder boolean not null default false,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- Unique titles scoped to non-deleted non-placeholder notes
-- Placeholder notes can share titles with deleted notes temporarily,
-- so we enforce uniqueness at application level for flexibility.
create unique index notes_title_unique_idx on notes (lower(title))
  where is_deleted = false;

-- Note links (directed edges)
create table note_links (
  id uuid primary key default gen_random_uuid(),
  source_note_id uuid not null references notes(id),
  target_note_id uuid not null references notes(id),
  target_title text not null,
  is_broken boolean not null default false,
  created_at timestamptz not null default now()
);

create index note_links_source_idx on note_links (source_note_id);
create index note_links_target_idx on note_links (target_note_id);
-- Prevent duplicate edges from same source to same target
create unique index note_links_unique_edge_idx on note_links (source_note_id, target_note_id);

-- Note versions (immutable snapshots)
create table note_versions (
  id uuid primary key default gen_random_uuid(),
  note_id uuid not null references notes(id),
  body text not null,
  version_number integer not null,
  created_at timestamptz not null default now()
);

create index note_versions_note_idx on note_versions (note_id, version_number);
create unique index note_versions_unique_idx on note_versions (note_id, version_number);

-- Auto-update updated_at on notes
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger notes_updated_at
  before update on notes
  for each row execute function update_updated_at();
