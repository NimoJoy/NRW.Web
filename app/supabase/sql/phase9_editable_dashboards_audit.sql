begin;

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('account', 'bill', 'connection', 'reading')),
  entity_id text not null,
  action_type text not null check (action_type in ('create', 'update', 'correction')),
  actor_user_id uuid not null references auth.users(id) on delete restrict,
  old_values jsonb,
  new_values jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_entity on public.audit_logs(entity_type, entity_id, created_at desc);
create index if not exists idx_audit_logs_actor on public.audit_logs(actor_user_id, created_at desc);

alter table public.audit_logs enable row level security;

drop policy if exists "audit_logs_select_admin" on public.audit_logs;
create policy "audit_logs_select_admin"
on public.audit_logs
for select
to authenticated
using (public.is_admin());

drop policy if exists "audit_logs_insert_actor" on public.audit_logs;
create policy "audit_logs_insert_actor"
on public.audit_logs
for insert
to authenticated
with check (
  actor_user_id = auth.uid()
  and (public.is_admin() or public.is_meter_reader())
);

commit;
