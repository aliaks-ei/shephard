create or replace function public.handle_auth_user_sync()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  resolved_email text;
  resolved_name text;
  resolved_avatar text;
begin
  resolved_email := coalesce(new.email, concat(new.id::text, '@local.invalid'));
  resolved_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
    split_part(resolved_email, '@', 1)
  );
  resolved_avatar := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'avatar_url'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'picture'), '')
  );

  insert into public.users (id, email, name, avatar)
  values (new.id, resolved_email, resolved_name, resolved_avatar)
  on conflict (id) do update
  set email = excluded.email,
      name = excluded.name,
      avatar = excluded.avatar,
      updated_at = timezone('utc', now());

  return new;
end;
$$;

drop trigger if exists on_auth_user_sync on auth.users;
create trigger on_auth_user_sync
after insert or update of email, raw_user_meta_data on auth.users
for each row
execute function public.handle_auth_user_sync();

create or replace function public.calculate_plan_status(
  p_start_date date,
  p_end_date date,
  p_current_status text default null
)
returns text
language sql
stable
as $$
  select case
    when p_current_status = 'cancelled' then 'cancelled'
    when current_date < p_start_date then 'pending'
    when current_date > p_end_date then 'completed'
    else 'active'
  end;
$$;

create or replace function public.can_access_template(
  template_id uuid,
  user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.templates t
    where t.id = template_id
      and t.owner_id = user_id
  ) or exists (
    select 1
    from public.template_shares ts
    where ts.template_id = template_id
      and ts.shared_with_user_id = user_id
  );
$$;

create or replace function public.can_edit_template(
  template_id uuid,
  user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.templates t
    where t.id = template_id
      and t.owner_id = user_id
  ) or exists (
    select 1
    from public.template_shares ts
    where ts.template_id = template_id
      and ts.shared_with_user_id = user_id
      and ts.permission_level = 'edit'
  );
$$;

create or replace function public.is_template_owner(
  template_id uuid,
  user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.templates t
    where t.id = template_id
      and t.owner_id = user_id
  );
$$;

