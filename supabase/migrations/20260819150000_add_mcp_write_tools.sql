-- Widen the MCP write surface. Every function here requires the 'write' access
-- level and is idempotent through private.mcp_idempotency_keys.
--
-- No function in this migration deletes anything. update_plan_with_items and
-- update_template_with_items are deliberately NOT exposed: they delete every
-- item missing from the payload, so a partial list from an assistant would
-- silently destroy plan items. Plan edits are split into narrow tools instead.

-- Shared idempotency guard. Returns the stored result when this exact request
-- was already applied, or null when it is new.
create or replace function private.mcp_write_begin(
  p_tool_name text,
  p_idempotency_key uuid,
  p_payload jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = 'private', 'pg_temp'
as $$
declare
  actor_id uuid := auth.uid();
  oauth_client_id uuid := private.mcp_client_id();
  payload_hash text;
  existing_hash text;
  existing_result jsonb;
begin
  if p_idempotency_key is null then
    raise exception 'An idempotency key is required' using errcode = '22023';
  end if;

  payload_hash := encode(extensions.digest(p_payload::text, 'sha256'), 'hex');
  perform pg_advisory_xact_lock(hashtextextended(
    actor_id::text || ':' || oauth_client_id::text || ':' || p_idempotency_key::text,
    0
  ));

  select request_hash, result
  into existing_hash, existing_result
  from private.mcp_idempotency_keys
  where user_id = actor_id
    and client_id = oauth_client_id
    and tool_name = p_tool_name
    and idempotency_key = p_idempotency_key;

  if found then
    if existing_hash <> payload_hash then
      raise exception 'Idempotency key was already used with a different request'
        using errcode = '22023';
    end if;
    return existing_result;
  end if;

  return null;
end;
$$;

create or replace function private.mcp_write_finish(
  p_tool_name text,
  p_idempotency_key uuid,
  p_payload jsonb,
  p_result jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = 'private', 'pg_temp'
as $$
begin
  insert into private.mcp_idempotency_keys (
    user_id, client_id, tool_name, idempotency_key, request_hash, result
  ) values (
    auth.uid(),
    private.mcp_client_id(),
    p_tool_name,
    p_idempotency_key,
    encode(extensions.digest(p_payload::text, 'sha256'), 'hex'),
    p_result
  );

  return p_result;
end;
$$;

-- Same permission rule the app's own transactions use: owner, or a share with
-- the 'edit' permission level.
create or replace function private.mcp_require_plan_edit(p_plan_id uuid)
returns void
language plpgsql
stable
security definer
set search_path = 'public', 'private', 'pg_temp'
as $$
declare
  actor_id uuid := auth.uid();
begin
  if not exists (
    select 1
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
  ) then
    raise exception 'Plan not found or edit permission denied' using errcode = '42501';
  end if;
end;
$$;

revoke all on function private.mcp_write_begin(text, uuid, jsonb) from public;
revoke all on function private.mcp_write_finish(text, uuid, jsonb, jsonb) from public;
revoke all on function private.mcp_require_plan_edit(uuid) from public;
grant execute on function private.mcp_write_begin(text, uuid, jsonb) to mcp_user;
grant execute on function private.mcp_write_finish(text, uuid, jsonb, jsonb) to mcp_user;
grant execute on function private.mcp_require_plan_edit(uuid) to mcp_user;

create or replace function public.mcp_create_plan(p_request jsonb)
returns jsonb
language plpgsql
security definer
set search_path = 'public', 'private', 'pg_temp'
as $$
declare
  idempotency_key uuid := nullif(p_request ->> 'idempotency_key', '')::uuid;
  plan jsonb := p_request -> 'plan';
  items jsonb := coalesce(p_request -> 'items', '[]'::jsonb);
  cached jsonb;
  created jsonb;
begin
  perform private.require_mcp_access('write');

  if jsonb_typeof(coalesce(plan, 'null'::jsonb)) <> 'object'
    or nullif(trim(plan ->> 'name'), '') is null
    or char_length(trim(plan ->> 'name')) > 100
    or nullif(plan ->> 'template_id', '') is null
    or nullif(plan ->> 'start_date', '') is null
    or nullif(plan ->> 'end_date', '') is null
    or jsonb_typeof(items) <> 'array' then
    raise exception 'Invalid plan payload' using errcode = '22023';
  end if;

  cached := private.mcp_write_begin('create_plan', idempotency_key, p_request);
  if cached is not null then
    return cached;
  end if;

  created := public.create_plan_with_items(plan, items);

  return private.mcp_write_finish('create_plan', idempotency_key, p_request, jsonb_build_object(
    'id', created ->> 'id',
    'name', created ->> 'name',
    'start_date', created ->> 'start_date',
    'end_date', created ->> 'end_date',
    'status', created ->> 'status',
    'currency', created ->> 'currency',
    'total', created -> 'total',
    'item_count', jsonb_array_length(coalesce(created -> 'plan_items', '[]'::jsonb))
  ));
end;
$$;

-- Plan fields only. Items are never touched here, so nothing can be deleted.
create or replace function public.mcp_update_plan(p_request jsonb)
returns jsonb
language plpgsql
security definer
set search_path = 'public', 'private', 'pg_temp'
as $$
declare
  idempotency_key uuid := nullif(p_request ->> 'idempotency_key', '')::uuid;
  target_plan_id uuid := nullif(p_request ->> 'plan_id', '')::uuid;
  updates jsonb := p_request -> 'plan';
  cached jsonb;
  updated public.plans%rowtype;
begin
  perform private.require_mcp_access('write');

  if target_plan_id is null or jsonb_typeof(coalesce(updates, 'null'::jsonb)) <> 'object' then
    raise exception 'Invalid plan update payload' using errcode = '22023';
  end if;

  perform private.mcp_require_plan_edit(target_plan_id);

  cached := private.mcp_write_begin('update_plan', idempotency_key, p_request);
  if cached is not null then
    return cached;
  end if;

  update public.plans p
  set
    name = case when updates ? 'name' then trim(updates ->> 'name') else p.name end,
    start_date = case
      when updates ? 'start_date' then (updates ->> 'start_date')::date
      else p.start_date
    end,
    end_date = case
      when updates ? 'end_date' then (updates ->> 'end_date')::date
      else p.end_date
    end,
    currency = case when updates ? 'currency' then updates ->> 'currency' else p.currency end,
    status = case when updates ? 'status' then updates ->> 'status' else p.status end,
    updated_at = now()
  where p.id = target_plan_id
  returning * into updated;

  return private.mcp_write_finish('update_plan', idempotency_key, p_request, jsonb_build_object(
    'id', updated.id,
    'name', updated.name,
    'start_date', updated.start_date,
    'end_date', updated.end_date,
    'status', updated.status,
    'currency', updated.currency,
    'total', updated.total
  ));
end;
$$;

create or replace function public.mcp_add_plan_item(p_request jsonb)
returns jsonb
language plpgsql
security definer
set search_path = 'public', 'private', 'pg_temp'
as $$
declare
  idempotency_key uuid := nullif(p_request ->> 'idempotency_key', '')::uuid;
  item jsonb := p_request -> 'item';
  target_plan_id uuid := nullif(item ->> 'plan_id', '')::uuid;
  cached jsonb;
  created public.plan_items%rowtype;
begin
  perform private.require_mcp_access('write');

  if jsonb_typeof(coalesce(item, 'null'::jsonb)) <> 'object'
    or target_plan_id is null
    or nullif(trim(item ->> 'name'), '') is null
    or nullif(item ->> 'category_id', '') is null
    or coalesce((item ->> 'amount')::numeric, 0) <= 0 then
    raise exception 'Invalid plan item payload' using errcode = '22023';
  end if;

  perform private.mcp_require_plan_edit(target_plan_id);

  cached := private.mcp_write_begin('add_plan_item', idempotency_key, p_request);
  if cached is not null then
    return cached;
  end if;

  insert into public.plan_items (plan_id, name, category_id, amount, is_fixed_payment)
  values (
    target_plan_id,
    trim(item ->> 'name'),
    (item ->> 'category_id')::uuid,
    (item ->> 'amount')::numeric,
    coalesce((item ->> 'is_fixed_payment')::boolean, false)
  )
  returning * into created;

  return private.mcp_write_finish('add_plan_item', idempotency_key, p_request, jsonb_build_object(
    'id', created.id,
    'plan_id', created.plan_id,
    'name', created.name,
    'category_id', created.category_id,
    'amount', created.amount,
    'is_fixed_payment', created.is_fixed_payment,
    'is_completed', created.is_completed
  ));
end;
$$;

create or replace function public.mcp_update_plan_item(p_request jsonb)
returns jsonb
language plpgsql
security definer
set search_path = 'public', 'private', 'pg_temp'
as $$
declare
  idempotency_key uuid := nullif(p_request ->> 'idempotency_key', '')::uuid;
  target_item_id uuid := nullif(p_request ->> 'plan_item_id', '')::uuid;
  updates jsonb := p_request -> 'item';
  owning_plan_id uuid;
  cached jsonb;
  updated public.plan_items%rowtype;
begin
  perform private.require_mcp_access('write');

  if target_item_id is null or jsonb_typeof(coalesce(updates, 'null'::jsonb)) <> 'object' then
    raise exception 'Invalid plan item update payload' using errcode = '22023';
  end if;

  select pi.plan_id into owning_plan_id
  from public.plan_items pi
  where pi.id = target_item_id;

  if owning_plan_id is null then
    raise exception 'Plan item not found' using errcode = 'P0002';
  end if;

  perform private.mcp_require_plan_edit(owning_plan_id);

  cached := private.mcp_write_begin('update_plan_item', idempotency_key, p_request);
  if cached is not null then
    return cached;
  end if;

  update public.plan_items pi
  set
    name = case when updates ? 'name' then trim(updates ->> 'name') else pi.name end,
    category_id = case
      when updates ? 'category_id' then (updates ->> 'category_id')::uuid
      else pi.category_id
    end,
    amount = case when updates ? 'amount' then (updates ->> 'amount')::numeric else pi.amount end,
    is_fixed_payment = case
      when updates ? 'is_fixed_payment' then (updates ->> 'is_fixed_payment')::boolean
      else pi.is_fixed_payment
    end,
    is_completed = case
      when updates ? 'is_completed' then (updates ->> 'is_completed')::boolean
      else pi.is_completed
    end,
    updated_at = now()
  where pi.id = target_item_id
  returning * into updated;

  return private.mcp_write_finish(
    'update_plan_item', idempotency_key, p_request, jsonb_build_object(
      'id', updated.id,
      'plan_id', updated.plan_id,
      'name', updated.name,
      'category_id', updated.category_id,
      'amount', updated.amount,
      'is_fixed_payment', updated.is_fixed_payment,
      'is_completed', updated.is_completed
    )
  );
end;
$$;

create or replace function public.mcp_record_expenses(p_request jsonb)
returns jsonb
language plpgsql
security definer
set search_path = 'public', 'private', 'pg_temp'
as $$
declare
  idempotency_key uuid := nullif(p_request ->> 'idempotency_key', '')::uuid;
  expenses jsonb := p_request -> 'expenses';
  entry jsonb;
  cached jsonb;
  transaction_result jsonb;
begin
  perform private.require_mcp_access('write');

  if jsonb_typeof(coalesce(expenses, 'null'::jsonb)) <> 'array'
    or jsonb_array_length(expenses) = 0
    or jsonb_array_length(expenses) > 50 then
    raise exception 'Between 1 and 50 expenses are required' using errcode = '22023';
  end if;

  for entry in select value from jsonb_array_elements(expenses)
  loop
    if nullif(trim(entry ->> 'name'), '') is null
      or char_length(trim(entry ->> 'name')) > 100
      or nullif(entry ->> 'plan_id', '') is null
      or nullif(entry ->> 'category_id', '') is null
      or coalesce((entry ->> 'amount')::numeric, 0) <= 0 then
      raise exception 'Invalid expense payload' using errcode = '22023';
    end if;
  end loop;

  cached := private.mcp_write_begin('record_expenses', idempotency_key, p_request);
  if cached is not null then
    return cached;
  end if;

  transaction_result := public.create_expenses_transaction(expenses, false);

  return private.mcp_write_finish(
    'record_expenses', idempotency_key, p_request, jsonb_build_object(
      'items', coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', e ->> 'id',
          'name', e ->> 'name',
          'amount', e -> 'amount',
          'currency', e ->> 'currency',
          'expense_date', e ->> 'expense_date',
          'plan_id', e ->> 'plan_id',
          'category_id', e ->> 'category_id'
        ))
        from jsonb_array_elements(coalesce(transaction_result -> 'expenses', '[]'::jsonb)) e
      ), '[]'::jsonb)
    )
  );
