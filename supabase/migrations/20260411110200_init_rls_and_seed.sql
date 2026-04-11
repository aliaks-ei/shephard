alter table public.categories enable row level security;
alter table public.users enable row level security;
alter table public.templates enable row level security;
alter table public.template_items enable row level security;
alter table public.template_shares enable row level security;
alter table public.plans enable row level security;
alter table public.plan_items enable row level security;
alter table public.plan_shares enable row level security;
alter table public.expenses enable row level security;
alter table public.notifications enable row level security;
alter table public.push_subscriptions enable row level security;

create policy "categories_select_authenticated"
on public.categories
for select
to authenticated
using (true);

create policy "users_select_own"
on public.users
for select
to authenticated
using (id = auth.uid());

create policy "users_update_own"
on public.users
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "templates_select_accessible"
on public.templates
for select
to authenticated
using (public.can_access_template(id, auth.uid()));

create policy "templates_insert_owner"
on public.templates
for insert
to authenticated
with check (owner_id = auth.uid());

create policy "templates_update_editable"
on public.templates
for update
to authenticated
using (public.can_edit_template(id, auth.uid()))
with check (public.can_edit_template(id, auth.uid()));

create policy "templates_delete_owner"
on public.templates
for delete
to authenticated
using (owner_id = auth.uid());

create policy "template_items_select_accessible"
on public.template_items
for select
to authenticated
using (public.can_access_template(template_id, auth.uid()));

create policy "template_items_insert_editable"
on public.template_items
for insert
to authenticated
with check (public.can_edit_template(template_id, auth.uid()));

create policy "template_items_update_editable"
on public.template_items
for update
to authenticated
using (public.can_edit_template(template_id, auth.uid()))
with check (public.can_edit_template(template_id, auth.uid()));

create policy "template_items_delete_editable"
on public.template_items
for delete
to authenticated
using (public.can_edit_template(template_id, auth.uid()));

create policy "template_shares_select_participants"
on public.template_shares
for select
to authenticated
using (
  shared_with_user_id = auth.uid()
  or exists (
    select 1
    from public.templates t
    where t.id = template_shares.template_id
      and t.owner_id = auth.uid()
  )
);

create policy "template_shares_insert_owner"
on public.template_shares
for insert
to authenticated
with check (
  shared_by_user_id = auth.uid()
  and exists (
    select 1
    from public.templates t
    where t.id = template_shares.template_id
      and t.owner_id = auth.uid()
  )
);

create policy "template_shares_update_owner"
on public.template_shares
for update
to authenticated
using (
  exists (
    select 1
    from public.templates t
    where t.id = template_shares.template_id
      and t.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.templates t
    where t.id = template_shares.template_id
      and t.owner_id = auth.uid()
  )
);

create policy "template_shares_delete_owner"
on public.template_shares
for delete
to authenticated
using (
  exists (
    select 1
    from public.templates t
    where t.id = template_shares.template_id
      and t.owner_id = auth.uid()
  )
);

create policy "plans_select_accessible"
on public.plans
for select
to authenticated
using (public.can_access_plan(id, auth.uid()));

create policy "plans_insert_owner"
on public.plans
for insert
to authenticated
with check (owner_id = auth.uid());

create policy "plans_update_editable"
on public.plans
for update
to authenticated
using (public.can_edit_plan(id, auth.uid()))
with check (public.can_edit_plan(id, auth.uid()));

create policy "plans_delete_owner"
on public.plans
for delete
to authenticated
using (owner_id = auth.uid());

create policy "plan_items_select_accessible"
on public.plan_items
for select
to authenticated
using (public.can_access_plan(plan_id, auth.uid()));

create policy "plan_items_insert_editable"
on public.plan_items
for insert
to authenticated
with check (public.can_edit_plan(plan_id, auth.uid()));

create policy "plan_items_update_editable"
on public.plan_items
for update
to authenticated
using (public.can_edit_plan(plan_id, auth.uid()))
with check (public.can_edit_plan(plan_id, auth.uid()));

create policy "plan_items_delete_editable"
on public.plan_items
for delete
to authenticated
using (public.can_edit_plan(plan_id, auth.uid()));

create policy "plan_shares_select_participants"
on public.plan_shares
for select
to authenticated
using (
  shared_with_user_id = auth.uid()
  or exists (
    select 1
    from public.plans p
    where p.id = plan_shares.plan_id
      and p.owner_id = auth.uid()
  )
);

create policy "plan_shares_insert_owner"
on public.plan_shares
for insert
to authenticated
with check (
  shared_by_user_id = auth.uid()
  and exists (
    select 1
    from public.plans p
    where p.id = plan_shares.plan_id
      and p.owner_id = auth.uid()
  )
);

create policy "plan_shares_update_owner"
on public.plan_shares
for update
to authenticated
using (
  exists (
    select 1
    from public.plans p
    where p.id = plan_shares.plan_id
      and p.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.plans p
    where p.id = plan_shares.plan_id
      and p.owner_id = auth.uid()
  )
);

create policy "plan_shares_delete_owner"
on public.plan_shares
for delete
to authenticated
using (
  exists (
    select 1
    from public.plans p
    where p.id = plan_shares.plan_id
      and p.owner_id = auth.uid()
  )
);

create policy "expenses_select_accessible"
on public.expenses
for select
to authenticated
using (public.can_access_plan(plan_id, auth.uid()));

create policy "expenses_insert_editable"
on public.expenses
for insert
to authenticated
with check (
  public.can_edit_plan(plan_id, auth.uid())
  and user_id = auth.uid()
);

create policy "expenses_update_editable"
on public.expenses
for update
to authenticated
using (public.can_edit_plan(plan_id, auth.uid()))
with check (public.can_edit_plan(plan_id, auth.uid()));

create policy "expenses_delete_editable"
on public.expenses
for delete
to authenticated
using (public.can_edit_plan(plan_id, auth.uid()));

create policy "notifications_select_own"
on public.notifications
for select
to authenticated
using (user_id = auth.uid());

create policy "notifications_update_own"
on public.notifications
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "push_subscriptions_select_own"
on public.push_subscriptions
for select
to authenticated
using (user_id = auth.uid());

create policy "push_subscriptions_update_own"
on public.push_subscriptions
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end
$$;

insert into public.categories (id, name, icon, color)
values
  ('00000000-0000-4000-a000-000000000101', 'Food & Groceries', 'eva-shopping-cart-outline', '#4CAF50'),
  ('00000000-0000-4000-a000-000000000102', 'Transport', 'eva-car-outline', '#2196F3'),
  ('00000000-0000-4000-a000-000000000103', 'Entertainment', 'eva-film-outline', '#9C27B0'),
  ('00000000-0000-4000-a000-000000000104', 'Shopping', 'eva-pricetags-outline', '#FF9800'),
  ('00000000-0000-4000-a000-000000000105', 'Bills & Utilities', 'eva-flash-outline', '#F44336')
on conflict (id) do update
set name = excluded.name,
    icon = excluded.icon,
    color = excluded.color,
    updated_at = timezone('utc', now());
