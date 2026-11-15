-- 002_admin_rls — replace "any authenticated user is admin" with explicit admin list.
-- Run in Supabase SQL editor after 001_init.sql.

create table if not exists admin_users (
  id uuid primary key references auth.users (id) on delete cascade,
  added_at timestamptz not null default timezone('utc', now())
);

alter table admin_users enable row level security;

-- Membership is read only through the security-definer function below.
drop policy if exists admin_users_read on admin_users;

create or replace function is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from admin_users where id = auth.uid());
$$;

revoke all on function is_admin() from public;
grant execute on function is_admin() to authenticated;
grant execute on function is_admin() to anon;

drop policy if exists "admin_all_announcements" on announcements;
create policy "admin_all_announcements"
  on announcements for all
  using (is_admin())
  with check (is_admin());

drop policy if exists "admin_all_procedures" on admin_procedures;
create policy "admin_all_procedures"
  on admin_procedures for all
  using (is_admin())
  with check (is_admin());

-- Register the seeded admin (find id: Dashboard → Authentication → Users):
-- insert into admin_users (id) values ('<admin-user-uuid>') on conflict do nothing;
