-- Give the PostgREST API a fresh, single-argument RPC for MCP expense writes.
-- The existing mcp_record_expense function remains the authorization and
-- idempotency boundary; this wrapper only adapts the HTTP payload.
create or replace function public.mcp_create_expense(p_request jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = 'public', 'private', 'pg_temp'
as $$
declare
  expense jsonb;
  idempotency_key uuid;
begin
  if jsonb_typeof(coalesce(p_request, '{}'::jsonb)) <> 'object' then
    raise exception 'Invalid MCP expense request' using errcode = '22023';
  end if;

  expense := p_request -> 'expense';
  idempotency_key := nullif(p_request ->> 'idempotency_key', '')::uuid;

  if expense is null or idempotency_key is null then
    raise exception 'Invalid MCP expense request' using errcode = '22023';
  end if;

  return public.mcp_record_expense(expense, idempotency_key);
end;
$$;

revoke all on function public.mcp_create_expense(jsonb) from public;
grant execute on function public.mcp_create_expense(jsonb) to mcp_user;

notify pgrst, 'reload schema';
