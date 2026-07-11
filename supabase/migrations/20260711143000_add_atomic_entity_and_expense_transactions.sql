create or replace function public.create_plan_with_items(
  p_plan jsonb,
  p_items jsonb default '[]'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor_id uuid := auth.uid();
  created_plan public.plans%rowtype;
  result jsonb;
begin
  if actor_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if jsonb_typeof(coalesce(p_plan, '{}'::jsonb)) <> 'object'
    or jsonb_typeof(coalesce(p_items, '[]'::jsonb)) <> 'array' then
    raise exception 'Invalid plan transaction payload' using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.templates t
    where t.id = (p_plan->>'template_id')::uuid
      and (
        t.owner_id = actor_id
        or exists (
          select 1
          from public.template_shares ts
          where ts.template_id = t.id
            and ts.shared_with_user_id = actor_id
        )
      )
  ) then
    raise exception 'Template not found or access denied' using errcode = '42501';
  end if;

  insert into public.plans (
    name,
    owner_id,
    start_date,
    end_date,
    template_id,
    currency,
    total,
    status
  )
  values (
    p_plan->>'name',
    actor_id,
    (p_plan->>'start_date')::date,
    (p_plan->>'end_date')::date,
    (p_plan->>'template_id')::uuid,
    p_plan->>'currency',
    (p_plan->>'total')::numeric,
    coalesce(nullif(p_plan->>'status', ''), 'active')
  )
  returning * into created_plan;

  insert into public.plan_items (
    plan_id,
    name,
    category_id,
    amount,
    is_fixed_payment
  )
  select
    created_plan.id,
    item.name,
    item.category_id,
    item.amount,
    item.is_fixed_payment
  from jsonb_to_recordset(coalesce(p_items, '[]'::jsonb)) as item(
    name text,
    category_id uuid,
    amount numeric,
    is_fixed_payment boolean
  );

  select
    to_jsonb(created_plan)
    || jsonb_build_object(
      'plan_items',
      coalesce(
        (
          select jsonb_agg(to_jsonb(pi) order by pi.created_at, pi.id)
          from public.plan_items pi
          where pi.plan_id = created_plan.id
        ),
        '[]'::jsonb
      )
    )
  into result;

  return result;
end;
$$;

create or replace function public.update_plan_with_items(
  p_plan_id uuid,
  p_plan jsonb,
  p_items jsonb default '[]'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor_id uuid := auth.uid();
  updated_plan public.plans%rowtype;
  incoming_item_ids uuid[];
  incoming_id_count integer;
  result jsonb;
begin
  if actor_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if jsonb_typeof(coalesce(p_plan, '{}'::jsonb)) <> 'object'
    or jsonb_typeof(coalesce(p_items, '[]'::jsonb)) <> 'array' then
    raise exception 'Invalid plan transaction payload' using errcode = '22023';
  end if;

  perform 1
  from public.plans p
  where p.id = p_plan_id
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

  select
    coalesce(array_agg(distinct (entry.value->>'id')::uuid), '{}'::uuid[]),
    count(*)
  into incoming_item_ids, incoming_id_count
  from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) entry
  where nullif(entry.value->>'id', '') is not null;

  if incoming_id_count <> cardinality(incoming_item_ids) then
    raise exception 'Duplicate plan item IDs are not allowed' using errcode = '22023';
  end if;

  if (
    select count(*)
    from public.plan_items pi
    where pi.plan_id = p_plan_id
      and pi.id = any(incoming_item_ids)
  ) <> cardinality(incoming_item_ids) then
    raise exception 'A plan item does not belong to the plan' using errcode = '42501';
  end if;

  update public.plans p
  set
    name = case when p_plan ? 'name' then p_plan->>'name' else p.name end,
    start_date = case
      when p_plan ? 'start_date' then (p_plan->>'start_date')::date
      else p.start_date
    end,
    end_date = case
      when p_plan ? 'end_date' then (p_plan->>'end_date')::date
      else p.end_date
    end,
    currency = case when p_plan ? 'currency' then p_plan->>'currency' else p.currency end,
    total = case
      when p_plan ? 'total' then (p_plan->>'total')::numeric
      else p.total
    end,
    status = case when p_plan ? 'status' then p_plan->>'status' else p.status end,
    updated_at = now()
  where p.id = p_plan_id
  returning * into updated_plan;

  update public.plan_items pi
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
    and pi.id = item.id
    and pi.plan_id = p_plan_id;

  delete from public.plan_items pi
  where pi.plan_id = p_plan_id
    and not (pi.id = any(incoming_item_ids));

  insert into public.plan_items (
    plan_id,
    name,
    category_id,
    amount,
    is_fixed_payment
  )
  select
    p_plan_id,
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
    to_jsonb(updated_plan)
    || jsonb_build_object(
      'plan_items',
      coalesce(
        (
          select jsonb_agg(to_jsonb(pi) order by pi.created_at, pi.id)
          from public.plan_items pi
          where pi.plan_id = p_plan_id
        ),
        '[]'::jsonb
      )
    )
  into result;

  return result;
