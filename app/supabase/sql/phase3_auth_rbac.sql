create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'meter_reader')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_set_updated_at on public.profiles;
create trigger trg_profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
using (auth.uid() = user_id);

drop policy if exists "profiles_insert_self_with_metadata_role" on public.profiles;
create policy "profiles_insert_self_with_metadata_role"
on public.profiles
for insert
to authenticated
with check (
  auth.uid() = user_id
  and role in ('admin', 'meter_reader')
  and role = coalesce((auth.jwt() -> 'app_metadata' ->> 'role')::text, 'meter_reader')
);

drop policy if exists "profiles_update_own_same_role" on public.profiles;
create policy "profiles_update_own_same_role"
on public.profiles
for update
to authenticated
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and role = coalesce((auth.jwt() -> 'app_metadata' ->> 'role')::text, 'meter_reader')
);