create or replace function public.user_has_template_access(
  template_id uuid,
  user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.can_access_template(template_id, user_id);
$$;

create or replace function public.user_owns_plan(
  plan_id uuid,
  user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.plans p
    where p.id = plan_id
      and p.owner_id = user_id
  );
$$;

create or replace function public.can_access_plan(
  p_plan_id uuid,
  p_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.plans p
    where p.id = p_plan_id
      and p.owner_id = p_user_id
  ) or exists (
    select 1
    from public.plan_shares ps
    where ps.plan_id = p_plan_id
      and ps.shared_with_user_id = p_user_id
  );
$$;

create or replace function public.can_edit_plan(
  p_plan_id uuid,
  p_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.plans p
    where p.id = p_plan_id
      and p.owner_id = p_user_id
  ) or exists (
    select 1
    from public.plan_shares ps
    where ps.plan_id = p_plan_id
      and ps.shared_with_user_id = p_user_id
      and ps.permission_level = 'edit'
  );
$$;

create or replace function public.get_user_accessible_plan_ids(
  user_id uuid default auth.uid()
)
returns table (plan_id uuid)
language sql
stable
security definer
set search_path = public
as $$
  select p.id
  from public.plans p
  where p.owner_id = user_id
  union
  select ps.plan_id
  from public.plan_shares ps
  where ps.shared_with_user_id = user_id;
$$;

create or replace function public.get_user_editable_plan_ids(
  user_id uuid default auth.uid()
)
returns table (plan_id uuid)
language sql
stable
security definer
set search_path = public
as $$
  select p.id
  from public.plans p
  where p.owner_id = user_id
  union
  select ps.plan_id
  from public.plan_shares ps
  where ps.shared_with_user_id = user_id
    and ps.permission_level = 'edit';
$$;

create or replace function public.get_template_shared_users(
  p_template_id uuid
)
returns table (
  user_id uuid,
  user_name text,
  user_email text,
  permission_level text,
  shared_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    ts.shared_with_user_id as user_id,
    u.name as user_name,
    u.email as user_email,
    ts.permission_level,
    ts.created_at as shared_at
  from public.template_shares ts
  join public.users u on u.id = ts.shared_with_user_id
  where ts.template_id = p_template_id
  order by ts.created_at asc, lower(u.email) asc;
$$;

create or replace function public.get_plan_shared_users(
  p_plan_id uuid
)
returns table (
  user_id uuid,
  user_name text,
  user_email text,
  permission_level text,
  shared_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    ps.shared_with_user_id as user_id,
    u.name as user_name,
    u.email as user_email,
    ps.permission_level,
    ps.created_at as shared_at
  from public.plan_shares ps
  join public.users u on u.id = ps.shared_with_user_id
  where ps.plan_id = p_plan_id
  order by ps.created_at asc, lower(u.email) asc;
$$;

create or replace function public.search_users_for_sharing(
  q text default '',
  entity_id uuid default null,
  entity_type text default null
)
returns table (
  id uuid,
  email text,
  name text
)
language sql
stable
security definer
set search_path = public
as $$
  with current_user as (
    select auth.uid() as user_id
  ),
  normalized as (
    select lower(trim(coalesce(q, ''))) as query
  ),
  excluded_users as (
    select t.owner_id as user_id
    from public.templates t
    where entity_type = 'template'
      and entity_id is not null
      and t.id = entity_id
    union
    select ts.shared_with_user_id
    from public.template_shares ts
    where entity_type = 'template'
      and entity_id is not null
      and ts.template_id = entity_id
    union
    select p.owner_id
    from public.plans p
    where entity_type = 'plan'
      and entity_id is not null
      and p.id = entity_id
    union
    select ps.shared_with_user_id
    from public.plan_shares ps
    where entity_type = 'plan'
      and entity_id is not null
      and ps.plan_id = entity_id
    union
    select user_id
    from current_user
  )
  select
    u.id,
    u.email,
    u.name
  from public.users u
  cross join normalized n
  where n.query <> ''
    and u.id not in (select eu.user_id from excluded_users eu)
    and (
      lower(u.email) like '%' || n.query || '%'
      or lower(u.name) like '%' || n.query || '%'
    )
  order by
    case when lower(u.email) = n.query then 0 else 1 end,
    case when lower(u.name) = n.query then 0 else 1 end,
    lower(u.email) asc
  limit 10;
$$;

create or replace function public.get_plan_expense_summary(
  p_plan_id uuid
)
returns table (
  category_id uuid,
  planned_amount numeric,
  actual_amount numeric,
  remaining_amount numeric,
  expense_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with planned as (
    select
      pi.category_id,
      sum(pi.amount)::numeric as planned_amount
    from public.plan_items pi
    where pi.plan_id = p_plan_id
    group by pi.category_id
  ),
  spent as (
    select
      e.category_id,
      sum(e.amount)::numeric as actual_amount,
      count(*)::bigint as expense_count
    from public.expenses e
    where e.plan_id = p_plan_id
    group by e.category_id
  )
  select
    planned.category_id,
    planned.planned_amount,
    coalesce(spent.actual_amount, 0)::numeric as actual_amount,
    (planned.planned_amount - coalesce(spent.actual_amount, 0))::numeric as remaining_amount,
    coalesce(spent.expense_count, 0)::bigint as expense_count
  from planned
  left join spent on spent.category_id = planned.category_id
  order by planned.category_id;
$$;

create or replace function public.get_plan_items_with_tracking(
  p_plan_id uuid
)
returns table (
  id uuid,
  plan_id uuid,
  category_id uuid,
  name text,
  amount numeric,
  is_completed boolean,
  created_at timestamptz,
  updated_at timestamptz,
  expense_count bigint,
  spent_amount numeric,
  remaining_amount numeric
)
language sql
stable
security definer
set search_path = public
as $$
  select
    pi.id,
    pi.plan_id,
    pi.category_id,
    pi.name,
    pi.amount,
    pi.is_completed,
    pi.created_at,
    coalesce(pi.updated_at, pi.created_at) as updated_at,
    count(e.id)::bigint as expense_count,
    coalesce(sum(e.amount), 0)::numeric as spent_amount,
    (pi.amount - coalesce(sum(e.amount), 0))::numeric as remaining_amount
  from public.plan_items pi
  left join public.expenses e on e.plan_item_id = pi.id
  where pi.plan_id = p_plan_id
  group by pi.id
  order by pi.created_at asc;
$$;

create or replace function public.get_plan_items_with_tracking_by_category(
  p_category_id uuid,
  p_plan_id uuid
)
returns table (
  id uuid,
  plan_id uuid,
  category_id uuid,
  name text,
  amount numeric,
  is_completed boolean,
  created_at timestamptz,
  updated_at timestamptz,
  expense_count bigint,
  spent_amount numeric,
  remaining_amount numeric
)
language sql
stable
security definer
set search_path = public
as $$
  select *
  from public.get_plan_items_with_tracking(p_plan_id)
  where category_id = p_category_id
  order by created_at asc;
$$;

create or replace function public.check_excessive_sharing(
  user_id uuid default auth.uid(),
  max_shares integer default 25,
  hours_window integer default 24
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  with recent_shares as (
    select count(*)::integer as share_count
    from (
      select created_at
      from public.plan_shares
      where shared_by_user_id = user_id
        and created_at >= timezone('utc', now()) - make_interval(hours => hours_window)
      union all
      select created_at
      from public.template_shares
      where shared_by_user_id = user_id
        and created_at >= timezone('utc', now()) - make_interval(hours => hours_window)
    ) shares
  )
  select coalesce((select share_count from recent_shares), 0) > max_shares;
$$;

create or replace function public.cleanup_audit_logs(
  days_to_keep integer default 90
)
returns integer
language sql
as $$
  select 0;
$$;

create or replace function public.get_user_activity_summary(
  user_id uuid default auth.uid(),
  days_back integer default 30
)
returns table (
  table_name text,
  operation text,
  last_activity timestamptz,
  count bigint
)
language sql
stable
as $$
  select
    null::text as table_name,
    null::text as operation,
    null::timestamptz as last_activity,
    null::bigint as count
  where false;
$$;
