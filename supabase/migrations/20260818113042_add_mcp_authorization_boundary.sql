-- Keep OAuth MCP tokens separate from the application's normal authenticated role.
-- This role can invoke only the narrow mcp_* RPC surface defined below.
do $$
begin
  create role mcp_user nologin noinherit;
exception
  when duplicate_object then null;
end;
$$;

grant mcp_user to authenticator;
grant usage on schema public to mcp_user;
revoke all on all tables in schema public from mcp_user;
revoke all on all sequences in schema public from mcp_user;

create table if not exists private.mcp_authorizations (
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null,
  access_level text not null default 'read'
    check (access_level in ('read', 'write')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  revoked_at timestamptz,
  primary key (user_id, client_id)
);

alter table private.mcp_authorizations enable row level security;
revoke all on table private.mcp_authorizations from public, anon, authenticated, mcp_user;

create table if not exists private.mcp_idempotency_keys (
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null,
  tool_name text not null,
  idempotency_key uuid not null,
  request_hash text not null,
  result jsonb not null,
  created_at timestamptz not null default now(),
  primary key (user_id, client_id, tool_name, idempotency_key)
);

alter table private.mcp_idempotency_keys enable row level security;
revoke all on table private.mcp_idempotency_keys from public, anon, authenticated, mcp_user;

create or replace function private.mcp_client_id()
returns uuid
language sql
stable
security invoker
set search_path = ''
as $$
  select nullif(auth.jwt() ->> 'client_id', '')::uuid;
$$;

create or replace function private.has_mcp_access(p_required_level text)
returns boolean
language plpgsql
stable
security definer
set search_path = 'private', 'pg_temp'
as $$
declare
  actor_id uuid := auth.uid();
  oauth_client_id uuid := private.mcp_client_id();
  granted_level text;
begin
  if actor_id is null or oauth_client_id is null then
    return false;
  end if;

  select access_level
  into granted_level
  from private.mcp_authorizations
  where user_id = actor_id
    and client_id = oauth_client_id
    and revoked_at is null;

  return granted_level = 'write'
    or (p_required_level = 'read' and granted_level = 'read');
end;
$$;

create or replace function private.require_mcp_access(p_required_level text)
returns void
language plpgsql
stable
security definer
set search_path = 'private', 'pg_temp'
as $$
begin
  if p_required_level not in ('read', 'write') then
    raise exception 'Invalid MCP access level' using errcode = '22023';
  end if;

  if not private.has_mcp_access(p_required_level) then
    raise exception 'MCP access is not authorized' using errcode = '42501';
  end if;
end;
$$;

revoke all on function private.mcp_client_id() from public;
revoke all on function private.has_mcp_access(text) from public;
revoke all on function private.require_mcp_access(text) from public;
grant execute on function private.mcp_client_id() to mcp_user;
grant execute on function private.has_mcp_access(text) to mcp_user;
grant execute on function private.require_mcp_access(text) to mcp_user;

-- The OAuth server invokes this hook for both initial and refreshed access
-- tokens. Configure it in Authentication > Hooks after this migration is live.
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
security definer
set search_path = 'private', 'pg_temp'
as $$
declare
  claims jsonb := coalesce(event -> 'claims', '{}'::jsonb);
  actor_id uuid := nullif(event ->> 'user_id', '')::uuid;
  oauth_client_id uuid := nullif(claims ->> 'client_id', '')::uuid;
begin
  if actor_id is not null
    and oauth_client_id is not null
    and exists (
      select 1
      from private.mcp_authorizations
      where user_id = actor_id
        and client_id = oauth_client_id
        and revoked_at is null
    ) then
    claims := jsonb_set(claims, '{role}', '"mcp_user"'::jsonb);
    claims := jsonb_set(claims, '{aud}', '"shephard-mcp"'::jsonb);
  end if;

  return jsonb_build_object('claims', claims);
end;
$$;

revoke all on function public.custom_access_token_hook(jsonb) from public, anon, authenticated, mcp_user;
grant usage on schema public to supabase_auth_admin;
grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;
grant execute on function public.custom_access_token_hook(jsonb) to service_role;

create or replace function public.authorize_mcp_client(p_client_id uuid)
returns void
language plpgsql
security definer
set search_path = 'private', 'pg_temp'
as $$
begin
  if auth.uid() is null or private.mcp_client_id() is not null then
    raise exception 'Only a direct authenticated user can authorize an MCP client'
      using errcode = '42501';
  end if;

  insert into private.mcp_authorizations (user_id, client_id, access_level, revoked_at)
  values (auth.uid(), p_client_id, 'read', null)
  on conflict (user_id, client_id)
  do update set revoked_at = null, updated_at = now();
end;
$$;

create or replace function public.list_mcp_authorizations()
returns table (
  client_id uuid,
  access_level text,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = 'private', 'pg_temp'
as $$
  select a.client_id, a.access_level, a.created_at, a.updated_at
  from private.mcp_authorizations a
  where a.user_id = auth.uid()
    and a.revoked_at is null
  order by a.updated_at desc;
$$;

create or replace function public.set_mcp_authorization_access(
  p_client_id uuid,
  p_access_level text
)
returns void
language plpgsql
security definer
set search_path = 'private', 'pg_temp'
as $$
begin
  if auth.uid() is null or private.mcp_client_id() is not null then
    raise exception 'Only a direct authenticated user can update MCP access'
      using errcode = '42501';
  end if;

  if p_access_level not in ('read', 'write') then
    raise exception 'Invalid MCP access level' using errcode = '22023';
  end if;

  update private.mcp_authorizations
  set access_level = p_access_level, updated_at = now()
  where user_id = auth.uid()
    and client_id = p_client_id
    and revoked_at is null;

  if not found then
    raise exception 'MCP authorization not found' using errcode = 'P0002';
  end if;
end;
$$;

create or replace function public.revoke_mcp_authorization(p_client_id uuid)
returns void
language plpgsql
security definer
set search_path = 'private', 'pg_temp'
as $$
begin
  if auth.uid() is null or private.mcp_client_id() is not null then
    raise exception 'Only a direct authenticated user can revoke MCP access'
      using errcode = '42501';
  end if;

  update private.mcp_authorizations
  set revoked_at = now(), updated_at = now()
  where user_id = auth.uid()
    and client_id = p_client_id
    and revoked_at is null;
end;
$$;

create or replace function public.mcp_list_plans(p_limit integer default 50)
returns table (
  id uuid,
  name text,
  start_date date,
  end_date date,
  status text,
  currency text,
  total numeric,
  permission_level text
)
language plpgsql
security definer
set search_path = 'public', 'private', 'pg_temp'
as $$
declare
  actor_id uuid := auth.uid();
begin
  perform private.require_mcp_access('read');

  return query
  select p.id, p.name, p.start_date, p.end_date, p.status, p.currency, p.total,
    case when p.owner_id = actor_id then 'owner' else ps.permission_level end
  from public.plans p
  left join public.plan_shares ps
    on ps.plan_id = p.id and ps.shared_with_user_id = actor_id
  where p.owner_id = actor_id or ps.shared_with_user_id = actor_id
  order by p.updated_at desc nulls last, p.id desc
  limit greatest(1, least(coalesce(p_limit, 50), 100));
end;
$$;

create or replace function public.mcp_get_plan_overview(p_plan_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = 'public', 'private', 'pg_temp'
as $$
declare
  actor_id uuid := auth.uid();
  plan_row public.plans%rowtype;
  access_level text;
  items jsonb;
begin
  perform private.require_mcp_access('read');

  select p.*
  into plan_row
  from public.plans p
  left join public.plan_shares ps
    on ps.plan_id = p.id and ps.shared_with_user_id = actor_id
  where p.id = p_plan_id
    and (p.owner_id = actor_id or ps.shared_with_user_id = actor_id);

  if not found then
    raise exception 'Plan not found' using errcode = 'P0002';
  end if;

  select case
    when plan_row.owner_id = actor_id then 'owner'
    else ps.permission_level
  end
  into access_level
  from public.plan_shares ps
  where ps.plan_id = p_plan_id
    and ps.shared_with_user_id = actor_id;

  access_level := coalesce(access_level, 'owner');

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', pi.id,
    'name', pi.name,
    'category_id', pi.category_id,
    'category_name', c.name,
    'planned_amount', pi.amount,
    'spent_amount', coalesce(expenses.spent_amount, 0),
    'remaining_amount', pi.amount - coalesce(expenses.spent_amount, 0),
    'is_completed', pi.is_completed
  ) order by pi.created_at, pi.id), '[]'::jsonb)
  into items
  from public.plan_items pi
  join public.categories c on c.id = pi.category_id
  left join lateral (
    select coalesce(sum(e.amount), 0) as spent_amount
    from public.expenses e
    where e.plan_item_id = pi.id
  ) expenses on true
  where pi.plan_id = p_plan_id;

  return jsonb_build_object(
    'id', plan_row.id,
    'name', plan_row.name,
    'start_date', plan_row.start_date,
    'end_date', plan_row.end_date,
    'status', plan_row.status,
    'currency', plan_row.currency,
    'total', plan_row.total,
    'permission_level', access_level,
    'items', items
  );
