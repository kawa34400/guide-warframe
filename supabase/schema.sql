-- ============================================================
-- Guide Warframe — schéma Supabase
-- À coller dans SQL Editor → Run
-- ============================================================

-- 1. Profils utilisateurs (display name visible dans la team view)
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now()
);

-- 2. Progression : une ligne par (user, namespace, item)
--    namespace = "construction" | "incarnon" | "warframes"
--    item_id   = id stable côté front (ex: "Principales:res:Boltor:0")
create table if not exists public.progress (
  user_id    uuid not null references auth.users(id) on delete cascade,
  namespace  text not null,
  item_id    text not null,
  done       boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, namespace, item_id)
);

create index if not exists progress_namespace_idx on public.progress(namespace);
create index if not exists progress_user_idx on public.progress(user_id);

-- 3. Trigger pour updated_at
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists progress_touch on public.progress;
create trigger progress_touch
  before update on public.progress
  for each row execute function public.touch_updated_at();

-- 4. Auto-création du profil à l'inscription
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (user_id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 5. Row-Level Security
alter table public.profiles enable row level security;
alter table public.progress enable row level security;

-- profiles: tout le monde (authentifié) peut lire ; chacun édite le sien
drop policy if exists "profiles read all" on public.profiles;
create policy "profiles read all" on public.profiles
  for select to authenticated using (true);

drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own" on public.profiles
  for update to authenticated using (auth.uid() = user_id);

-- progress: lecture team-wide, écriture uniquement sur ses propres lignes
drop policy if exists "progress read all" on public.progress;
create policy "progress read all" on public.progress
  for select to authenticated using (true);

drop policy if exists "progress insert own" on public.progress;
create policy "progress insert own" on public.progress
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "progress update own" on public.progress;
create policy "progress update own" on public.progress
  for update to authenticated using (auth.uid() = user_id);

drop policy if exists "progress delete own" on public.progress;
create policy "progress delete own" on public.progress
  for delete to authenticated using (auth.uid() = user_id);

-- 6. Vue agrégée pour la team view
create or replace view public.team_progress as
select
  p.namespace,
  p.item_id,
  count(*) filter (where p.done) as done_count,
  count(*) as total_count,
  array_agg(pr.display_name order by pr.display_name) filter (where p.done) as done_by
from public.progress p
join public.profiles pr on pr.user_id = p.user_id
group by p.namespace, p.item_id;

grant select on public.team_progress to authenticated;
