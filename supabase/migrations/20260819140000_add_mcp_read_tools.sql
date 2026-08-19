-- Widen the MCP read surface to match what the Shephard web app can show.
-- Every function below is read-only and gated by private.require_mcp_access('read').

create or replace function public.mcp_list_templates(p_limit integer default 50)
returns table (
  id uuid,
  name text,
  duration text,
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
  select t.id, t.name, t.duration, t.currency, t.total,
    case when t.owner_id = actor_id then 'owner' else ts.permission_level end
  from public.templates t
  left join public.template_shares ts
    on ts.template_id = t.id and ts.shared_with_user_id = actor_id
  where t.owner_id = actor_id or ts.shared_with_user_id = actor_id
  order by t.updated_at desc nulls last, t.id desc
  limit greatest(1, least(coalesce(p_limit, 50), 100));
end;
$$;

create or replace function public.mcp_get_template(p_template_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = 'public', 'private', 'pg_temp'
as $$
declare
  actor_id uuid := auth.uid();
  template_row public.templates%rowtype;
  access_level text;
  items jsonb;
begin
  perform private.require_mcp_access('read');

  select t.*
  into template_row
  from public.templates t
  left join public.template_shares ts
    on ts.template_id = t.id and ts.shared_with_user_id = actor_id
  where t.id = p_template_id
    and (t.owner_id = actor_id or ts.shared_with_user_id = actor_id);

  if not found then
    raise exception 'Template not found' using errcode = 'P0002';
  end if;

  select case
    when template_row.owner_id = actor_id then 'owner'
    else ts.permission_level
  end
  into access_level
  from public.template_shares ts
  where ts.template_id = p_template_id
    and ts.shared_with_user_id = actor_id;

  access_level := coalesce(access_level, 'owner');

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', ti.id,
    'name', ti.name,
    'category_id', ti.category_id,
    'category_name', c.name,
    'amount', ti.amount,
    'is_fixed_payment', ti.is_fixed_payment
  ) order by ti.created_at, ti.id), '[]'::jsonb)
  into items
  from public.template_items ti
  join public.categories c on c.id = ti.category_id
  where ti.template_id = p_template_id;

  return jsonb_build_object(
    'id', template_row.id,
    'name', template_row.name,
    'duration', template_row.duration,
    'currency', template_row.currency,
    'total', template_row.total,
    'permission_level', access_level,
    'items', items
  );
end;
$$;

create or replace function public.mcp_get_plan_summary(p_plan_id uuid)
returns table (
  category_id uuid,
  category_name text,
  category_color text,
  category_icon text,
  planned_amount numeric,
  actual_amount numeric,
  remaining_amount numeric,
  expense_count bigint
)
language plpgsql
security definer
set search_path = 'public', 'private', 'pg_temp'
as $$
declare
  actor_id uuid := auth.uid();
begin
  perform private.require_mcp_access('read');

  if not exists (
    select 1
    from public.plans p
    left join public.plan_shares ps
      on ps.plan_id = p.id and ps.shared_with_user_id = actor_id
    where p.id = p_plan_id
      and (p.owner_id = actor_id or ps.shared_with_user_id = actor_id)
  ) then
    raise exception 'Plan not found' using errcode = 'P0002';
  end if;

  return query
  select c.id, c.name, c.color, c.icon,
    coalesce(planned.planned_amount, 0),
    coalesce(spent.actual_amount, 0),
    coalesce(planned.planned_amount, 0) - coalesce(spent.actual_amount, 0),
    coalesce(spent.expense_count, 0)
  from public.categories c
  left join lateral (
    select sum(pi.amount) as planned_amount
    from public.plan_items pi
    where pi.plan_id = p_plan_id and pi.category_id = c.id
  ) planned on true
  left join lateral (
    select sum(e.amount) as actual_amount, count(*) as expense_count
    from public.expenses e
    where e.plan_id = p_plan_id and e.category_id = c.id
  ) spent on true
  where planned.planned_amount is not null or spent.actual_amount is not null
  order by c.name;
end;
$$;

