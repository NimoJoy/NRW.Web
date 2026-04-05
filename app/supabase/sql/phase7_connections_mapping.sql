begin;

create table if not exists public.connections (
  id uuid primary key default gen_random_uuid(),
  account_number text not null unique references public.accounts(account_number) on delete cascade,
  pipeline_id uuid not null references public.pipelines(id) on delete restrict,
  latitude numeric(9, 6) not null check (latitude >= -90 and latitude <= 90),
  longitude numeric(9, 6) not null check (longitude >= -180 and longitude <= 180),
  status text not null default 'active' check (status in ('active', 'planned', 'inactive')),
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_connections_pipeline_id on public.connections(pipeline_id);
create index if not exists idx_connections_status on public.connections(status);
create index if not exists idx_connections_updated_at on public.connections(updated_at desc);

alter table public.connections enable row level security;

drop trigger if exists trg_connections_set_updated_at on public.connections;
create trigger trg_connections_set_updated_at
before update on public.connections
for each row
execute function public.set_updated_at();

drop policy if exists "connections_select_admin_or_reader" on public.connections;
create policy "connections_select_admin_or_reader"
on public.connections
for select
to authenticated
using (public.is_admin() or public.is_meter_reader());

drop policy if exists "connections_insert_admin" on public.connections;
create policy "connections_insert_admin"
on public.connections
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "connections_update_admin" on public.connections;
create policy "connections_update_admin"
on public.connections
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "connections_delete_admin" on public.connections;
create policy "connections_delete_admin"
on public.connections
for delete
to authenticated
using (public.is_admin());

commit;
