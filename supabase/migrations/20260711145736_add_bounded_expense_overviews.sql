create index if not exists expenses_plan_recent_idx
  on public.expenses (plan_id, expense_date desc, created_at desc, id desc);

create index if not exists expenses_plan_category_recent_idx
  on public.expenses (plan_id, category_id, expense_date desc, created_at desc, id desc);

create index if not exists expenses_user_recent_idx
  on public.expenses (user_id, expense_date desc, created_at desc, id desc);

create index if not exists expenses_user_category_recent_idx
  on public.expenses (user_id, category_id, expense_date desc, created_at desc, id desc);

create index if not exists expenses_user_amount_idx
  on public.expenses (user_id, amount, expense_date desc, created_at desc, id desc);

create index if not exists expenses_plan_item_idx
  on public.expenses (plan_id, plan_item_id)
  where plan_item_id is not null;

create or replace function public.get_plan_overview_snapshots(p_plan_ids uuid[])
returns table (
  plan_id uuid,
  category_id uuid,
  category_name text,
  category_color text,
  category_icon text,
  planned_amount numeric,
  actual_amount numeric,
  remaining_amount numeric,
  expense_count bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  with requested_plans as (
    select p.id
    from public.plans p
    where p.id = any(coalesce(p_plan_ids, array[]::uuid[]))
  ),
  item_totals as (
    select
      pi.plan_id,
      pi.category_id,
      sum(pi.amount)::numeric as planned_amount,
      sum(pi.amount) filter (
        where pi.is_fixed_payment and not pi.is_completed
      )::numeric as uncompleted_fixed_amount,
      sum(pi.amount) filter (
        where not pi.is_fixed_payment
      )::numeric as non_fixed_planned_amount
    from public.plan_items pi
    join requested_plans rp on rp.id = pi.plan_id
    group by pi.plan_id, pi.category_id
  ),
  expense_totals as (
    select
      e.plan_id,
      e.category_id,
      sum(e.amount)::numeric as actual_amount,
      sum(e.amount) filter (
        where e.plan_item_id is null or linked_item.is_fixed_payment = false
      )::numeric as non_fixed_expense_amount,
      count(*)::bigint as expense_count
    from public.expenses e
    join requested_plans rp on rp.id = e.plan_id
    left join public.plan_items linked_item
      on linked_item.id = e.plan_item_id
      and linked_item.plan_id = e.plan_id
    group by e.plan_id, e.category_id
  ),
  plan_categories as (
    select it.plan_id, it.category_id from item_totals it
    union
    select et.plan_id, et.category_id from expense_totals et
  )
  select
    pc.plan_id,
    pc.category_id,
    c.name as category_name,
    c.color as category_color,
    c.icon as category_icon,
    coalesce(it.planned_amount, 0)::numeric as planned_amount,
    coalesce(et.actual_amount, 0)::numeric as actual_amount,
    (
      coalesce(it.uncompleted_fixed_amount, 0)
      + greatest(
        0,
        coalesce(it.non_fixed_planned_amount, 0)
          - coalesce(et.non_fixed_expense_amount, 0)
      )
    )::numeric as remaining_amount,
    coalesce(et.expense_count, 0)::bigint as expense_count
  from plan_categories pc
  join public.categories c on c.id = pc.category_id
  left join item_totals it
    on it.plan_id = pc.plan_id
    and it.category_id = pc.category_id
  left join expense_totals et
    on et.plan_id = pc.plan_id
    and et.category_id = pc.category_id
  order by pc.plan_id, pc.category_id;
$$;

-- The existing RPC returns expense_count as integer. PostgreSQL cannot change
-- the OUT row type with CREATE OR REPLACE, so recreate it with bigint.
drop function if exists public.get_plan_expense_summary(uuid);

create or replace function public.get_plan_expense_summary(p_plan_id uuid)
returns table (
  category_id uuid,
  planned_amount numeric,
  actual_amount numeric,
  remaining_amount numeric,
  expense_count bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    snapshot.category_id,
    snapshot.planned_amount,
    snapshot.actual_amount,
    snapshot.remaining_amount,
    snapshot.expense_count
  from public.get_plan_overview_snapshots(array[p_plan_id]) snapshot;
$$;

create or replace function public.get_recent_expenses_page(
  p_user_id uuid,
  p_limit integer default 40,
  p_offset integer default 0,
  p_search text default null,
  p_category_id uuid default null,
  p_sort_by text default 'date-desc'
)
returns table (
  id uuid,
  amount numeric,
  category_id uuid,
  created_at timestamptz,
  currency text,
  expense_date date,
  name text,
  original_amount numeric,
  original_currency text,
  plan_id uuid,
  plan_item_id uuid,
  updated_at timestamptz,
  user_id uuid,
  categories jsonb,
  plans jsonb
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    e.id,
    e.amount,
    e.category_id,
    e.created_at,
    e.currency,
    e.expense_date,
    e.name,
    e.original_amount,
    e.original_currency,
    e.plan_id,
    e.plan_item_id,
    e.updated_at,
    e.user_id,
    to_jsonb(c) as categories,
    jsonb_build_object(
      'id', p.id,
      'name', p.name,
      'currency', p.currency
    ) as plans
  from public.expenses e
  join public.categories c on c.id = e.category_id
  join public.plans p on p.id = e.plan_id
  where e.user_id = p_user_id
    and p_user_id = auth.uid()
    and (p_category_id is null or e.category_id = p_category_id)
    and (
      nullif(trim(p_search), '') is null
      or strpos(lower(e.name), lower(trim(p_search))) > 0
      or strpos(lower(c.name), lower(trim(p_search))) > 0
      or strpos(lower(p.name), lower(trim(p_search))) > 0
    )
    and coalesce(p_sort_by, 'date-desc') in (
      'date-desc',
      'date-asc',
      'amount-desc',
      'amount-asc'
    )
  order by
    case when coalesce(p_sort_by, 'date-desc') = 'date-desc' then e.expense_date end desc,
    case when coalesce(p_sort_by, 'date-desc') = 'date-desc' then e.created_at end desc,
    case when coalesce(p_sort_by, 'date-desc') = 'date-desc' then e.id end desc,
    case when p_sort_by = 'date-asc' then e.expense_date end asc,
    case when p_sort_by = 'date-asc' then e.created_at end asc,
    case when p_sort_by = 'date-asc' then e.id end asc,
    case when p_sort_by = 'amount-desc' then e.amount end desc,
    case when p_sort_by = 'amount-desc' then e.expense_date end desc,
    case when p_sort_by = 'amount-desc' then e.created_at end desc,
    case when p_sort_by = 'amount-desc' then e.id end desc,
    case when p_sort_by = 'amount-asc' then e.amount end asc,
    case when p_sort_by = 'amount-asc' then e.expense_date end desc,
    case when p_sort_by = 'amount-asc' then e.created_at end desc,
    case when p_sort_by = 'amount-asc' then e.id end desc
  limit greatest(1, least(coalesce(p_limit, 40), 100))
  offset greatest(0, coalesce(p_offset, 0));
$$;

revoke all on function public.get_plan_overview_snapshots(uuid[]) from public;
revoke all on function public.get_plan_expense_summary(uuid) from public;
revoke all on function public.get_recent_expenses_page(
  uuid,
  integer,
  integer,
  text,
  uuid,
  text
) from public;

grant execute on function public.get_plan_overview_snapshots(uuid[]) to authenticated;
grant execute on function public.get_plan_expense_summary(uuid) to authenticated;
grant execute on function public.get_recent_expenses_page(
  uuid,
  integer,
  integer,
  text,
  uuid,
  text
) to authenticated;