create or replace function public.mcp_list_expenses_by_date_range(
  p_start_date date,
  p_end_date date,
  p_plan_id uuid default null,
  p_limit integer default 50
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

  if p_start_date is null or p_end_date is null or p_start_date > p_end_date then
    raise exception 'Invalid date range' using errcode = '22023';
  end if;

  return query
  -- expenses.name is varchar while this RPC declares `name text`, and
  -- RETURN QUERY requires an exact result type. Cast it explicitly.
  select e.id, e.name::text, e.amount, e.expense_date, e.currency,
    p.id, p.name, c.id, c.name, e.plan_item_id, e.created_at
  from public.expenses e
  join public.plans p on p.id = e.plan_id
  join public.categories c on c.id = e.category_id
  left join public.plan_shares ps
    on ps.plan_id = p.id and ps.shared_with_user_id = actor_id
  where (p.owner_id = actor_id or ps.shared_with_user_id = actor_id)
    and e.expense_date between p_start_date and p_end_date
    and (p_plan_id is null or e.plan_id = p_plan_id)
  order by e.expense_date desc, e.created_at desc, e.id desc
  limit greatest(1, least(coalesce(p_limit, 50), 100));
end;
$$;

create or replace function public.mcp_list_notifications(p_limit integer default 50)
returns table (
  id uuid,
  type text,
  title text,
  body text,
  entity_type text,
  entity_id uuid,
  read_at timestamptz,
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
  select n.id, n.type, n.title, n.body, n.entity_type, n.entity_id, n.read_at, n.created_at
  from public.notifications n
  where n.user_id = actor_id
    and n.deleted_at is null
  order by n.created_at desc, n.id desc
  limit greatest(1, least(coalesce(p_limit, 50), 100));
end;
$$;

-- Only the two preferences an assistant needs to present amounts correctly.
-- Push notification settings and privacy mode are deliberately not exposed.
create or replace function public.mcp_get_user_preferences()
returns jsonb
language plpgsql
security definer
set search_path = 'public', 'private', 'pg_temp'
as $$
declare
  actor_id uuid := auth.uid();
  stored jsonb;
begin
  perform private.require_mcp_access('read');

  select coalesce(u.preferences, '{}'::jsonb)
  into stored
  from public.users u
  where u.id = actor_id;

  return jsonb_build_object(
    'currency', coalesce(stored ->> 'currency', 'EUR'),
    'theme', coalesce(stored ->> 'theme', 'light')
  );
end;
$$;

-- Collaborator names and permissions only. The email address is deliberately
-- left out so that an MCP token cannot read other users' contact details.
create or replace function public.mcp_list_plan_shares(p_plan_id uuid)
returns table (
  user_id uuid,
  user_name text,
  permission_level text,
  shared_at timestamptz
)
language plpgsql
security definer
set search_path = 'public', 'private', 'pg_temp'
as $$
declare
  actor_id uuid := auth.uid();
begin
  perform private.require_mcp_access('read');

  if not exists (
    select 1
    from public.plans p
    left join public.plan_shares ps
      on ps.plan_id = p.id and ps.shared_with_user_id = actor_id
    where p.id = p_plan_id
      and (p.owner_id = actor_id or ps.shared_with_user_id = actor_id)
  ) then
    raise exception 'Plan not found' using errcode = 'P0002';
  end if;

  return query
  select u.id, u.name, ps.permission_level, ps.created_at
  from public.plan_shares ps
  join public.users u on u.id = ps.shared_with_user_id
  where ps.plan_id = p_plan_id
  order by u.name;
end;
$$;

revoke all on function public.mcp_list_templates(integer) from public;
revoke all on function public.mcp_get_template(uuid) from public;
revoke all on function public.mcp_get_plan_summary(uuid) from public;
revoke all on function public.mcp_list_expenses_by_date_range(date, date, uuid, integer) from public;
revoke all on function public.mcp_list_notifications(integer) from public;
revoke all on function public.mcp_get_user_preferences() from public;
revoke all on function public.mcp_list_plan_shares(uuid) from public;

grant execute on function public.mcp_list_templates(integer) to mcp_user;
grant execute on function public.mcp_get_template(uuid) to mcp_user;
grant execute on function public.mcp_get_plan_summary(uuid) to mcp_user;
grant execute on function public.mcp_list_expenses_by_date_range(date, date, uuid, integer) to mcp_user;
grant execute on function public.mcp_list_notifications(integer) to mcp_user;
grant execute on function public.mcp_get_user_preferences() to mcp_user;
grant execute on function public.mcp_list_plan_shares(uuid) to mcp_user;

notify pgrst, 'reload schema';
