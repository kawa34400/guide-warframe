-- ============================================================
-- Migration 002 — Notes par item
-- À exécuter dans SQL Editor Supabase APRÈS le schema.sql initial
-- ============================================================

create table if not exists public.notes (
  user_id    uuid not null references auth.users(id) on delete cascade,
  namespace  text not null,
  item_id    text not null,
  body       text not null default '',
  updated_at timestamptz not null default now(),
  primary key (user_id, namespace, item_id)
);

create index if not exists notes_user_idx on public.notes(user_id);
create index if not exists notes_namespace_idx on public.notes(namespace);

drop trigger if exists notes_touch on public.notes;
create trigger notes_touch
  before update on public.notes
  for each row execute function public.touch_updated_at();

alter table public.notes enable row level security;

drop policy if exists "notes read all" on public.notes;
create policy "notes read all" on public.notes
  for select to authenticated using (true);

drop policy if exists "notes insert own" on public.notes;
create policy "notes insert own" on public.notes
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "notes update own" on public.notes;
create policy "notes update own" on public.notes
  for update to authenticated using (auth.uid() = user_id);

drop policy if exists "notes delete own" on public.notes;
create policy "notes delete own" on public.notes
  for delete to authenticated using (auth.uid() = user_id);
