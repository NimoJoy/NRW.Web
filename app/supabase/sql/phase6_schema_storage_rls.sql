begin;

create extension if not exists pgcrypto;

create or replace function public.jwt_role()
returns text
language sql
stable
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role')::text, 'meter_reader');
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select public.jwt_role() = 'admin';
$$;

create or replace function public.is_meter_reader()
returns boolean
language sql
stable
as $$
  select public.jwt_role() = 'meter_reader';
$$;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'meter_reader')),
  full_name text,
  phone text,
  org_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists org_id text;

create table if not exists public.pipelines (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  status text not null default 'active' check (status in ('active', 'maintenance', 'inactive')),
  geojson jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.accounts (
  account_number text primary key,
  customer_name text not null,
  address text,
  latitude numeric(9, 6),
  longitude numeric(9, 6),
  pipeline_id uuid references public.pipelines(id) on delete set null,
  status text not null default 'active' check (status in ('active', 'pending', 'suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.meters (
  id uuid primary key default gen_random_uuid(),
  account_number text not null references public.accounts(account_number) on delete cascade,
  meter_number text not null unique,
  install_date date,
  status text not null default 'active' check (status in ('active', 'maintenance', 'retired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.readings (
  id uuid primary key default gen_random_uuid(),
  meter_id uuid references public.meters(id) on delete set null,
  account_number text not null references public.accounts(account_number) on delete cascade,
  previous_reading numeric(12, 2) not null default 0,
  current_reading numeric(12, 2) not null,
  consumption numeric(12, 2) generated always as (greatest(current_reading - previous_reading, 0)) stored,
  pressure numeric(10, 2),
  photo_path text,
  reader_id uuid references auth.users(id) on delete set null,
  recorded_at timestamptz not null default now(),
  is_anomaly boolean not null default false,
  anomaly_reason text,
  created_at timestamptz not null default now(),
  check (current_reading >= previous_reading)
);

create table if not exists public.bills (
  id uuid primary key default gen_random_uuid(),
  account_number text not null references public.accounts(account_number) on delete cascade,
  billing_period date not null,
  amount_due numeric(12, 2) not null check (amount_due >= 0),
  status text not null default 'unpaid' check (status in ('paid', 'unpaid', 'overdue')),
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (account_number, billing_period)
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

drop trigger if exists trg_pipelines_set_updated_at on public.pipelines;
create trigger trg_pipelines_set_updated_at
before update on public.pipelines
for each row
execute function public.set_updated_at();

drop trigger if exists trg_accounts_set_updated_at on public.accounts;
create trigger trg_accounts_set_updated_at
before update on public.accounts
for each row
execute function public.set_updated_at();

drop trigger if exists trg_meters_set_updated_at on public.meters;
create trigger trg_meters_set_updated_at
before update on public.meters
for each row
execute function public.set_updated_at();

drop trigger if exists trg_bills_set_updated_at on public.bills;
create trigger trg_bills_set_updated_at
before update on public.bills
for each row
execute function public.set_updated_at();

create index if not exists idx_accounts_pipeline_id on public.accounts(pipeline_id);
create index if not exists idx_accounts_status on public.accounts(status);
create index if not exists idx_meters_account_number on public.meters(account_number);
create index if not exists idx_readings_account_recorded_at on public.readings(account_number, recorded_at desc);
create index if not exists idx_readings_reader_recorded_at on public.readings(reader_id, recorded_at desc);
create index if not exists idx_readings_meter_id on public.readings(meter_id);
create index if not exists idx_bills_account_period on public.bills(account_number, billing_period desc);
create index if not exists idx_bills_status on public.bills(status);

alter table public.profiles enable row level security;
alter table public.accounts enable row level security;
alter table public.meters enable row level security;
alter table public.readings enable row level security;
alter table public.bills enable row level security;
alter table public.pipelines enable row level security;

-- Profiles policies (retain self-service + add admin scope)
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
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

drop policy if exists "profiles_select_admin_all" on public.profiles;
create policy "profiles_select_admin_all"
on public.profiles
for select
to authenticated
using (public.is_admin());

drop policy if exists "profiles_insert_admin_all" on public.profiles;
create policy "profiles_insert_admin_all"
on public.profiles
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "profiles_update_admin_all" on public.profiles;
create policy "profiles_update_admin_all"
on public.profiles
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "profiles_delete_admin_all" on public.profiles;
create policy "profiles_delete_admin_all"
on public.profiles
for delete
to authenticated
using (public.is_admin());

-- Accounts policies
drop policy if exists "accounts_select_admin_or_reader" on public.accounts;
create policy "accounts_select_admin_or_reader"
on public.accounts
for select
to authenticated
using (public.is_admin() or public.is_meter_reader());

drop policy if exists "accounts_insert_admin" on public.accounts;
create policy "accounts_insert_admin"
on public.accounts
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "accounts_update_admin" on public.accounts;
create policy "accounts_update_admin"
on public.accounts
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "accounts_delete_admin" on public.accounts;
create policy "accounts_delete_admin"
on public.accounts
for delete
to authenticated
using (public.is_admin());

-- Meters policies
drop policy if exists "meters_select_admin_or_reader" on public.meters;
create policy "meters_select_admin_or_reader"
on public.meters
for select
to authenticated
using (public.is_admin() or public.is_meter_reader());

drop policy if exists "meters_insert_admin" on public.meters;
create policy "meters_insert_admin"
on public.meters
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "meters_update_admin" on public.meters;
create policy "meters_update_admin"
on public.meters
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "meters_delete_admin" on public.meters;
create policy "meters_delete_admin"
on public.meters
for delete
to authenticated
using (public.is_admin());

-- Readings policies
drop policy if exists "readings_select_admin" on public.readings;
create policy "readings_select_admin"
on public.readings
for select
to authenticated
using (public.is_admin());

drop policy if exists "readings_select_reader_own" on public.readings;
create policy "readings_select_reader_own"
on public.readings
for select
to authenticated
using (public.is_meter_reader() and reader_id = auth.uid());

drop policy if exists "readings_insert_reader_own" on public.readings;
create policy "readings_insert_reader_own"
on public.readings
for insert
to authenticated
with check (
  (public.is_meter_reader() and reader_id = auth.uid())
  or public.is_admin()
);

drop policy if exists "readings_update_admin" on public.readings;
create policy "readings_update_admin"
on public.readings
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "readings_delete_admin" on public.readings;
create policy "readings_delete_admin"
on public.readings
for delete
to authenticated
using (public.is_admin());

-- Bills policies
drop policy if exists "bills_select_admin_or_reader" on public.bills;
create policy "bills_select_admin_or_reader"
on public.bills
for select
to authenticated
using (public.is_admin() or public.is_meter_reader());

drop policy if exists "bills_insert_admin" on public.bills;
create policy "bills_insert_admin"
on public.bills
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "bills_update_admin" on public.bills;
create policy "bills_update_admin"
on public.bills
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "bills_delete_admin" on public.bills;
create policy "bills_delete_admin"
on public.bills
for delete
to authenticated
using (public.is_admin());

-- Pipelines policies
drop policy if exists "pipelines_select_admin_or_reader" on public.pipelines;
create policy "pipelines_select_admin_or_reader"
on public.pipelines
for select
to authenticated
using (public.is_admin() or public.is_meter_reader());

drop policy if exists "pipelines_insert_admin" on public.pipelines;
create policy "pipelines_insert_admin"
on public.pipelines
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "pipelines_update_admin" on public.pipelines;
create policy "pipelines_update_admin"
on public.pipelines
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "pipelines_delete_admin" on public.pipelines;
create policy "pipelines_delete_admin"
on public.pipelines
for delete
to authenticated
using (public.is_admin());

-- Storage bucket + storage object policies
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'meter-photos',
  'meter-photos',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "meter_photos_select_owner_or_admin" on storage.objects;
create policy "meter_photos_select_owner_or_admin"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'meter-photos'
  and (owner = auth.uid() or public.is_admin())
);

drop policy if exists "meter_photos_insert_owner_or_admin" on storage.objects;
create policy "meter_photos_insert_owner_or_admin"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'meter-photos'
  and (owner = auth.uid() or public.is_admin())
);

drop policy if exists "meter_photos_update_owner_or_admin" on storage.objects;
create policy "meter_photos_update_owner_or_admin"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'meter-photos'
  and (owner = auth.uid() or public.is_admin())
)
with check (
  bucket_id = 'meter-photos'
  and (owner = auth.uid() or public.is_admin())
);

drop policy if exists "meter_photos_delete_owner_or_admin" on storage.objects;
create policy "meter_photos_delete_owner_or_admin"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'meter-photos'
  and (owner = auth.uid() or public.is_admin())
);

commit;