end;
$$;

create or replace function public.mcp_update_expense(p_request jsonb)
returns jsonb
language plpgsql
security definer
set search_path = 'public', 'private', 'pg_temp'
as $$
declare
  idempotency_key uuid := nullif(p_request ->> 'idempotency_key', '')::uuid;
  target_expense_id uuid := nullif(p_request ->> 'expense_id', '')::uuid;
  updates jsonb := p_request -> 'expense';
  owning_plan_id uuid;
  cached jsonb;
  updated public.expenses%rowtype;
begin
  perform private.require_mcp_access('write');

  if target_expense_id is null or jsonb_typeof(coalesce(updates, 'null'::jsonb)) <> 'object' then
    raise exception 'Invalid expense update payload' using errcode = '22023';
  end if;

  select e.plan_id into owning_plan_id
  from public.expenses e
  where e.id = target_expense_id;

  if owning_plan_id is null then
    raise exception 'Expense not found' using errcode = 'P0002';
  end if;

  perform private.mcp_require_plan_edit(owning_plan_id);

  if updates ? 'amount' and coalesce((updates ->> 'amount')::numeric, 0) <= 0 then
    raise exception 'Invalid expense payload' using errcode = '22023';
  end if;

  cached := private.mcp_write_begin('update_expense', idempotency_key, p_request);
  if cached is not null then
    return cached;
  end if;

  update public.expenses e
  set
    name = case when updates ? 'name' then trim(updates ->> 'name') else e.name end,
    amount = case when updates ? 'amount' then (updates ->> 'amount')::numeric else e.amount end,
    expense_date = case
      when updates ? 'expense_date' then (updates ->> 'expense_date')::date
      else e.expense_date
    end,
    category_id = case
      when updates ? 'category_id' then (updates ->> 'category_id')::uuid
      else e.category_id
    end,
    updated_at = now()
  where e.id = target_expense_id
  returning * into updated;

  return private.mcp_write_finish(
    'update_expense', idempotency_key, p_request, jsonb_build_object(
      'id', updated.id,
      'name', updated.name::text,
      'amount', updated.amount,
      'currency', updated.currency,
      'expense_date', updated.expense_date,
      'plan_id', updated.plan_id,
      'category_id', updated.category_id
    )
  );
