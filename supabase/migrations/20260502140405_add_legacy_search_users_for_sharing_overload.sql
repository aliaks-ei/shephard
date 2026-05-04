create or replace function public.search_users_for_sharing(q text)
returns table(id uuid, name text, email text)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  actor_id uuid := auth.uid();
  normalized_query text := lower(trim(q));
begin
  if actor_id is null then
    return;
  end if;

  if length(normalized_query) < 3 then
    return;
  end if;

  return query
  select u.id, u.name, u.email
  from public.users u
  where u.id <> actor_id
    and lower(u.email) like '%' || normalized_query || '%'
  order by lower(u.email)
  limit 10;
end;
$$;

grant execute on function public.search_users_for_sharing(text) to authenticated;

notify pgrst, 'reload schema';
