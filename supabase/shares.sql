-- ============================================================================
-- Devitt Family Show Team — public sharing (optional add-on)
-- Run this once in the SQL Editor to enable shareable public animal pages.
-- Safe to re-run.
--
-- Model: creating a share writes a row to `shares` whose `data` is a curated,
-- PUBLIC-SAFE snapshot (name, weights, photos, pedigree, results — never
-- health, prices, expenses, notes, or contact info). Anyone with the link's
-- token can read that one row; owners can revoke or expire it. Shared images
-- are copied to a public `shares` Storage bucket.
-- ============================================================================

create table if not exists public.shares (
  id          text primary key,                 -- unguessable token (also the URL fragment)
  team_id     uuid not null references public.teams(id) on delete cascade,
  animal_id   text,
  title       text,
  data        jsonb not null default '{}'::jsonb,
  revoked     boolean not null default false,
  expires_at  timestamptz,
  created_by  uuid,
  created_at  timestamptz not null default now()
);
create index if not exists shares_team_idx on public.shares(team_id);

alter table public.shares enable row level security;

-- Anyone (even signed-out) may read a live share by its token.
drop policy if exists shares_public_read on public.shares;
create policy shares_public_read on public.shares
  for select using (revoked = false and (expires_at is null or expires_at > now()));

-- Only team members create/update/delete shares for their team.
drop policy if exists shares_member_insert on public.shares;
create policy shares_member_insert on public.shares
  for insert with check (public.is_team_member(team_id));

drop policy if exists shares_member_update on public.shares;
create policy shares_member_update on public.shares
  for update using (public.is_team_member(team_id)) with check (public.is_team_member(team_id));

drop policy if exists shares_member_delete on public.shares;
create policy shares_member_delete on public.shares
  for delete using (public.is_team_member(team_id));

-- Public bucket for shared images (paths are token-scoped and unguessable).
insert into storage.buckets (id, name, public)
values ('shares', 'shares', true)
on conflict (id) do nothing;

drop policy if exists shares_img_read on storage.objects;
create policy shares_img_read on storage.objects
  for select using (bucket_id = 'shares');   -- public read

drop policy if exists shares_img_write on storage.objects;
create policy shares_img_write on storage.objects
  for insert with check (bucket_id = 'shares' and public.is_team_member(((storage.foldername(name))[1])::uuid));

drop policy if exists shares_img_delete on storage.objects;
create policy shares_img_delete on storage.objects
  for delete using (bucket_id = 'shares' and public.is_team_member(((storage.foldername(name))[1])::uuid));

-- Done. Sharing now works from the app: open an animal → Share.