end;
$$;

create or replace function public.mcp_create_template(p_request jsonb)
returns jsonb
language plpgsql
security definer
set search_path = 'public', 'private', 'pg_temp'
as $$
declare
  idempotency_key uuid := nullif(p_request ->> 'idempotency_key', '')::uuid;
  template jsonb := p_request -> 'template';
  items jsonb := coalesce(p_request -> 'items', '[]'::jsonb);
  cached jsonb;
  created jsonb;
begin
  perform private.require_mcp_access('write');

  if jsonb_typeof(coalesce(template, 'null'::jsonb)) <> 'object'
    or nullif(trim(template ->> 'name'), '') is null
    or char_length(trim(template ->> 'name')) > 100
    or nullif(template ->> 'duration', '') is null
    or jsonb_typeof(items) <> 'array' then
    raise exception 'Invalid template payload' using errcode = '22023';
  end if;

  cached := private.mcp_write_begin('create_template', idempotency_key, p_request);
  if cached is not null then
    return cached;
  end if;

  created := public.create_template_with_items(template, items);

  return private.mcp_write_finish(
    'create_template', idempotency_key, p_request, jsonb_build_object(
      'id', created ->> 'id',
      'name', created ->> 'name',
      'duration', created ->> 'duration',
      'currency', created ->> 'currency',
      'total', created -> 'total',
      'item_count', jsonb_array_length(coalesce(created -> 'template_items', '[]'::jsonb))
    )
  );
end;
$$;

revoke all on function public.mcp_create_plan(jsonb) from public;
revoke all on function public.mcp_update_plan(jsonb) from public;
revoke all on function public.mcp_add_plan_item(jsonb) from public;
revoke all on function public.mcp_update_plan_item(jsonb) from public;
revoke all on function public.mcp_record_expenses(jsonb) from public;
revoke all on function public.mcp_update_expense(jsonb) from public;
revoke all on function public.mcp_create_template(jsonb) from public;

grant execute on function public.mcp_create_plan(jsonb) to mcp_user;
grant execute on function public.mcp_update_plan(jsonb) to mcp_user;
grant execute on function public.mcp_add_plan_item(jsonb) to mcp_user;
grant execute on function public.mcp_update_plan_item(jsonb) to mcp_user;
grant execute on function public.mcp_record_expenses(jsonb) to mcp_user;
grant execute on function public.mcp_update_expense(jsonb) to mcp_user;
grant execute on function public.mcp_create_template(jsonb) to mcp_user;

notify pgrst, 'reload schema';
