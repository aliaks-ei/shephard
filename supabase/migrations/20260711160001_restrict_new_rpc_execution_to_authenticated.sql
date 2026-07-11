-- This project has default function privileges for anon. Restrict the new RPCs
-- to authenticated callers as intended by their defining migrations.
revoke all on function public.create_plan_with_items(jsonb, jsonb) from anon;
revoke all on function public.update_plan_with_items(uuid, jsonb, jsonb) from anon;
revoke all on function public.create_template_with_items(jsonb, jsonb) from anon;
revoke all on function public.update_template_with_items(uuid, jsonb, jsonb) from anon;
revoke all on function public.delete_expenses_and_reconcile(uuid[]) from anon;
revoke all on function public.get_plan_overview_snapshots(uuid[]) from anon;
revoke all on function public.get_plan_expense_summary(uuid) from anon;
revoke all on function public.get_recent_expenses_page(
  uuid,
  integer,
  integer,
  text,
  uuid,
  text
) from anon;
