-- Hassle — comp / tester grants (run once in the Supabase SQL editor).
--
-- A row here grants a signed-in user Hassle Plus for free, forever, regardless
-- of billing. This is how you give testers (or hardship cases) free access.
--
-- RLS: a user can READ only their own comp row. There are no insert/update/
-- delete policies, so only you — via the dashboard or the service_role key —
-- can add or remove comps. The public anon key cannot grant itself Plus.

create table if not exists public.comps (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  plus       boolean not null default true,
  note       text,                         -- e.g. "Beta tester", "Hardship"
  created_at timestamptz not null default now()
);

alter table public.comps enable row level security;

create policy "read_own_comp" on public.comps
  for select using (auth.uid() = user_id);

-- ── How to comp a tester ─────────────────────────────────────────────────────
-- 1. Ask them to sign in once (Account & sync) so they exist in Auth → Users.
-- 2. Copy their User UID from Authentication → Users.
-- 3. Run, replacing the UID:
--      insert into public.comps (user_id, note)
--      values ('00000000-0000-0000-0000-000000000000', 'Beta tester');
-- They get Plus free forever on next app open / sign-in. Delete the row to revoke.
