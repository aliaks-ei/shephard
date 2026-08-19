-- private.has_mcp_access returned NULL, not false, when no live grant existed:
-- the SELECT found no row, so granted_level stayed NULL, and both
-- `granted_level = 'write'` and `granted_level = 'read'` evaluated to NULL.
--
-- private.require_mcp_access then ran `if not private.has_mcp_access(...)`,
-- and `not NULL` is NULL, so the IF branch never fired and no exception was
-- raised. A user who revoked an MCP client in the consent screen was therefore
-- still readable and writable by that client for the remaining life of its
-- access token.
--
-- Ground both checks in false so a missing or revoked grant is a denial.
create or replace function private.has_mcp_access(p_required_level text)
returns boolean
language plpgsql
stable
security definer
set search_path = 'private', 'pg_temp'
as $$
declare
  actor_id uuid := auth.uid();
  oauth_client_id uuid := private.mcp_client_id();
  granted_level text;
begin
  if actor_id is null or oauth_client_id is null then
    return false;
  end if;

  select access_level
  into granted_level
  from private.mcp_authorizations
  where user_id = actor_id
    and client_id = oauth_client_id
    and revoked_at is null;

  if granted_level is null then
    return false;
  end if;

  return granted_level = 'write'
    or (p_required_level = 'read' and granted_level = 'read');
end;
$$;

create or replace function private.require_mcp_access(p_required_level text)
returns void
language plpgsql
stable
security definer
set search_path = 'private', 'pg_temp'
as $$
begin
  if p_required_level not in ('read', 'write') then
    raise exception 'Invalid MCP access level' using errcode = '22023';
  end if;

  -- coalesce so a NULL from any future change is still treated as a denial.
  if not coalesce(private.has_mcp_access(p_required_level), false) then
    raise exception 'MCP access is not authorized' using errcode = '42501';
  end if;
end;
$$;

revoke all on function private.has_mcp_access(text) from public;
revoke all on function private.require_mcp_access(text) from public;
grant execute on function private.has_mcp_access(text) to mcp_user;
grant execute on function private.require_mcp_access(text) to mcp_user;

notify pgrst, 'reload schema';
