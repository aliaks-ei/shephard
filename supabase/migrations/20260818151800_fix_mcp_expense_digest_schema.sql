-- pgcrypto is installed in the extensions schema on hosted Supabase projects.
-- Schema-qualify digest because this SECURITY DEFINER function intentionally
-- uses a restricted search_path.
create or replace function public.mcp_record_expense(
  p_expense jsonb,
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path = 'public', 'private', 'pg_temp'
as $$
declare
  actor_id uuid := auth.uid();
  oauth_client_id uuid := private.mcp_client_id();
  payload_hash text;
  existing_hash text;
  existing_result jsonb;
  transaction_result jsonb;
  response jsonb;
begin
  perform private.require_mcp_access('write');

  if jsonb_typeof(coalesce(p_expense, '{}'::jsonb)) <> 'object'
    or nullif(trim(p_expense ->> 'name'), '') is null
    or char_length(trim(p_expense ->> 'name')) > 100
    or nullif(p_expense ->> 'plan_id', '') is null
    or nullif(p_expense ->> 'category_id', '') is null
    or coalesce((p_expense ->> 'amount')::numeric, 0) <= 0 then
    raise exception 'Invalid expense payload' using errcode = '22023';
  end if;

  payload_hash := encode(extensions.digest(p_expense::text, 'sha256'), 'hex');
  perform pg_advisory_xact_lock(hashtextextended(
    actor_id::text || ':' || oauth_client_id::text || ':' || p_idempotency_key::text,
    0
  ));

  select request_hash, result
  into existing_hash, existing_result
  from private.mcp_idempotency_keys
  where user_id = actor_id
    and client_id = oauth_client_id
    and tool_name = 'record_expense'
    and idempotency_key = p_idempotency_key;

  if found then
    if existing_hash <> payload_hash then
      raise exception 'Idempotency key was already used with a different request'
        using errcode = '22023';
    end if;
    return existing_result;
  end if;

  transaction_result := public.create_expense_transaction(p_expense, false);
  response := jsonb_build_object(
    'id', transaction_result -> 'expense' ->> 'id',
    'name', transaction_result -> 'expense' ->> 'name',
    'amount', transaction_result -> 'expense' -> 'amount',
    'currency', transaction_result -> 'expense' ->> 'currency',
    'expense_date', transaction_result -> 'expense' ->> 'expense_date',
    'plan_id', transaction_result -> 'expense' ->> 'plan_id',
    'category_id', transaction_result -> 'expense' ->> 'category_id'
  );

  insert into private.mcp_idempotency_keys (
    user_id, client_id, tool_name, idempotency_key, request_hash, result
  ) values (
    actor_id, oauth_client_id, 'record_expense', p_idempotency_key, payload_hash, response
  );

  return response;
end;
$$;

revoke all on function public.mcp_record_expense(jsonb, uuid) from public;
grant execute on function public.mcp_record_expense(jsonb, uuid) to mcp_user;

notify pgrst, 'reload schema';
