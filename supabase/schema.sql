-- ============================================================================
-- Devitt Family Show Team — Supabase schema
-- Run this once in your project's SQL Editor (Dashboard → SQL → New query).
-- Safe to re-run: everything uses "if not exists" / "create or replace".
--
-- Data model: each team's entire dataset is ONE JSON document in `teams.data`.
-- Access is controlled by team membership via Row-Level Security. Media files
-- live in a private Storage bucket named `media`.
-- ============================================================================

-- gen_random_uuid() and auth schema are already available on Supabase.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table if not exists public.teams (
  id           uuid primary key default gen_random_uuid(),
  owner        uuid not null references auth.users(id) on delete cascade,
  name         text not null default 'Devitt Family Show Team',
  data         jsonb not null default '{}'::jsonb,   -- the whole app dataset
  write_token  text,                                 -- echo-suppression for realtime
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists public.team_members (
  team_id    uuid not null references public.teams(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       text not null default 'Editor',
  created_at timestamptz not null default now(),
  primary key (team_id, user_id)
);
create index if not exists team_members_user_idx on public.team_members(user_id);

create table if not exists public.team_invites (
  id         uuid primary key default gen_random_uuid(),
  team_id    uuid not null references public.teams(id) on delete cascade,
  email      text not null,
  role       text not null default 'Editor',
  created_at timestamptz not null default now(),
  unique (team_id, email)
);

-- keep updated_at fresh on every write
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists teams_touch on public.teams;
create trigger teams_touch before update on public.teams
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Membership helpers (SECURITY DEFINER so policies don't recurse through RLS)
-- ---------------------------------------------------------------------------
create or replace function public.is_team_member(t uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.team_members m
                 where m.team_id = t and m.user_id = auth.uid());
$$;

create or replace function public.team_role(t uuid)
returns text language sql security definer stable set search_path = public as $$
  select role from public.team_members
  where team_id = t and user_id = auth.uid();
$$;

-- ---------------------------------------------------------------------------
-- Row-Level Security
-- ---------------------------------------------------------------------------
alter table public.teams        enable row level security;
alter table public.team_members enable row level security;
alter table public.team_invites enable row level security;

-- teams: members can read & write their team's document; only the owner deletes
drop policy if exists teams_select on public.teams;
create policy teams_select on public.teams
  for select using (public.is_team_member(id) or owner = auth.uid());

drop policy if exists teams_insert on public.teams;
create policy teams_insert on public.teams
  for insert with check (owner = auth.uid());

drop policy if exists teams_update on public.teams;
create policy teams_update on public.teams
  for update using (public.is_team_member(id)) with check (public.is_team_member(id));

drop policy if exists teams_delete on public.teams;
create policy teams_delete on public.teams
  for delete using (owner = auth.uid());

-- team_members: see your own rows + members of your teams; admins manage others;
-- a user may add their own row when they own the team or hold a matching invite
drop policy if exists members_select on public.team_members;
create policy members_select on public.team_members
  for select using (user_id = auth.uid() or public.is_team_member(team_id));

drop policy if exists members_insert on public.team_members;
create policy members_insert on public.team_members
  for insert with check (
       (user_id = auth.uid() and exists (select 1 from public.teams t where t.id = team_id and t.owner = auth.uid()))
    or public.team_role(team_id) in ('Owner','Administrator')
    or (user_id = auth.uid() and exists (
          select 1 from public.team_invites i
          where i.team_id = team_members.team_id and lower(i.email) = lower(auth.email())))
  );

drop policy if exists members_update on public.team_members;
create policy members_update on public.team_members
  for update using (public.team_role(team_id) in ('Owner','Administrator'))
  with check (public.team_role(team_id) in ('Owner','Administrator'));

drop policy if exists members_delete on public.team_members;
create policy members_delete on public.team_members
  for delete using (user_id = auth.uid() or public.team_role(team_id) in ('Owner','Administrator'));

-- team_invites: the invited email (and team admins) can see/accept; admins create
drop policy if exists invites_select on public.team_invites;
create policy invites_select on public.team_invites
  for select using (lower(email) = lower(auth.email()) or public.team_role(team_id) in ('Owner','Administrator'));

drop policy if exists invites_insert on public.team_invites;
create policy invites_insert on public.team_invites
  for insert with check (public.team_role(team_id) in ('Owner','Administrator'));

drop policy if exists invites_update on public.team_invites;
create policy invites_update on public.team_invites
  for update using (public.team_role(team_id) in ('Owner','Administrator'));

drop policy if exists invites_delete on public.team_invites;
create policy invites_delete on public.team_invites
  for delete using (lower(email) = lower(auth.email()) or public.team_role(team_id) in ('Owner','Administrator'));

-- ---------------------------------------------------------------------------
-- Realtime: stream teams.data changes to other devices
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'teams'
  ) then
    execute 'alter publication supabase_realtime add table public.teams';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Storage: private `media` bucket, path convention `<teamId>/<blobId>`
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('media', 'media', false)
on conflict (id) do nothing;

drop policy if exists media_read on storage.objects;
create policy media_read on storage.objects
  for select using (
    bucket_id = 'media'
    and public.is_team_member(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists media_write on storage.objects;
create policy media_write on storage.objects
  for insert with check (
    bucket_id = 'media'
    and public.is_team_member(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists media_update on storage.objects;
create policy media_update on storage.objects
  for update using (
    bucket_id = 'media'
    and public.is_team_member(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists media_delete on storage.objects;
create policy media_delete on storage.objects
  for delete using (
    bucket_id = 'media'
    and public.is_team_member(((storage.foldername(name))[1])::uuid)
  );

-- Done. Copy your Project URL + anon key into config.js (or the in-app
-- "Connect to cloud" screen), then sign up as the owner.
