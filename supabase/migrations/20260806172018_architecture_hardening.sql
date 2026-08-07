set lock_timeout = '10s';
set statement_timeout = '120s';

-- Remove the remaining functions from the retired audit-log subsystem.
drop function if exists public.cleanup_audit_logs(integer);
drop function if exists public.get_user_activity_summary(uuid, integer);

-- Historical rows predate the expense currency column. The plan currency is
-- the correct persisted currency for those rows.
update public.expenses e
set currency = p.currency
from public.plans p
where p.id = e.plan_id
  and e.currency is null;

alter table public.plans
  alter column currency set not null,
  alter column total set default 0,
  alter column total set not null;

alter table public.templates
  alter column currency set not null,
  alter column total set default 0,
  alter column total set not null;

alter table public.expenses
  alter column currency set not null;

alter table public.plans
  drop constraint if exists plans_date_order_check,
  add constraint plans_date_order_check check (end_date >= start_date) not valid;

alter table public.expenses
  drop constraint if exists expenses_name_check,
  add constraint expenses_name_check
    check (length(trim(name)) > 0 and length(name) <= 120) not valid,
  drop constraint if exists expenses_amount_upper_bound_check,
  add constraint expenses_amount_upper_bound_check
    check (amount < 1000000) not valid,
  drop constraint if exists expenses_original_money_pair_check,
  add constraint expenses_original_money_pair_check
    check ((original_amount is null) = (original_currency is null)) not valid;

alter table public.expenses
  drop constraint if exists expenses_user_id_fkey,
  add constraint expenses_user_id_fkey
    foreign key (user_id) references public.users(id) on delete cascade not valid;

-- This composite reference guarantees that an expense's optional plan item
-- belongs to the same plan and category as the expense.
alter table public.plan_items
  drop constraint if exists plan_items_expense_reference_key,
  add constraint plan_items_expense_reference_key unique (id, plan_id, category_id);

alter table public.expenses
  drop constraint if exists expenses_plan_item_context_fkey,
  add constraint expenses_plan_item_context_fkey
    foreign key (plan_item_id, plan_id, category_id)
    references public.plan_items(id, plan_id, category_id)
    on delete set null (plan_item_id)
    not valid;

alter table public.plans validate constraint plans_date_order_check;
alter table public.expenses validate constraint expenses_name_check;
alter table public.expenses validate constraint expenses_amount_upper_bound_check;
alter table public.expenses validate constraint expenses_original_money_pair_check;
alter table public.expenses validate constraint expenses_user_id_fkey;
alter table public.expenses validate constraint expenses_plan_item_context_fkey;

-- Remove the duplicate unique constraint while retaining the original one.
alter table public.plan_shares
  drop constraint if exists unique_plan_share_per_user;

create index if not exists expenses_user_id_idx
  on public.expenses(user_id);
create index if not exists notifications_actor_user_id_idx
  on public.notifications(actor_user_id);

-- Aggregate totals are maintained by the database for every write path.
create or replace function public.sync_plan_total()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  affected_plan_id uuid := coalesce(new.plan_id, old.plan_id);
begin
  update public.plans p
  set total = coalesce((
        select sum(pi.amount)
        from public.plan_items pi
        where pi.plan_id = affected_plan_id
      ), 0),
      updated_at = now()
  where p.id = affected_plan_id;
  return coalesce(new, old);
end;
$$;

drop trigger if exists sync_plan_total_after_item_write on public.plan_items;
create trigger sync_plan_total_after_item_write
after insert or update of amount, plan_id or delete on public.plan_items
for each row execute function public.sync_plan_total();

create or replace function public.sync_template_total()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  affected_template_id uuid := coalesce(new.template_id, old.template_id);
begin
  update public.templates t
  set total = coalesce((
        select sum(ti.amount)
        from public.template_items ti
        where ti.template_id = affected_template_id
      ), 0),
      updated_at = now()
  where t.id = affected_template_id;
  return coalesce(new, old);
end;
$$;

drop trigger if exists sync_template_total_after_item_write on public.template_items;
create trigger sync_template_total_after_item_write
after insert or update of amount, template_id or delete on public.template_items
for each row execute function public.sync_template_total();

-- Authorization helpers used by RLS live outside the exposed public schema.
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated, service_role;

create or replace function private.is_plan_owner(target_plan_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1 from public.plans p
      where p.id = target_plan_id
        and p.owner_id = (select auth.uid())
    );
