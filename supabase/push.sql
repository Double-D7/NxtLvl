-- ============================================================================
-- Devitt Family Show Team — web push notifications (optional add-on)
-- Run this once in the SQL Editor to enable phone push reminders.
-- Safe to re-run.
--
-- Each device that turns on notifications stores a push subscription here.
-- The scheduled Edge Function `push-reminders` reads these with the service
-- role and sends the actual notifications. Team members manage only their
-- own team's subscriptions; the sending function bypasses RLS.
-- ============================================================================

create table if not exists public.push_subscriptions (
  endpoint    text primary key,                 -- the browser's push endpoint (unique per device)
  team_id     uuid not null references public.teams(id) on delete cascade,
  user_id     uuid,
  p256dh      text not null,
  auth        text not null,
  prefs       jsonb not null default '{}'::jsonb,
  ua          text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists push_team_idx on public.push_subscriptions(team_id);

alter table public.push_subscriptions enable row level security;

-- Team members may read/write push subscriptions for their own team.
drop policy if exists push_member_select on public.push_subscriptions;
create policy push_member_select on public.push_subscriptions
  for select using (public.is_team_member(team_id));

drop policy if exists push_member_insert on public.push_subscriptions;
create policy push_member_insert on public.push_subscriptions
  for insert with check (public.is_team_member(team_id));

drop policy if exists push_member_update on public.push_subscriptions;
create policy push_member_update on public.push_subscriptions
  for update using (public.is_team_member(team_id)) with check (public.is_team_member(team_id));

drop policy if exists push_member_delete on public.push_subscriptions;
create policy push_member_delete on public.push_subscriptions
  for delete using (public.is_team_member(team_id));

-- Done. Next: deploy the Edge Function and schedule it — see supabase/PUSH_SETUP.md.
