-- Supabase default privileges grant EXECUTE on every new function in the public
-- schema to anon, authenticated, and service_role. `revoke all ... from public`
-- removes only the PUBLIC pseudo-role, not those explicit grants, so the MCP
-- functions added in 20260818144600, 20260819140000, and 20260819150000 were
-- callable by ordinary app sessions.
--
-- A normal session has no client_id claim, so private.require_mcp_access still
-- refused it with 42501 and no data was reachable. Restrict them anyway, so the
-- MCP surface stays reachable only through the mcp_user role.
--
-- This mirrors 20260818113242_restrict_mcp_rpc_execution.sql, which did the
-- same for the first batch of mcp_* functions.

revoke execute on function public.mcp_create_expense(jsonb) from anon, authenticated, service_role;

revoke execute on function public.mcp_list_templates(integer) from anon, authenticated, service_role;
revoke execute on function public.mcp_get_template(uuid) from anon, authenticated, service_role;
revoke execute on function public.mcp_get_plan_summary(uuid) from anon, authenticated, service_role;
revoke execute on function public.mcp_list_expenses_by_date_range(date, date, uuid, integer) from anon, authenticated, service_role;
revoke execute on function public.mcp_list_notifications(integer) from anon, authenticated, service_role;
revoke execute on function public.mcp_get_user_preferences() from anon, authenticated, service_role;
revoke execute on function public.mcp_list_plan_shares(uuid) from anon, authenticated, service_role;

revoke execute on function public.mcp_create_plan(jsonb) from anon, authenticated, service_role;
revoke execute on function public.mcp_update_plan(jsonb) from anon, authenticated, service_role;
revoke execute on function public.mcp_add_plan_item(jsonb) from anon, authenticated, service_role;
revoke execute on function public.mcp_update_plan_item(jsonb) from anon, authenticated, service_role;
revoke execute on function public.mcp_record_expenses(jsonb) from anon, authenticated, service_role;
revoke execute on function public.mcp_update_expense(jsonb) from anon, authenticated, service_role;
revoke execute on function public.mcp_create_template(jsonb) from anon, authenticated, service_role;

grant execute on function public.mcp_create_expense(jsonb) to mcp_user;

grant execute on function public.mcp_list_templates(integer) to mcp_user;
grant execute on function public.mcp_get_template(uuid) to mcp_user;
grant execute on function public.mcp_get_plan_summary(uuid) to mcp_user;
grant execute on function public.mcp_list_expenses_by_date_range(date, date, uuid, integer) to mcp_user;
grant execute on function public.mcp_list_notifications(integer) to mcp_user;
grant execute on function public.mcp_get_user_preferences() to mcp_user;
grant execute on function public.mcp_list_plan_shares(uuid) to mcp_user;

grant execute on function public.mcp_create_plan(jsonb) to mcp_user;
grant execute on function public.mcp_update_plan(jsonb) to mcp_user;
grant execute on function public.mcp_add_plan_item(jsonb) to mcp_user;
grant execute on function public.mcp_update_plan_item(jsonb) to mcp_user;
grant execute on function public.mcp_record_expenses(jsonb) to mcp_user;
grant execute on function public.mcp_update_expense(jsonb) to mcp_user;
grant execute on function public.mcp_create_template(jsonb) to mcp_user;

notify pgrst, 'reload schema';
