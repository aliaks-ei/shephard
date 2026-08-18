-- `expenses.name` is varchar while this RPC declares `name text`.
-- PL/pgSQL RETURN QUERY requires an exact result type, so cast it explicitly.
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
  select e.id, e.name::text, e.amount, e.expense_date, e.currency,
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
      or (e.created_at, e.id) < (
        p_before_created_at,
        coalesce(p_before_id, 'ffffffff-ffff-ffff-ffff-ffffffffffff'::uuid)
      )
    )
  order by e.created_at desc, e.id desc
  limit greatest(1, least(coalesce(p_limit, 50), 100));
end;
$$;
