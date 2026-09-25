-- ============================================================================
-- LunaTrack — Supabase schema (Step 3)
-- Run this in your Supabase project's SQL Editor (Database → SQL Editor →
-- New query). Safe to re-run: every statement is IF NOT EXISTS / OR REPLACE.
--
-- What this gives you:
--   1. One table per data type the app already has a localStorage seam for
--      (cycle setup, cycles, daily logs, check-ins, notes, notifications,
--      preferences), plus a profiles table linked to auth.users.
--   2. Row Level Security on every table, so a user can only ever read or
--      write their own rows — enforced by Postgres, not by app code.
--   3. A trigger that creates a profile row automatically when someone
--      signs up, so the app never has to do that itself.
--
-- After running this, fill in SUPABASE_URL and SUPABASE_ANON_KEY in
-- app/js/supabase-client.js and the app switches from demo/localStorage
-- mode into real accounts automatically.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. PROFILES — one row per user, mirrors auth.users
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text,
  email text,
  avatar_url text,
  member_since timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- Auto-create a profile row whenever someone signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)));
  insert into public.preferences (user_id) values (new.id);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ----------------------------------------------------------------------------
-- 2. CYCLE SETUP — the editable source of truth for cycle math (one row
--    per user; mirrors localStorage's 'lunatrack:cycle-setup').
-- ----------------------------------------------------------------------------
create table if not exists public.cycle_setups (
  user_id uuid primary key references auth.users (id) on delete cascade,
  last_period_start date not null,
  cycle_length int not null default 28 check (cycle_length between 15 and 60),
  period_length int not null default 5 check (period_length between 1 and 15),
  updated_at timestamptz not null default now()
);

alter table public.cycle_setups enable row level security;

drop policy if exists "cycle_setups_all_own" on public.cycle_setups;
create policy "cycle_setups_all_own" on public.cycle_setups
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 3. CYCLES — historical cycle records (mirrors the History page's list).
-- ----------------------------------------------------------------------------
create table if not exists public.cycles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  start_date date not null,
  end_date date,
  cycle_length int,
  period_length int,
  created_at timestamptz not null default now()
);

alter table public.cycles enable row level security;

drop policy if exists "cycles_all_own" on public.cycles;
create policy "cycles_all_own" on public.cycles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists cycles_user_start_idx on public.cycles (user_id, start_date desc);

-- ----------------------------------------------------------------------------
-- 4. DAILY LOGS — the Log Today page (mirrors 'lunatrack:log-YYYY-M-D').
-- ----------------------------------------------------------------------------
create table if not exists public.daily_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  log_date date not null,
  period_flow text,           -- 'Not started' | 'Light' | 'Medium' | 'Heavy'
  symptoms text[] not null default '{}',
  mood text,                  -- 'Great' | 'Good' | 'Okay' | 'Low' | 'Difficult'
  energy text,                -- 'Low' | 'Normal' | 'High'
  sleep text,                 -- 'Poor' | 'Fair' | 'Good'
  notes text,
  created_at timestamptz not null default now(),
  unique (user_id, log_date)
);

alter table public.daily_logs enable row level security;

drop policy if exists "daily_logs_all_own" on public.daily_logs;
create policy "daily_logs_all_own" on public.daily_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists daily_logs_user_date_idx on public.daily_logs (user_id, log_date desc);

-- ----------------------------------------------------------------------------
-- 5. CHECK-INS — the dashboard's "Today's check-in" card
--    (mirrors 'lunatrack:checkin-YYYY-M-D').
-- ----------------------------------------------------------------------------
create table if not exists public.check_ins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  checkin_date date not null,
  mood text,
  energy text,
  symptoms text[] not null default '{}',
  created_at timestamptz not null default now(),
  unique (user_id, checkin_date)
);

alter table public.check_ins enable row level security;

drop policy if exists "check_ins_all_own" on public.check_ins;
create policy "check_ins_all_own" on public.check_ins
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 6. NOTES — the "Add Note" quick action
-- ----------------------------------------------------------------------------
create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  note_date date not null default current_date,
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.notes enable row level security;

drop policy if exists "notes_all_own" on public.notes;
create policy "notes_all_own" on public.notes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 7. NOTIFICATIONS
-- ----------------------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  body text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;

drop policy if exists "notifications_all_own" on public.notifications;
create policy "notifications_all_own" on public.notifications
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 8. PREFERENCES — theme, notification/reminder toggles (one row per user)
-- ----------------------------------------------------------------------------
create table if not exists public.preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  theme text not null default 'light' check (theme in ('light', 'dark', 'system')),
  notifications_enabled boolean not null default true,
  reminders_enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.preferences enable row level security;

drop policy if exists "preferences_all_own" on public.preferences;
create policy "preferences_all_own" on public.preferences
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists notes_user_created_idx on public.notes (user_id, created_at desc);
create index if not exists notifications_user_created_idx on public.notifications (user_id, created_at desc);

-- ----------------------------------------------------------------------------
-- 9. AVATAR STORAGE — a public "avatars" bucket, one folder per user
--    (path: <user_id>/avatar.<ext>). Public read (so <img src> just works),
--    but only the owning user can upload/replace/delete inside their own
--    folder — enforced by matching the first path segment to auth.uid().
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "avatar_public_read" on storage.objects;
create policy "avatar_public_read" on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists "avatar_owner_insert" on storage.objects;
create policy "avatar_owner_insert" on storage.objects
  for insert with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatar_owner_update" on storage.objects;
create policy "avatar_owner_update" on storage.objects
  for update using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatar_owner_delete" on storage.objects;
create policy "avatar_owner_delete" on storage.objects
  for delete using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- ============================================================================
-- Done. Every table above only allows a signed-in user to see or change
-- their own rows (auth.uid() = user_id) — there is no "admin bypass" here,
-- so double-check policies before adding one if you build an admin view.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 10. SELF-DELETE ACCOUNT — lets a signed-in user delete their own account.
--    Deleting the auth.users row cascades to profiles/cycle_setups/cycles/
--    daily_logs/notes/notifications/preferences via their FK constraints.
-- ----------------------------------------------------------------------------
create or replace function public.delete_own_account()
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  delete from auth.users where id = auth.uid();
end;
$$;

grant execute on function public.delete_own_account() to authenticated;

-- ----------------------------------------------------------------------------
-- 11. ONBOARDING PROFILE — extends `profiles` with the results of the
--    onboarding wizard (About You / Lifestyle / Cycle Experience / Wellness
--    focus). Everything here is optional and user-editable later from
--    Settings, so plain nullable columns / default-empty jsonb + arrays.
--    Existing rows just get these columns with their defaults — nothing
--    else about `profiles` changes.
-- ----------------------------------------------------------------------------
alter table public.profiles add column if not exists age int check (age is null or (age between 8 and 100));
alter table public.profiles add column if not exists date_of_birth date;
alter table public.profiles add column if not exists onboarding_completed boolean not null default false;
-- lifestyle: { favoriteFoods, periodCravings, favoriteFruits, avoidFoods, waterIntake, activityLevel }
alter table public.profiles add column if not exists lifestyle jsonb not null default '{}'::jsonb;
-- cycle_experience: { symptoms, crampLevel, moods, energyLevel, cravings }
alter table public.profiles add column if not exists cycle_experience jsonb not null default '{}'::jsonb;
-- wellness_focus: e.g. {'Period reminders','Hydration','Mood'}
alter table public.profiles add column if not exists wellness_focus text[] not null default '{}';
