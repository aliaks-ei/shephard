set lock_timeout = '10s';
set statement_timeout = '120s';

-- Durable domain-event outbox. Only privileged server code can read or mutate
-- it; authenticated clients receive opaque event IDs from transaction RPCs.
create table if not exists public.notification_outbox (
  id uuid primary key default gen_random_uuid(),
  event_type text not null check (event_type = any (array[
    'plan_shared',
    'template_shared',
    'shared_plan_updated',
    'shared_template_updated',
    'shared_plan_expense_added',
    'shared_plan_removed',
    'shared_template_removed',
    'shared_plan_cancelled',
    'shared_plan_permission_changed',
    'shared_template_permission_changed'
  ])),
  actor_user_id uuid not null references public.users(id) on delete cascade,
  entity_type text not null check (entity_type in ('plan', 'template')),
  entity_id uuid not null,
  recipient_ids uuid[] null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'completed', 'failed')),
  attempts integer not null default 0 check (attempts >= 0),
  available_at timestamptz not null default now(),
  claimed_at timestamptz null,
  processed_at timestamptz null,
  last_error text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.notification_outbox enable row level security;
revoke all on public.notification_outbox from public, anon, authenticated;
grant all on public.notification_outbox to service_role;

create index if not exists notification_outbox_pending_idx
  on public.notification_outbox(status, available_at, created_at)
  where status in ('pending', 'failed');