end;
$$;

create or replace function public.create_template_with_items(
  p_template jsonb,
  p_items jsonb default '[]'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor_id uuid := auth.uid();
  created_template public.templates%rowtype;
  result jsonb;
begin
  if actor_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if jsonb_typeof(coalesce(p_template, '{}'::jsonb)) <> 'object'
    or jsonb_typeof(coalesce(p_items, '[]'::jsonb)) <> 'array' then
    raise exception 'Invalid template transaction payload' using errcode = '22023';
  end if;

  insert into public.templates (
    name,
    owner_id,
    duration,
    currency,
    total
  )
  values (
    p_template->>'name',
    actor_id,
    p_template->>'duration',
    p_template->>'currency',
    (p_template->>'total')::numeric
  )
  returning * into created_template;

  insert into public.template_items (
    template_id,
    name,
    category_id,
    amount,
    is_fixed_payment
  )
  select
    created_template.id,
    item.name,
    item.category_id,
    item.amount,
    item.is_fixed_payment
  from jsonb_to_recordset(coalesce(p_items, '[]'::jsonb)) as item(
    name text,
    category_id uuid,
    amount numeric,
    is_fixed_payment boolean
  );

  select
    to_jsonb(created_template)
    || jsonb_build_object(
      'template_items',
      coalesce(
        (
          select jsonb_agg(to_jsonb(ti) order by ti.created_at, ti.id)
          from public.template_items ti
          where ti.template_id = created_template.id
        ),
        '[]'::jsonb
      )
    )
  into result;

  return result;
end;
$$;

create or replace function public.update_template_with_items(
  p_template_id uuid,
  p_template jsonb,
  p_items jsonb default '[]'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor_id uuid := auth.uid();
  updated_template public.templates%rowtype;
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
    total = case
      when p_template ? 'total' then (p_template->>'total')::numeric
      else t.total
    end,
    updated_at = now()
  where t.id = p_template_id
  returning * into updated_template;

  -- Template item IDs intentionally remain unstable across edits.
  delete from public.template_items ti
  where ti.template_id = p_template_id;

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
    name text,
    category_id uuid,
    amount numeric,
    is_fixed_payment boolean
  );

  select
    to_jsonb(updated_template)
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
  into result;

  return result;
end;
$$;

create or replace function public.delete_expenses_and_reconcile(
  p_expense_ids uuid[]
)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor_id uuid := auth.uid();
  requested_count integer;
  deleted_count integer;
  affected_item_ids uuid[];
  affected_plan_ids uuid[];
begin
  if actor_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  requested_count := coalesce(cardinality(p_expense_ids), 0);
  if requested_count = 0 then
    return 0;
  end if;

  if (
    select count(distinct requested.expense_id)
    from unnest(p_expense_ids) as requested(expense_id)
  ) <> requested_count then
    raise exception 'Duplicate expense IDs are not allowed' using errcode = '22023';
  end if;

  perform 1
  from public.expenses e
  join public.plans p on p.id = e.plan_id
  where e.id = any(p_expense_ids)
  for update of e;

  if (
    select count(*)
    from public.expenses e
    where e.id = any(p_expense_ids)
  ) <> requested_count then
    raise exception 'One or more expenses were not found' using errcode = 'P0002';
  end if;

  if exists (
    select 1
    from public.expenses e
    join public.plans p on p.id = e.plan_id
    where e.id = any(p_expense_ids)
      and not (
        p.owner_id = actor_id
        or exists (
          select 1
          from public.plan_shares ps
          where ps.plan_id = p.id
            and ps.shared_with_user_id = actor_id
            and ps.permission_level = 'edit'
        )
      )
  ) then
    raise exception 'Expense edit permission denied' using errcode = '42501';
  end if;

  select
    coalesce(array_agg(distinct e.plan_item_id) filter (where e.plan_item_id is not null), '{}'::uuid[]),
    coalesce(array_agg(distinct e.plan_id), '{}'::uuid[])
  into affected_item_ids, affected_plan_ids
  from public.expenses e
  where e.id = any(p_expense_ids);

  delete from public.expenses e
  where e.id = any(p_expense_ids);
  get diagnostics deleted_count = row_count;

  update public.plan_items pi
  set
    is_completed = exists (
      select 1
      from public.expenses e
      where e.plan_item_id = pi.id
    ),
    updated_at = now()
  where pi.id = any(affected_item_ids);

  update public.plans p
  set updated_at = now()
  where p.id = any(affected_plan_ids);

  return deleted_count;
end;
$$;

revoke all on function public.create_plan_with_items(jsonb, jsonb) from public;
revoke all on function public.update_plan_with_items(uuid, jsonb, jsonb) from public;
revoke all on function public.create_template_with_items(jsonb, jsonb) from public;
revoke all on function public.update_template_with_items(uuid, jsonb, jsonb) from public;
revoke all on function public.delete_expenses_and_reconcile(uuid[]) from public;

grant execute on function public.create_plan_with_items(jsonb, jsonb) to authenticated;
grant execute on function public.update_plan_with_items(uuid, jsonb, jsonb) to authenticated;
grant execute on function public.create_template_with_items(jsonb, jsonb) to authenticated;
grant execute on function public.update_template_with_items(uuid, jsonb, jsonb) to authenticated;
grant execute on function public.delete_expenses_and_reconcile(uuid[]) to authenticated;

alter table public.plan_shares enable row level security;
alter table public.template_shares enable row level security;

drop policy if exists plan_shares_owner_insert_guard on public.plan_shares;
create policy plan_shares_owner_insert_guard
on public.plan_shares
as restrictive
for insert
to authenticated
with check (
  shared_by_user_id = auth.uid()
  and exists (
    select 1
    from public.plans p
    where p.id = plan_id
      and p.owner_id = auth.uid()
  )
);

drop policy if exists plan_shares_owner_update_guard on public.plan_shares;
create policy plan_shares_owner_update_guard
on public.plan_shares
as restrictive
for update
to authenticated
using (
  exists (
    select 1
    from public.plans p
    where p.id = plan_id
      and p.owner_id = auth.uid()
  )
)
with check (
  shared_by_user_id = auth.uid()
  and exists (
    select 1
    from public.plans p
    where p.id = plan_id
      and p.owner_id = auth.uid()
  )
);

drop policy if exists plan_shares_owner_delete_guard on public.plan_shares;
create policy plan_shares_owner_delete_guard
on public.plan_shares
as restrictive
for delete
to authenticated
using (
  exists (
    select 1
    from public.plans p
    where p.id = plan_id
      and p.owner_id = auth.uid()
  )
);

drop policy if exists template_shares_owner_insert_guard on public.template_shares;
create policy template_shares_owner_insert_guard
on public.template_shares
as restrictive
for insert
to authenticated
with check (
  shared_by_user_id = auth.uid()
  and exists (
    select 1
    from public.templates t
    where t.id = template_id
      and t.owner_id = auth.uid()
  )
);

drop policy if exists template_shares_owner_update_guard on public.template_shares;
create policy template_shares_owner_update_guard
on public.template_shares
as restrictive
for update
to authenticated
using (
  exists (
    select 1
    from public.templates t
    where t.id = template_id
      and t.owner_id = auth.uid()
  )
)
with check (
  shared_by_user_id = auth.uid()
  and exists (
    select 1
    from public.templates t
    where t.id = template_id
      and t.owner_id = auth.uid()
  )
);

drop policy if exists template_shares_owner_delete_guard on public.template_shares;
create policy template_shares_owner_delete_guard
on public.template_shares
as restrictive
for delete
to authenticated
using (
  exists (
    select 1
    from public.templates t
    where t.id = template_id
      and t.owner_id = auth.uid()
  )
);

notify pgrst, 'reload schema';
