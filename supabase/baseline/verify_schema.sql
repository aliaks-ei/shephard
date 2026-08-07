do $$
declare
  missing_tables text[];
  tables_without_rls text[];
begin
  select array_agg(expected.name)
  into missing_tables
  from unnest(array[
    'categories',
    'users',
    'templates',
    'template_items',
    'template_shares',
    'plans',
    'plan_items',
    'plan_shares',
    'expenses',
    'notifications',
    'notification_outbox',
    'push_subscriptions'
  ]) expected(name)
  where to_regclass('public.' || expected.name) is null;

  if missing_tables is not null then
    raise exception 'Missing public tables: %', missing_tables;
  end if;

  select array_agg(c.relname order by c.relname)
  into tables_without_rls
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relkind = 'r'
    and c.relname = any(array[
      'categories',
      'users',
      'templates',
      'template_items',
      'template_shares',
      'plans',
      'plan_items',
      'plan_shares',
      'expenses',
      'notifications',
      'notification_outbox',
      'push_subscriptions'
    ])
    and not c.relrowsecurity;

  if tables_without_rls is not null then
    raise exception 'RLS is disabled for: %', tables_without_rls;
  end if;

  if to_regprocedure('public.create_expense_transaction(jsonb,boolean)') is null
    or to_regprocedure('public.create_expenses_transaction(jsonb,boolean)') is null
    or to_regprocedure('public.delete_plan_transaction(uuid)') is null
    or to_regprocedure('public.delete_template_transaction(uuid)') is null then
    raise exception 'Required domain transaction RPCs are missing';
  end if;

  if to_regprocedure('public.get_user_activity_summary(uuid,integer)') is not null
    or to_regprocedure('public.cleanup_audit_logs(integer)') is not null then
    raise exception 'Retired audit-log functions are still present';
  end if;
end;
$$;

select
  (select count(*) from public.categories) as category_count,
  (select count(*) from pg_policies where schemaname = 'public') as policy_count,
  (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname in ('public', 'private') and p.prokind = 'f') as function_count;
