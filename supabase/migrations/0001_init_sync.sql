-- Hassle — sync schema (run once in the Supabase SQL editor).
--
-- RLS-FIRST: every table has Row-Level Security enabled and a policy that
-- restricts access to the signed-in user's own rows. With the anon/public key,
-- a user can therefore only ever read or write their own data.
--
-- Data model: local-first JSON snapshots. Completed days are keyed per-date so
-- multiple devices can merge without clobbering each other; preferences and the
-- scheduled-task list are single rows per user.

-- ── Tables ───────────────────────────────────────────────────────────────────

create table if not exists public.preferences (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  payload    jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.days (
  user_id    uuid not null references auth.users (id) on delete cascade,
  date       text not null,
  payload    jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, date)
);

create table if not exists public.scheduled_tasks (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  payload    jsonb not null,
  updated_at timestamptz not null default now()
);

-- ── Row-Level Security ───────────────────────────────────────────────────────

alter table public.preferences     enable row level security;
alter table public.days            enable row level security;
alter table public.scheduled_tasks enable row level security;

create policy "own_preferences" on public.preferences
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own_days" on public.days
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own_scheduled_tasks" on public.scheduled_tasks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
