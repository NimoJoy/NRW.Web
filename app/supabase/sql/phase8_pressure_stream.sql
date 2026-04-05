begin;

create table if not exists public.pressure_readings (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null references public.connections(id) on delete cascade,
  account_number text not null references public.accounts(account_number) on delete cascade,
  pipeline_id uuid references public.pipelines(id) on delete set null,
  pressure_value numeric(10, 2) not null check (pressure_value > 0 and pressure_value <= 250),
  pressure_unit text not null default 'psi' check (pressure_unit in ('psi')),
  reader_id uuid references auth.users(id) on delete set null,
  recorded_at timestamptz not null default now(),
  is_anomaly boolean not null default false,
  anomaly_reason text,
  notes text,
  validated_by uuid references auth.users(id) on delete set null,
  validated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_pressure_readings_connection_id on public.pressure_readings(connection_id);
create index if not exists idx_pressure_readings_account_recorded_at on public.pressure_readings(account_number, recorded_at desc);
create index if not exists idx_pressure_readings_pipeline_recorded_at on public.pressure_readings(pipeline_id, recorded_at desc);
create index if not exists idx_pressure_readings_anomaly on public.pressure_readings(is_anomaly);

alter table public.pressure_readings enable row level security;

drop trigger if exists trg_pressure_readings_set_updated_at on public.pressure_readings;
create trigger trg_pressure_readings_set_updated_at
before update on public.pressure_readings
for each row
execute function public.set_updated_at();

drop policy if exists "pressure_readings_select_admin" on public.pressure_readings;
create policy "pressure_readings_select_admin"
on public.pressure_readings
for select
to authenticated
using (public.is_admin());

drop policy if exists "pressure_readings_select_reader_own" on public.pressure_readings;
create policy "pressure_readings_select_reader_own"
on public.pressure_readings
for select
to authenticated
using (public.is_meter_reader() and reader_id = auth.uid());

drop policy if exists "pressure_readings_insert_reader_own" on public.pressure_readings;
create policy "pressure_readings_insert_reader_own"
on public.pressure_readings
for insert
to authenticated
with check (
  (public.is_meter_reader() and reader_id = auth.uid())
  or public.is_admin()
);

drop policy if exists "pressure_readings_update_admin" on public.pressure_readings;
create policy "pressure_readings_update_admin"
on public.pressure_readings
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "pressure_readings_delete_admin" on public.pressure_readings;
create policy "pressure_readings_delete_admin"
on public.pressure_readings
for delete
to authenticated
using (public.is_admin());

commit;
