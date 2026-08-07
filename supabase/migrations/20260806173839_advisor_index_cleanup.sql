set lock_timeout = '10s';
set statement_timeout = '120s';

-- Keep the established user index and remove the duplicate introduced while
-- hardening foreign keys.
drop index if exists public.expenses_user_id_idx;

-- Cover composite and outbox foreign keys in their declared column order.
create index if not exists expenses_plan_item_context_idx
  on public.expenses(plan_item_id, plan_id, category_id);

create index if not exists notification_outbox_actor_user_id_idx
  on public.notification_outbox(actor_user_id);

comment on table public.notification_outbox is
  'Service-role-only durable domain event outbox. RLS intentionally has no client policies.';