create or replace function private.enqueue_notification_event(
  event_type text,
  entity_type text,
  entity_id uuid,
  payload jsonb default '{}'::jsonb,
  recipient_ids uuid[] default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  event_id uuid;
  actor_id uuid := (select auth.uid());
begin
  if actor_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  insert into public.notification_outbox (
    event_type,
    actor_user_id,
    entity_type,
    entity_id,
    recipient_ids,
    payload
  )
  values (
    event_type,
    actor_id,
    entity_type,
    entity_id,
    recipient_ids,
    coalesce(payload, '{}'::jsonb)
  )
  returning id into event_id;

  return event_id;
end;
$$;

revoke all on function private.enqueue_notification_event(text, text, uuid, jsonb, uuid[])
  from public, anon;
grant execute on function private.enqueue_notification_event(text, text, uuid, jsonb, uuid[])
  to authenticated, service_role;

-- Preserve template item identity and update only the submitted diff.
create or replace function public.update_template_with_items(
  p_template_id uuid,
  p_template jsonb,
  p_items jsonb default '[]'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = 'public', 'pg_temp'
as $$
declare
  actor_id uuid := auth.uid();
  updated_template public.templates%rowtype;
  incoming_item_ids uuid[];
  incoming_id_count integer;
  result jsonb;
begin
  if actor_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if jsonb_typeof(coalesce(p_template, '{}'::jsonb)) <> 'object'
    or jsonb_typeof(coalesce(p_items, '[]'::jsonb)) <> 'array' then
    raise exception 'Invalid template transaction payload' using errcode = '22023';
  end if;

  perform 1
  from public.templates t
  where t.id = p_template_id
    and (
      t.owner_id = actor_id
      or exists (
        select 1
        from public.template_shares ts
        where ts.template_id = t.id
          and ts.shared_with_user_id = actor_id
          and ts.permission_level = 'edit'
      )
    )
  for update;

  if not found then
    raise exception 'Template not found or edit permission denied' using errcode = '42501';
  end if;

  select
    coalesce(array_agg(distinct (entry.value->>'id')::uuid), '{}'::uuid[]),
    count(*)
  into incoming_item_ids, incoming_id_count
  from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) entry
  where nullif(entry.value->>'id', '') is not null;

  if incoming_id_count <> cardinality(incoming_item_ids) then
    raise exception 'Duplicate template item IDs are not allowed' using errcode = '22023';
  end if;

  if (
    select count(*)
    from public.template_items ti
    where ti.template_id = p_template_id
      and ti.id = any(incoming_item_ids)
  ) <> cardinality(incoming_item_ids) then
    raise exception 'A template item does not belong to the template' using errcode = '42501';
  end if;

  update public.templates t
  set
    name = case when p_template ? 'name' then p_template->>'name' else t.name end,
    duration = case
      when p_template ? 'duration' then p_template->>'duration'
      else t.duration
    end,
    currency = case
      when p_template ? 'currency' then p_template->>'currency'
      else t.currency
    end,
    updated_at = now()
  where t.id = p_template_id
  returning * into updated_template;

  update public.template_items ti
  set
    name = item.name,
    category_id = item.category_id,
    amount = item.amount,
    is_fixed_payment = item.is_fixed_payment,
    updated_at = now()
  from jsonb_to_recordset(coalesce(p_items, '[]'::jsonb)) as item(
    id uuid,
    name text,
    category_id uuid,
    amount numeric,
    is_fixed_payment boolean
  )
  where item.id is not null
    and ti.id = item.id
    and ti.template_id = p_template_id;

  delete from public.template_items ti
  where ti.template_id = p_template_id
    and not (ti.id = any(incoming_item_ids));

  insert into public.template_items (
    template_id,
    name,
    category_id,
    amount,
    is_fixed_payment
  )
  select
    p_template_id,
    item.name,
    item.category_id,
    item.amount,
    item.is_fixed_payment
  from jsonb_to_recordset(coalesce(p_items, '[]'::jsonb)) as item(
    id uuid,
    name text,
    category_id uuid,
    amount numeric,
    is_fixed_payment boolean
  )
  where item.id is null;

  select
    to_jsonb(t)
    || jsonb_build_object(
      'template_items',
      coalesce(
        (
          select jsonb_agg(to_jsonb(ti) order by ti.created_at, ti.id)
          from public.template_items ti
          where ti.template_id = p_template_id
        ),
        '[]'::jsonb
      )
    )
  into result
  from public.templates t
  where t.id = p_template_id;

  return result;
end;
$$;

create or replace function public.create_expense_transaction(
  p_expense jsonb,
  p_complete_plan_item boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = 'public', 'pg_temp'
as $$
declare
  actor_id uuid := auth.uid();
  target_plan_id uuid := nullif(p_expense->>'plan_id', '')::uuid;
  target_category_id uuid := nullif(p_expense->>'category_id', '')::uuid;
  target_plan_item_id uuid := nullif(p_expense->>'plan_item_id', '')::uuid;
  plan_currency text;
  created_expense public.expenses%rowtype;
  outbox_id uuid;
begin
  if actor_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if jsonb_typeof(coalesce(p_expense, '{}'::jsonb)) <> 'object'
    or target_plan_id is null
    or target_category_id is null then
    raise exception 'Invalid expense transaction payload' using errcode = '22023';
  end if;

  select p.currency
  into plan_currency
  from public.plans p
  where p.id = target_plan_id
    and (
      p.owner_id = actor_id
      or exists (
        select 1
        from public.plan_shares ps
        where ps.plan_id = p.id
          and ps.shared_with_user_id = actor_id
          and ps.permission_level = 'edit'
      )
    )
  for update;

  if not found then
    raise exception 'Plan not found or edit permission denied' using errcode = '42501';
  end if;

  if target_plan_item_id is not null and not exists (
    select 1
    from public.plan_items pi
    where pi.id = target_plan_item_id
      and pi.plan_id = target_plan_id
      and pi.category_id = target_category_id
  ) then
    raise exception 'Plan item does not match the expense plan and category'
      using errcode = '23503';
  end if;

  insert into public.expenses (
    name,
    amount,
    expense_date,
    plan_id,
    category_id,
    user_id,
    plan_item_id,
    currency,
    original_amount,
    original_currency
  )
  values (
    trim(p_expense->>'name'),
    (p_expense->>'amount')::numeric,
    coalesce(nullif(p_expense->>'expense_date', '')::date, current_date),
    target_plan_id,
    target_category_id,
    actor_id,
    target_plan_item_id,
    coalesce(nullif(p_expense->>'currency', ''), plan_currency),
    nullif(p_expense->>'original_amount', '')::numeric,
    nullif(p_expense->>'original_currency', '')
  )
  returning * into created_expense;

  if p_complete_plan_item and target_plan_item_id is not null then
    update public.plan_items
    set is_completed = true,
        updated_at = now()
    where id = target_plan_item_id;
  end if;

  update public.plans
  set updated_at = now()
  where id = target_plan_id;

  outbox_id := private.enqueue_notification_event(
    'shared_plan_expense_added',
    'plan',
    target_plan_id,
    jsonb_build_object('expenseName', created_expense.name)
  );

  return jsonb_build_object(
    'expense', to_jsonb(created_expense),
    'outbox_id', outbox_id
  );
end;
$$;

create or replace function public.create_expenses_transaction(
  p_expenses jsonb,
  p_complete_plan_items boolean default true
)
returns jsonb
language plpgsql
security definer
set search_path = 'public', 'pg_temp'
as $$
declare
  expense_payload jsonb;
  transaction_result jsonb;
  created_expenses jsonb := '[]'::jsonb;
  outbox_ids jsonb := '[]'::jsonb;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if jsonb_typeof(coalesce(p_expenses, '[]'::jsonb)) <> 'array'
    or jsonb_array_length(coalesce(p_expenses, '[]'::jsonb)) = 0 then
    raise exception 'At least one expense is required' using errcode = '22023';
  end if;

  for expense_payload in
    select value from jsonb_array_elements(p_expenses)
  loop
    transaction_result := public.create_expense_transaction(
      expense_payload,
      p_complete_plan_items
    );
    created_expenses := created_expenses || jsonb_build_array(transaction_result->'expense');
    outbox_ids := outbox_ids || jsonb_build_array(transaction_result->'outbox_id');
  end loop;

  return jsonb_build_object(
    'expenses', created_expenses,
    'outbox_ids', outbox_ids
  );
end;
$$;

create or replace function public.delete_plan_transaction(p_plan_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = 'public', 'pg_temp'
as $$
declare
  actor_id uuid := auth.uid();
  plan_name text;
  recipients uuid[];
  outbox_id uuid;
begin
  if actor_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select p.name
  into plan_name
  from public.plans p
  where p.id = p_plan_id
    and p.owner_id = actor_id
  for update;

  if not found then
    raise exception 'Plan not found or delete permission denied' using errcode = '42501';
  end if;

  select coalesce(array_agg(ps.shared_with_user_id), '{}'::uuid[])
  into recipients
  from public.plan_shares ps
  where ps.plan_id = p_plan_id;

  outbox_id := private.enqueue_notification_event(
    'shared_plan_removed',
    'plan',
    p_plan_id,
    jsonb_build_object('entityName', plan_name),
    recipients
  );

  delete from public.plans where id = p_plan_id;

  return jsonb_build_object('deleted_id', p_plan_id, 'outbox_id', outbox_id);
end;
$$;

create or replace function public.delete_template_transaction(p_template_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = 'public', 'pg_temp'
as $$
declare
  actor_id uuid := auth.uid();
  template_name text;
  recipients uuid[];
  outbox_id uuid;
begin
  if actor_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select t.name
  into template_name
  from public.templates t
  where t.id = p_template_id
    and t.owner_id = actor_id
  for update;

  if not found then
    raise exception 'Template not found or delete permission denied' using errcode = '42501';
  end if;

  if exists (select 1 from public.plans p where p.template_id = p_template_id) then
    raise exception 'Template is referenced by one or more plans' using errcode = '23503';
  end if;

  select coalesce(array_agg(ts.shared_with_user_id), '{}'::uuid[])
  into recipients
  from public.template_shares ts
  where ts.template_id = p_template_id;

  outbox_id := private.enqueue_notification_event(
    'shared_template_removed',
    'template',
    p_template_id,
    jsonb_build_object('entityName', template_name),
    recipients
  );

  delete from public.templates where id = p_template_id;

  return jsonb_build_object('deleted_id', p_template_id, 'outbox_id', outbox_id);
end;
$$;

revoke all on function public.create_expense_transaction(jsonb, boolean)
  from public, anon;
revoke all on function public.create_expenses_transaction(jsonb, boolean)
  from public, anon;
revoke all on function public.delete_plan_transaction(uuid)
  from public, anon;
revoke all on function public.delete_template_transaction(uuid)
  from public, anon;

grant execute on function public.create_expense_transaction(jsonb, boolean)
  to authenticated, service_role;
grant execute on function public.create_expenses_transaction(jsonb, boolean)
  to authenticated, service_role;
grant execute on function public.delete_plan_transaction(uuid)
  to authenticated, service_role;
grant execute on function public.delete_template_transaction(uuid)
  to authenticated, service_role;