end;
$$;

create or replace function public.mcp_list_expenses(
  p_plan_id uuid default null,
  p_limit integer default 50,
  p_before_created_at timestamptz default null,
  p_before_id uuid default null
)
returns table (
  id uuid,
  name text,
  amount numeric,
  expense_date date,
  currency text,
  plan_id uuid,
  plan_name text,
  category_id uuid,
  category_name text,
  plan_item_id uuid,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = 'public', 'private', 'pg_temp'
as $$
declare
  actor_id uuid := auth.uid();
begin
  perform private.require_mcp_access('read');

  return query
  select e.id, e.name, e.amount, e.expense_date, e.currency,
    p.id, p.name, c.id, c.name, e.plan_item_id, e.created_at
  from public.expenses e
  join public.plans p on p.id = e.plan_id
  join public.categories c on c.id = e.category_id
  left join public.plan_shares ps
    on ps.plan_id = p.id and ps.shared_with_user_id = actor_id
  where (p.owner_id = actor_id or ps.shared_with_user_id = actor_id)
    and (p_plan_id is null or e.plan_id = p_plan_id)
    and (
      p_before_created_at is null
      or (e.created_at, e.id) < (p_before_created_at, coalesce(p_before_id, 'ffffffff-ffff-ffff-ffff-ffffffffffff'::uuid))
    )
  order by e.created_at desc, e.id desc
  limit greatest(1, least(coalesce(p_limit, 50), 100));
end;
$$;

create or replace function public.mcp_list_categories()
returns table (id uuid, name text, color text, icon text)
language plpgsql
security definer
set search_path = 'public', 'private', 'pg_temp'
as $$
begin
  perform private.require_mcp_access('read');

  return query
  select c.id, c.name, c.color, c.icon
  from public.categories c
  order by c.name;
end;
$$;

create or replace function public.mcp_record_expense(
  p_expense jsonb,
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path = 'public', 'private', 'pg_temp'
as $$
declare
  actor_id uuid := auth.uid();
  oauth_client_id uuid := private.mcp_client_id();
  payload_hash text;
  existing_hash text;
  existing_result jsonb;
  transaction_result jsonb;
  response jsonb;
begin
  perform private.require_mcp_access('write');

  if jsonb_typeof(coalesce(p_expense, '{}'::jsonb)) <> 'object'
    or nullif(trim(p_expense ->> 'name'), '') is null
    or char_length(trim(p_expense ->> 'name')) > 100
    or nullif(p_expense ->> 'plan_id', '') is null
    or nullif(p_expense ->> 'category_id', '') is null
    or coalesce((p_expense ->> 'amount')::numeric, 0) <= 0 then
    raise exception 'Invalid expense payload' using errcode = '22023';
  end if;

  payload_hash := encode(digest(p_expense::text, 'sha256'), 'hex');
  perform pg_advisory_xact_lock(hashtextextended(
    actor_id::text || ':' || oauth_client_id::text || ':' || p_idempotency_key::text,
    0
  ));

  select request_hash, result
  into existing_hash, existing_result
  from private.mcp_idempotency_keys
  where user_id = actor_id
    and client_id = oauth_client_id
    and tool_name = 'record_expense'
    and idempotency_key = p_idempotency_key;

  if found then
    if existing_hash <> payload_hash then
      raise exception 'Idempotency key was already used with a different request'
        using errcode = '22023';
    end if;
    return existing_result;
  end if;

  transaction_result := public.create_expense_transaction(p_expense, false);
  response := jsonb_build_object(
    'id', transaction_result -> 'expense' ->> 'id',
    'name', transaction_result -> 'expense' ->> 'name',
    'amount', transaction_result -> 'expense' -> 'amount',
    'currency', transaction_result -> 'expense' ->> 'currency',
    'expense_date', transaction_result -> 'expense' ->> 'expense_date',
    'plan_id', transaction_result -> 'expense' ->> 'plan_id',
    'category_id', transaction_result -> 'expense' ->> 'category_id'
  );

  insert into private.mcp_idempotency_keys (
    user_id, client_id, tool_name, idempotency_key, request_hash, result
  ) values (
    actor_id, oauth_client_id, 'record_expense', p_idempotency_key, payload_hash, response
  );

  return response;
end;
$$;

revoke all on function public.authorize_mcp_client(uuid) from public;
revoke all on function public.list_mcp_authorizations() from public;
revoke all on function public.set_mcp_authorization_access(uuid, text) from public;
revoke all on function public.revoke_mcp_authorization(uuid) from public;
revoke all on function public.mcp_list_plans(integer) from public;
revoke all on function public.mcp_get_plan_overview(uuid) from public;
revoke all on function public.mcp_list_expenses(uuid, integer, timestamptz, uuid) from public;
revoke all on function public.mcp_list_categories() from public;
revoke all on function public.mcp_record_expense(jsonb, uuid) from public;

grant execute on function public.authorize_mcp_client(uuid) to authenticated;
grant execute on function public.list_mcp_authorizations() to authenticated;
grant execute on function public.set_mcp_authorization_access(uuid, text) to authenticated;
grant execute on function public.revoke_mcp_authorization(uuid) to authenticated;
grant execute on function public.mcp_list_plans(integer) to mcp_user;
grant execute on function public.mcp_get_plan_overview(uuid) to mcp_user;
grant execute on function public.mcp_list_expenses(uuid, integer, timestamptz, uuid) to mcp_user;
grant execute on function public.mcp_list_categories() to mcp_user;
grant execute on function public.mcp_record_expense(jsonb, uuid) to mcp_user;