$$;

create or replace function private.can_access_plan(target_plan_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and (
      exists (
        select 1 from public.plans p
        where p.id = target_plan_id
          and p.owner_id = (select auth.uid())
      )
      or exists (
        select 1 from public.plan_shares ps
        where ps.plan_id = target_plan_id
          and ps.shared_with_user_id = (select auth.uid())
      )
    );
$$;

create or replace function private.can_edit_plan(target_plan_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and (
      exists (
        select 1 from public.plans p
        where p.id = target_plan_id
          and p.owner_id = (select auth.uid())
      )
      or exists (
        select 1 from public.plan_shares ps
        where ps.plan_id = target_plan_id
          and ps.shared_with_user_id = (select auth.uid())
          and ps.permission_level = 'edit'
      )
    );
$$;

create or replace function private.is_template_owner(target_template_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1 from public.templates t
      where t.id = target_template_id
        and t.owner_id = (select auth.uid())
    );
$$;

create or replace function private.can_access_template(target_template_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and (
      exists (
        select 1 from public.templates t
        where t.id = target_template_id
          and t.owner_id = (select auth.uid())
      )
      or exists (
        select 1 from public.template_shares ts
        where ts.template_id = target_template_id
          and ts.shared_with_user_id = (select auth.uid())
      )
    );
$$;

create or replace function private.can_edit_template(target_template_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and (
      exists (
        select 1 from public.templates t
        where t.id = target_template_id
          and t.owner_id = (select auth.uid())
      )
      or exists (
        select 1 from public.template_shares ts
        where ts.template_id = target_template_id
          and ts.shared_with_user_id = (select auth.uid())
          and ts.permission_level = 'edit'
      )
    );
$$;

revoke all on all functions in schema private from public, anon;
grant execute on all functions in schema private to authenticated, service_role;

-- Replace the accumulated policy stack with one explicit policy per operation.
do $$
declare
  policy_row record;
begin
  for policy_row in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = any(array[
        'categories', 'users', 'templates', 'template_items', 'template_shares',
        'plans', 'plan_items', 'plan_shares', 'expenses', 'notifications',
        'push_subscriptions'
      ])
  loop
    execute format('drop policy %I on %I.%I',
      policy_row.policyname, policy_row.schemaname, policy_row.tablename);
  end loop;
end;
$$;

create policy categories_select_authenticated
on public.categories for select to authenticated
using (true);

create policy users_select_own
on public.users for select to authenticated
using ((select auth.uid()) = id);
create policy users_insert_own
on public.users for insert to authenticated
with check ((select auth.uid()) = id);
create policy users_update_own
on public.users for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy templates_select_accessible
on public.templates for select to authenticated
using (private.can_access_template(id));
create policy templates_insert_owned
on public.templates for insert to authenticated
with check ((select auth.uid()) = owner_id);
create policy templates_update_editable
on public.templates for update to authenticated
using (private.can_edit_template(id))
with check (private.can_edit_template(id));
create policy templates_delete_owned
on public.templates for delete to authenticated
using (private.is_template_owner(id));

create policy template_items_select_accessible
on public.template_items for select to authenticated
using (private.can_access_template(template_id));
create policy template_items_insert_editable
on public.template_items for insert to authenticated
with check (private.can_edit_template(template_id));
create policy template_items_update_editable
on public.template_items for update to authenticated
using (private.can_edit_template(template_id))
with check (private.can_edit_template(template_id));
create policy template_items_delete_editable
on public.template_items for delete to authenticated
using (private.can_edit_template(template_id));

create policy template_shares_select_involved
on public.template_shares for select to authenticated
using (
  shared_by_user_id = (select auth.uid())
  or shared_with_user_id = (select auth.uid())
);
create policy template_shares_insert_owned
on public.template_shares for insert to authenticated
with check (
  shared_by_user_id = (select auth.uid())
  and private.is_template_owner(template_id)
);
create policy template_shares_update_owned
on public.template_shares for update to authenticated
using (private.is_template_owner(template_id))
with check (
  shared_by_user_id = (select auth.uid())
  and private.is_template_owner(template_id)
);
create policy template_shares_delete_owned
on public.template_shares for delete to authenticated
using (private.is_template_owner(template_id));

create policy plans_select_accessible
on public.plans for select to authenticated
using (private.can_access_plan(id));
create policy plans_insert_owned
on public.plans for insert to authenticated
with check ((select auth.uid()) = owner_id);
create policy plans_update_editable
on public.plans for update to authenticated
using (private.can_edit_plan(id))
with check (private.can_edit_plan(id));
create policy plans_delete_owned
on public.plans for delete to authenticated
using (private.is_plan_owner(id));

create policy plan_items_select_accessible
on public.plan_items for select to authenticated
using (private.can_access_plan(plan_id));
create policy plan_items_insert_editable
on public.plan_items for insert to authenticated
with check (private.can_edit_plan(plan_id));
create policy plan_items_update_editable
on public.plan_items for update to authenticated
using (private.can_edit_plan(plan_id))
with check (private.can_edit_plan(plan_id));
create policy plan_items_delete_editable
on public.plan_items for delete to authenticated
using (private.can_edit_plan(plan_id));

create policy plan_shares_select_involved
on public.plan_shares for select to authenticated
using (
  shared_by_user_id = (select auth.uid())
  or shared_with_user_id = (select auth.uid())
);
create policy plan_shares_insert_owned
on public.plan_shares for insert to authenticated
with check (
  shared_by_user_id = (select auth.uid())
  and private.is_plan_owner(plan_id)
);
create policy plan_shares_update_owned
on public.plan_shares for update to authenticated
using (private.is_plan_owner(plan_id))
with check (
  shared_by_user_id = (select auth.uid())
  and private.is_plan_owner(plan_id)
);
create policy plan_shares_delete_owned
on public.plan_shares for delete to authenticated
using (private.is_plan_owner(plan_id));

create policy expenses_select_accessible
on public.expenses for select to authenticated
using (private.can_access_plan(plan_id));
create policy expenses_insert_editable
on public.expenses for insert to authenticated
with check (
  user_id = (select auth.uid())
  and private.can_edit_plan(plan_id)
);
create policy expenses_update_editable
on public.expenses for update to authenticated
using (private.can_edit_plan(plan_id))
with check (
  user_id = (select auth.uid())
  and private.can_edit_plan(plan_id)
);
create policy expenses_delete_editable
on public.expenses for delete to authenticated
using (private.can_edit_plan(plan_id));

create policy notifications_select_own
on public.notifications for select to authenticated
using ((select auth.uid()) = user_id);
create policy notifications_update_own
on public.notifications for update to authenticated
using ((select auth.uid()) = user_id and deleted_at is null)
with check ((select auth.uid()) = user_id);

create policy push_subscriptions_select_own
on public.push_subscriptions for select to authenticated
using ((select auth.uid()) = user_id);
create policy push_subscriptions_insert_own
on public.push_subscriptions for insert to authenticated
with check ((select auth.uid()) = user_id);
create policy push_subscriptions_update_own
on public.push_subscriptions for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy push_subscriptions_delete_own
on public.push_subscriptions for delete to authenticated
using ((select auth.uid()) = user_id);

-- Retire public authorization helpers now that policies call private helpers.
drop function if exists public.can_access_template(uuid, uuid);
drop function if exists public.can_edit_template(uuid, uuid);
drop function if exists public.get_user_accessible_plan_ids(uuid);
drop function if exists public.get_user_editable_plan_ids(uuid);
drop function if exists public.is_template_owner(uuid, uuid);
drop function if exists public.user_has_template_access(uuid, uuid);
drop function if exists public.user_owns_plan(uuid, uuid);
drop function if exists public.search_users_for_sharing(text);

-- SECURITY DEFINER endpoints are never anonymously executable.
do $$
declare
  function_row record;
begin
  for function_row in
    select p.oid::regprocedure as signature
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prosecdef
  loop
    execute format('revoke execute on function %s from public, anon', function_row.signature);
  end loop;
end;
$$;

revoke all on all tables in schema public from anon;
grant select on public.categories to authenticated;
grant select, insert, update on public.users to authenticated;
grant select, insert, update, delete on
  public.templates, public.template_items, public.template_shares,
  public.plans, public.plan_items, public.plan_shares, public.expenses,
  public.push_subscriptions
to authenticated;
grant select, update on public.notifications to authenticated;

-- Keep the entity-scoped user search as the single intended privileged search RPC.
revoke all on function public.search_users_for_sharing(text, uuid, text)
  from public, anon;
grant execute on function public.search_users_for_sharing(text, uuid, text)
  to authenticated, service_role;
