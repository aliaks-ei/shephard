-- Existing default privileges explicitly granted these functions to anon and
-- authenticated when they were created. Remove those grants and then restore
-- only the intended caller-specific access.
revoke execute on function public.authorize_mcp_client(uuid) from anon, authenticated, service_role;
revoke execute on function public.list_mcp_authorizations() from anon, authenticated, service_role;
revoke execute on function public.set_mcp_authorization_access(uuid, text) from anon, authenticated, service_role;
revoke execute on function public.revoke_mcp_authorization(uuid) from anon, authenticated, service_role;

revoke execute on function public.mcp_list_plans(integer) from anon, authenticated, service_role;
revoke execute on function public.mcp_get_plan_overview(uuid) from anon, authenticated, service_role;
revoke execute on function public.mcp_list_expenses(uuid, integer, timestamptz, uuid) from anon, authenticated, service_role;
revoke execute on function public.mcp_list_categories() from anon, authenticated, service_role;
revoke execute on function public.mcp_record_expense(jsonb, uuid) from anon, authenticated, service_role;

grant execute on function public.authorize_mcp_client(uuid) to authenticated;
grant execute on function public.list_mcp_authorizations() to authenticated;
grant execute on function public.set_mcp_authorization_access(uuid, text) to authenticated;
grant execute on function public.revoke_mcp_authorization(uuid) to authenticated;

grant execute on function public.mcp_list_plans(integer) to mcp_user;
grant execute on function public.mcp_get_plan_overview(uuid) to mcp_user;
grant execute on function public.mcp_list_expenses(uuid, integer, timestamptz, uuid) to mcp_user;
grant execute on function public.mcp_list_categories() to mcp_user;
grant execute on function public.mcp_record_expense(jsonb, uuid) to mcp_user;
