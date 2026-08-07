-- Generated from production project rirgsoufkldfcogfjwwy on 2026-08-06.

-- Restore this schema to a fresh Supabase project before applying later migrations.

create schema if not exists private;

revoke all on schema private from public, anon;

create table if not exists public.categories (
  id uuid default gen_random_uuid() not null,
  name text not null,
  color text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  icon text
);

create table if not exists public.template_items (
  id uuid default gen_random_uuid() not null,
  template_id uuid not null,
  category_id uuid not null,
  amount numeric(10,2) not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  name text not null,
  is_fixed_payment boolean default true not null
);

create table if not exists public.templates (
  id uuid default gen_random_uuid() not null,
  owner_id uuid not null,
  name text not null,
  duration text not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  total numeric default 0 not null,
  currency text default 'USD'::text not null
);

create table if not exists public.template_shares (
  id uuid default gen_random_uuid() not null,
  template_id uuid not null,
  shared_with_user_id uuid not null,
  permission_level text not null,
  shared_by_user_id uuid not null,
  created_at timestamp with time zone default now()
);

create table if not exists public.users (
  id uuid not null,
  name text not null,
  email text not null,
  avatar text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone,
  preferences jsonb default '{}'::jsonb
);

create table if not exists public.plans (
  id uuid default gen_random_uuid() not null,
  owner_id uuid not null,
  template_id uuid not null,
  name text not null,
  start_date date not null,
  end_date date not null,
  status text not null,
  total numeric(10,2) default 0 not null,
  currency text default 'EUR'::text not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists public.plan_shares (
  id uuid default gen_random_uuid() not null,
  plan_id uuid not null,
  shared_with_user_id uuid not null,
  permission_level text not null,
  shared_by_user_id uuid not null,
  created_at timestamp with time zone default now()
);

create table if not exists public.plan_items (
  id uuid default gen_random_uuid() not null,
  plan_id uuid not null,
  category_id uuid not null,
  name text not null,
  amount numeric(10,2) not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  is_completed boolean default false,
  is_fixed_payment boolean default true not null
);

create table if not exists public.expenses (
  id uuid default gen_random_uuid() not null,
  name character varying(100) not null,
  amount numeric(10,2) not null,
  expense_date date default CURRENT_DATE not null,
  plan_id uuid not null,
  category_id uuid not null,
  user_id uuid not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  plan_item_id uuid,
  currency text not null,
  original_amount numeric,
  original_currency text
);

create table if not exists public.notifications (
  id uuid default gen_random_uuid() not null,
  user_id uuid not null,
  actor_user_id uuid,
  type text not null,
  entity_type text not null,
  entity_id uuid not null,
  title text not null,
  body text not null,
  payload jsonb default '{}'::jsonb not null,
  read_at timestamp with time zone,
  deleted_at timestamp with time zone,
  created_at timestamp with time zone default now() not null,
  push_attempted_at timestamp with time zone,
  push_sent_at timestamp with time zone,
  push_error text
);

create table if not exists public.push_subscriptions (
  id uuid default gen_random_uuid() not null,
  user_id uuid not null,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  revoked_at timestamp with time zone
);

create table if not exists public.notification_outbox (
  id uuid default gen_random_uuid() not null,
  event_type text not null,
  actor_user_id uuid not null,
  entity_type text not null,
  entity_id uuid not null,
  recipient_ids uuid[],
  payload jsonb default '{}'::jsonb not null,
  status text default 'pending'::text not null,
  attempts integer default 0 not null,
  available_at timestamp with time zone default now() not null,
  claimed_at timestamp with time zone,
  processed_at timestamp with time zone,
  last_error text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);


-- Candidate keys must exist before any foreign key references them.
alter table categories add constraint categories_pkey PRIMARY KEY (id);
alter table categories add constraint unique_expense_category_name UNIQUE (name);
alter table users add constraint users_pkey PRIMARY KEY (id);
alter table templates add constraint templates_pkey PRIMARY KEY (id);
alter table templates add constraint unique_template_name_per_user UNIQUE (owner_id, name);
alter table template_items add constraint expense_template_items_pkey PRIMARY KEY (id);
alter table template_shares add constraint template_shares_pkey PRIMARY KEY (id);
alter table template_shares add constraint template_shares_template_id_shared_with_user_id_key UNIQUE (template_id, shared_with_user_id);
alter table plans add constraint plans_pkey PRIMARY KEY (id);
alter table plans add constraint unique_plan_name_per_user UNIQUE (owner_id, name);
alter table plan_items add constraint plan_items_pkey PRIMARY KEY (id);
alter table plan_items add constraint plan_items_expense_reference_key UNIQUE (id, plan_id, category_id);
alter table plan_shares add constraint plan_shares_pkey PRIMARY KEY (id);
alter table plan_shares add constraint plan_shares_plan_id_shared_with_user_id_key UNIQUE (plan_id, shared_with_user_id);
alter table expenses add constraint expenses_pkey PRIMARY KEY (id);
alter table notifications add constraint notifications_pkey PRIMARY KEY (id);
alter table notification_outbox add constraint notification_outbox_pkey PRIMARY KEY (id);
alter table push_subscriptions add constraint push_subscriptions_pkey PRIMARY KEY (id);
alter table push_subscriptions add constraint push_subscriptions_endpoint_key UNIQUE (endpoint);

alter table categories add constraint valid_category_name CHECK (((length(TRIM(BOTH FROM name)) > 0) AND (length(name) <= 100)));
alter table categories add constraint valid_color_format CHECK (((color IS NULL) OR (color ~ '^#[0-9A-Fa-f]{6}$'::text)));
alter table expenses add constraint expenses_amount_check CHECK ((amount > (0)::numeric));
alter table expenses add constraint expenses_amount_upper_bound_check CHECK ((amount < (1000000)::numeric));
alter table expenses add constraint expenses_currency_check CHECK ((currency ~ '^[A-Z]{3}$'::text));
alter table expenses add constraint expenses_name_check CHECK (((length(TRIM(BOTH FROM name)) > 0) AND (length((name)::text) <= 120)));
alter table expenses add constraint expenses_original_amount_check CHECK (((original_amount IS NULL) OR (original_amount > (0)::numeric)));
alter table expenses add constraint expenses_original_currency_check CHECK (((original_currency IS NULL) OR (original_currency ~ '^[A-Z]{3}$'::text)));
alter table expenses add constraint expenses_original_money_pair_check CHECK (((original_amount IS NULL) = (original_currency IS NULL)));
alter table notification_outbox add constraint notification_outbox_attempts_check CHECK ((attempts >= 0));
alter table notification_outbox add constraint notification_outbox_entity_type_check CHECK ((entity_type = ANY (ARRAY['plan'::text, 'template'::text])));
alter table notification_outbox add constraint notification_outbox_event_type_check CHECK ((event_type = ANY (ARRAY['plan_shared'::text, 'template_shared'::text, 'shared_plan_updated'::text, 'shared_template_updated'::text, 'shared_plan_expense_added'::text, 'shared_plan_removed'::text, 'shared_template_removed'::text, 'shared_plan_cancelled'::text, 'shared_plan_permission_changed'::text, 'shared_template_permission_changed'::text])));
alter table notification_outbox add constraint notification_outbox_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'processing'::text, 'completed'::text, 'failed'::text])));
alter table notifications add constraint notifications_entity_type_check CHECK ((entity_type = ANY (ARRAY['plan'::text, 'template'::text])));
alter table notifications add constraint notifications_type_check CHECK ((type = ANY (ARRAY['plan_shared'::text, 'template_shared'::text, 'shared_plan_updated'::text, 'shared_template_updated'::text, 'shared_plan_expense_added'::text, 'shared_plan_removed'::text, 'shared_template_removed'::text, 'shared_plan_cancelled'::text, 'shared_plan_permission_changed'::text, 'shared_template_permission_changed'::text])));
alter table plan_items add constraint valid_plan_item_amount CHECK (((amount >= (0)::numeric) AND (amount < (1000000)::numeric)));
alter table plan_items add constraint valid_plan_item_name CHECK (((length(TRIM(BOTH FROM name)) > 0) AND (length(name) <= 200)));
alter table plans add constraint plans_date_order_check CHECK ((end_date >= start_date));
alter table plans add constraint plans_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'active'::text, 'completed'::text, 'cancelled'::text])));
alter table plans add constraint valid_plan_currency_code CHECK ((currency ~ '^[A-Z]{3}$'::text));
alter table plans add constraint valid_plan_name CHECK (((length(TRIM(BOTH FROM name)) > 0) AND (length(name) <= 200)));
alter table plans add constraint valid_plan_total CHECK (((total IS NULL) OR ((total >= (0)::numeric) AND (total < (10000000)::numeric))));
alter table plan_shares add constraint plan_shares_permission_level_check CHECK ((permission_level = ANY (ARRAY['view'::text, 'edit'::text])));
alter table plan_shares add constraint prevent_plan_self_sharing CHECK ((shared_with_user_id <> shared_by_user_id));
alter table template_items add constraint valid_amount CHECK (((amount >= (0)::numeric) AND (amount < (100000)::numeric)));
alter table template_items add constraint valid_item_name CHECK (((length(TRIM(BOTH FROM name)) > 0) AND (length(name) <= 200)));
alter table templates add constraint templates_duration_check CHECK ((duration = ANY (ARRAY['weekly'::text, 'monthly'::text, 'yearly'::text])));
alter table templates add constraint valid_currency_code CHECK ((currency ~ '^[A-Z]{3}$'::text));
alter table templates add constraint valid_template_name CHECK (((length(TRIM(BOTH FROM name)) > 0) AND (length(name) <= 200)));
alter table templates add constraint valid_total CHECK (((total IS NULL) OR ((total >= (0)::numeric) AND (total < (1000000)::numeric))));
alter table template_shares add constraint prevent_self_sharing CHECK ((shared_with_user_id <> shared_by_user_id));
alter table template_shares add constraint template_shares_permission_level_check CHECK ((permission_level = ANY (ARRAY['view'::text, 'edit'::text])));
alter table users add constraint valid_email_format CHECK ((email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'::text));

alter table users add constraint users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table templates add constraint templates_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table template_items add constraint template_items_category_id_fkey FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE;
alter table template_items add constraint template_items_template_id_fkey FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE CASCADE;
alter table template_shares add constraint template_shares_shared_by_user_id_fkey FOREIGN KEY (shared_by_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table template_shares add constraint template_shares_shared_with_user_id_fkey FOREIGN KEY (shared_with_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table template_shares add constraint template_shares_template_id_fkey FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE CASCADE;
alter table plans add constraint plans_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table plans add constraint plans_template_id_fkey FOREIGN KEY (template_id) REFERENCES templates(id);
alter table plan_items add constraint plan_items_category_id_fkey FOREIGN KEY (category_id) REFERENCES categories(id);
alter table plan_items add constraint plan_items_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE;
alter table plan_shares add constraint plan_shares_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE;
alter table plan_shares add constraint plan_shares_shared_by_user_id_fkey FOREIGN KEY (shared_by_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table plan_shares add constraint plan_shares_shared_with_user_id_fkey FOREIGN KEY (shared_with_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table expenses add constraint expenses_category_id_fkey FOREIGN KEY (category_id) REFERENCES categories(id);
alter table expenses add constraint expenses_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE;
alter table expenses add constraint expenses_plan_item_context_fkey FOREIGN KEY (plan_item_id, plan_id, category_id) REFERENCES plan_items(id, plan_id, category_id) ON DELETE SET NULL (plan_item_id);
alter table expenses add constraint expenses_plan_item_id_fkey FOREIGN KEY (plan_item_id) REFERENCES plan_items(id) ON DELETE SET NULL;
alter table expenses add constraint expenses_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
alter table notifications add constraint notifications_actor_user_id_fkey FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL;
alter table notifications add constraint notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
alter table notification_outbox add constraint notification_outbox_actor_user_id_fkey FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE CASCADE;
alter table push_subscriptions add constraint push_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

CREATE OR REPLACE FUNCTION private.can_access_plan(target_plan_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
$function$;


CREATE OR REPLACE FUNCTION private.can_access_template(target_template_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
$function$;


CREATE OR REPLACE FUNCTION private.can_edit_plan(target_plan_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
$function$;


CREATE OR REPLACE FUNCTION private.can_edit_template(target_template_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
$function$;


CREATE OR REPLACE FUNCTION private.enqueue_notification_event(event_type text, entity_type text, entity_id uuid, payload jsonb DEFAULT '{}'::jsonb, recipient_ids uuid[] DEFAULT NULL::uuid[])
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  event_id uuid;
  actor_id uuid := (select auth.uid());
begin
  if actor_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  insert into public.notification_outbox (
    event_type,
    actor_user_id,
    entity_type,
    entity_id,
    recipient_ids,
    payload
  )
  values (
    event_type,
    actor_id,
    entity_type,
    entity_id,
    recipient_ids,
    coalesce(payload, '{}'::jsonb)
  )
  returning id into event_id;

  return event_id;
end;
$function$;


CREATE OR REPLACE FUNCTION private.is_plan_owner(target_plan_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select (select auth.uid()) is not null
    and exists (
      select 1 from public.plans p
      where p.id = target_plan_id
        and p.owner_id = (select auth.uid())
    );
$function$;


CREATE OR REPLACE FUNCTION private.is_template_owner(target_template_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select (select auth.uid()) is not null
    and exists (
      select 1 from public.templates t
      where t.id = target_template_id
        and t.owner_id = (select auth.uid())
    );
$function$;


CREATE OR REPLACE FUNCTION public.calculate_plan_status(p_start_date date, p_end_date date, p_current_status text DEFAULT NULL::text)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'public', 'auth'
AS $function$
begin
  if p_current_status = 'cancelled' then
    return 'cancelled';
  end if;

  if current_date < p_start_date then
    return 'pending';
  elsif current_date >= p_start_date and current_date <= p_end_date then
    return 'active';
  else
    return 'completed';
  end if;
end;
$function$;


CREATE OR REPLACE FUNCTION public.create_expense_transaction(p_expense jsonb, p_complete_plan_item boolean DEFAULT false)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  actor_id uuid := auth.uid();
  target_plan_id uuid := nullif(p_expense->>'plan_id', '')::uuid;
  target_category_id uuid := nullif(p_expense->>'category_id', '')::uuid;
  target_plan_item_id uuid := nullif(p_expense->>'plan_item_id', '')::uuid;
  plan_currency text;
  created_expense public.expenses%rowtype;
  outbox_id uuid;
begin
  if actor_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if jsonb_typeof(coalesce(p_expense, '{}'::jsonb)) <> 'object'
    or target_plan_id is null
    or target_category_id is null then
    raise exception 'Invalid expense transaction payload' using errcode = '22023';
  end if;

  select p.currency
  into plan_currency
  from public.plans p
  where p.id = target_plan_id
    and (
      p.owner_id = actor_id
      or exists (
        select 1
        from public.plan_shares ps
        where ps.plan_id = p.id
          and ps.shared_with_user_id = actor_id
          and ps.permission_level = 'edit'
      )
    )
  for update;

  if not found then
    raise exception 'Plan not found or edit permission denied' using errcode = '42501';
  end if;

  if target_plan_item_id is not null and not exists (
    select 1
    from public.plan_items pi
    where pi.id = target_plan_item_id
      and pi.plan_id = target_plan_id
      and pi.category_id = target_category_id
  ) then
    raise exception 'Plan item does not match the expense plan and category'
      using errcode = '23503';
  end if;

  insert into public.expenses (
    name,
    amount,
    expense_date,
    plan_id,
    category_id,
    user_id,
    plan_item_id,
    currency,
    original_amount,
    original_currency
  )
  values (
    trim(p_expense->>'name'),
    (p_expense->>'amount')::numeric,
    coalesce(nullif(p_expense->>'expense_date', '')::date, current_date),
    target_plan_id,
    target_category_id,
    actor_id,
    target_plan_item_id,
    coalesce(nullif(p_expense->>'currency', ''), plan_currency),
    nullif(p_expense->>'original_amount', '')::numeric,
    nullif(p_expense->>'original_currency', '')
  )
  returning * into created_expense;

  if p_complete_plan_item and target_plan_item_id is not null then
    update public.plan_items
    set is_completed = true,
        updated_at = now()
    where id = target_plan_item_id;
  end if;

  update public.plans
  set updated_at = now()
  where id = target_plan_id;

  outbox_id := private.enqueue_notification_event(
    'shared_plan_expense_added',
    'plan',
    target_plan_id,
    jsonb_build_object('expenseName', created_expense.name)
  );

  return jsonb_build_object(
    'expense', to_jsonb(created_expense),
    'outbox_id', outbox_id
  );
end;
$function$;


CREATE OR REPLACE FUNCTION public.create_expenses_transaction(p_expenses jsonb, p_complete_plan_items boolean DEFAULT true)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  expense_payload jsonb;
  transaction_result jsonb;
  created_expenses jsonb := '[]'::jsonb;
  outbox_ids jsonb := '[]'::jsonb;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if jsonb_typeof(coalesce(p_expenses, '[]'::jsonb)) <> 'array'
    or jsonb_array_length(coalesce(p_expenses, '[]'::jsonb)) = 0 then
    raise exception 'At least one expense is required' using errcode = '22023';
  end if;

  for expense_payload in
    select value from jsonb_array_elements(p_expenses)
  loop
    transaction_result := public.create_expense_transaction(
      expense_payload,
      p_complete_plan_items
    );
    created_expenses := created_expenses || jsonb_build_array(transaction_result->'expense');
    outbox_ids := outbox_ids || jsonb_build_array(transaction_result->'outbox_id');
  end loop;

  return jsonb_build_object(
    'expenses', created_expenses,
    'outbox_ids', outbox_ids
  );
end;
$function$;


CREATE OR REPLACE FUNCTION public.create_plan_with_items(p_plan jsonb, p_items jsonb DEFAULT '[]'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  actor_id uuid := auth.uid();
  created_plan public.plans%rowtype;
  result jsonb;
begin
  if actor_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if jsonb_typeof(coalesce(p_plan, '{}'::jsonb)) <> 'object'
    or jsonb_typeof(coalesce(p_items, '[]'::jsonb)) <> 'array' then
    raise exception 'Invalid plan transaction payload' using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.templates t
    where t.id = (p_plan->>'template_id')::uuid
      and (
        t.owner_id = actor_id
        or exists (
          select 1
          from public.template_shares ts
          where ts.template_id = t.id
            and ts.shared_with_user_id = actor_id
        )
      )
  ) then
    raise exception 'Template not found or access denied' using errcode = '42501';
  end if;

  insert into public.plans (
    name,
    owner_id,
    start_date,
    end_date,
    template_id,
    currency,
    total,
    status
  )
  values (
    p_plan->>'name',
    actor_id,
    (p_plan->>'start_date')::date,
    (p_plan->>'end_date')::date,
    (p_plan->>'template_id')::uuid,
    p_plan->>'currency',
    (p_plan->>'total')::numeric,
    coalesce(nullif(p_plan->>'status', ''), 'active')
  )
  returning * into created_plan;

  insert into public.plan_items (
    plan_id,
    name,
    category_id,
    amount,
    is_fixed_payment
  )
  select
    created_plan.id,
    item.name,
    item.category_id,
    item.amount,
    item.is_fixed_payment
  from jsonb_to_recordset(coalesce(p_items, '[]'::jsonb)) as item(
    name text,
    category_id uuid,
    amount numeric,
    is_fixed_payment boolean
  );

  select
    to_jsonb(created_plan)
    || jsonb_build_object(
      'plan_items',
      coalesce(
        (
          select jsonb_agg(to_jsonb(pi) order by pi.created_at, pi.id)
          from public.plan_items pi
          where pi.plan_id = created_plan.id
        ),
        '[]'::jsonb
      )
    )
  into result;

  return result;
end;
$function$;


CREATE OR REPLACE FUNCTION public.create_template_with_items(p_template jsonb, p_items jsonb DEFAULT '[]'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  actor_id uuid := auth.uid();
  created_template public.templates%rowtype;
  result jsonb;
begin
  if actor_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if jsonb_typeof(coalesce(p_template, '{}'::jsonb)) <> 'object'
    or jsonb_typeof(coalesce(p_items, '[]'::jsonb)) <> 'array' then
    raise exception 'Invalid template transaction payload' using errcode = '22023';
  end if;

  insert into public.templates (
    name,
    owner_id,
    duration,
    currency,
    total
  )
  values (
    p_template->>'name',
    actor_id,
    p_template->>'duration',
    p_template->>'currency',
    (p_template->>'total')::numeric
  )
  returning * into created_template;

  insert into public.template_items (
    template_id,
    name,
    category_id,
    amount,
    is_fixed_payment
  )
  select
    created_template.id,
    item.name,
    item.category_id,
    item.amount,
    item.is_fixed_payment
  from jsonb_to_recordset(coalesce(p_items, '[]'::jsonb)) as item(
    name text,
    category_id uuid,
    amount numeric,
    is_fixed_payment boolean
  );

  select
    to_jsonb(created_template)
    || jsonb_build_object(
      'template_items',
      coalesce(
        (
          select jsonb_agg(to_jsonb(ti) order by ti.created_at, ti.id)
          from public.template_items ti
          where ti.template_id = created_template.id
        ),
        '[]'::jsonb
      )
    )
  into result;

  return result;
end;
$function$;


CREATE OR REPLACE FUNCTION public.delete_expenses_and_reconcile(p_expense_ids uuid[])
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  actor_id uuid := auth.uid();
  requested_count integer;
  deleted_count integer;
  affected_item_ids uuid[];
  affected_plan_ids uuid[];
begin
  if actor_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  requested_count := coalesce(cardinality(p_expense_ids), 0);
  if requested_count = 0 then
    return 0;
  end if;

  if (
    select count(distinct requested.expense_id)
    from unnest(p_expense_ids) as requested(expense_id)
  ) <> requested_count then
    raise exception 'Duplicate expense IDs are not allowed' using errcode = '22023';
  end if;

  perform 1
  from public.expenses e
  join public.plans p on p.id = e.plan_id
  where e.id = any(p_expense_ids)
  for update of e;

  if (
    select count(*)
    from public.expenses e
    where e.id = any(p_expense_ids)
  ) <> requested_count then
    raise exception 'One or more expenses were not found' using errcode = 'P0002';
  end if;

  if exists (
    select 1
    from public.expenses e
    join public.plans p on p.id = e.plan_id
    where e.id = any(p_expense_ids)
      and not (
        p.owner_id = actor_id
        or exists (
          select 1
          from public.plan_shares ps
          where ps.plan_id = p.id
            and ps.shared_with_user_id = actor_id
            and ps.permission_level = 'edit'
        )
      )
  ) then
    raise exception 'Expense edit permission denied' using errcode = '42501';
  end if;

  select
    coalesce(array_agg(distinct e.plan_item_id) filter (where e.plan_item_id is not null), '{}'::uuid[]),
    coalesce(array_agg(distinct e.plan_id), '{}'::uuid[])
  into affected_item_ids, affected_plan_ids
  from public.expenses e
  where e.id = any(p_expense_ids);

  delete from public.expenses e
  where e.id = any(p_expense_ids);
  get diagnostics deleted_count = row_count;

  update public.plan_items pi
  set
    is_completed = exists (
      select 1
      from public.expenses e
      where e.plan_item_id = pi.id
    ),
    updated_at = now()
  where pi.id = any(affected_item_ids);

  update public.plans p
  set updated_at = now()
  where p.id = any(affected_plan_ids);

  return deleted_count;
end;
$function$;


CREATE OR REPLACE FUNCTION public.delete_plan_transaction(p_plan_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  actor_id uuid := auth.uid();
  plan_name text;
  recipients uuid[];
  outbox_id uuid;
begin
  if actor_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select p.name
  into plan_name
  from public.plans p
  where p.id = p_plan_id
    and p.owner_id = actor_id
  for update;

  if not found then
    raise exception 'Plan not found or delete permission denied' using errcode = '42501';
  end if;

  select coalesce(array_agg(ps.shared_with_user_id), '{}'::uuid[])
  into recipients
  from public.plan_shares ps
  where ps.plan_id = p_plan_id;

  outbox_id := private.enqueue_notification_event(
    'shared_plan_removed',
    'plan',
    p_plan_id,
    jsonb_build_object('entityName', plan_name),
    recipients
  );

  delete from public.plans where id = p_plan_id;

  return jsonb_build_object('deleted_id', p_plan_id, 'outbox_id', outbox_id);
end;
$function$;


CREATE OR REPLACE FUNCTION public.delete_template_transaction(p_template_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  actor_id uuid := auth.uid();
  template_name text;
  recipients uuid[];
  outbox_id uuid;
begin
  if actor_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select t.name
  into template_name
  from public.templates t
  where t.id = p_template_id
    and t.owner_id = actor_id
  for update;

  if not found then
    raise exception 'Template not found or delete permission denied' using errcode = '42501';
  end if;

  if exists (select 1 from public.plans p where p.template_id = p_template_id) then
    raise exception 'Template is referenced by one or more plans' using errcode = '23503';
  end if;

  select coalesce(array_agg(ts.shared_with_user_id), '{}'::uuid[])
  into recipients
  from public.template_shares ts
  where ts.template_id = p_template_id;

  outbox_id := private.enqueue_notification_event(
    'shared_template_removed',
    'template',
    p_template_id,
    jsonb_build_object('entityName', template_name),
    recipients
  );

  delete from public.templates where id = p_template_id;

  return jsonb_build_object('deleted_id', p_template_id, 'outbox_id', outbox_id);
end;
$function$;


CREATE OR REPLACE FUNCTION public.get_plan_items_with_tracking(p_plan_id uuid)
 RETURNS TABLE(id uuid, plan_id uuid, category_id uuid, name text, amount numeric, created_at timestamp with time zone, updated_at timestamp with time zone, spent_amount numeric, expense_count bigint, is_completed boolean, remaining_amount numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
begin
  if auth.uid() is null or not exists (
    select 1
    from plans p
    where p.id = p_plan_id
      and (
        p.owner_id = auth.uid()
        or exists (
          select 1
          from plan_shares ps
          where ps.plan_id = p.id
            and ps.shared_with_user_id = auth.uid()
        )
      )
  ) then
    raise exception 'Plan not found or access denied' using errcode = '42501';
  end if;

  return query
  select pi.id,
         pi.plan_id,
         pi.category_id,
         pi.name,
         pi.amount,
         pi.created_at,
         pi.updated_at,
         coalesce(sum(e.amount), 0) as spent_amount,
         count(e.id) as expense_count,
         case when coalesce(sum(e.amount), 0) >= pi.amount then true else false end as is_completed,
         pi.amount - coalesce(sum(e.amount), 0) as remaining_amount
  from plan_items pi
  left join expenses e on e.plan_item_id = pi.id
  where pi.plan_id = p_plan_id
  group by pi.id, pi.plan_id, pi.category_id, pi.name, pi.amount, pi.created_at, pi.updated_at
  order by pi.category_id, pi.name;
end;
$function$;


CREATE OR REPLACE FUNCTION public.get_plan_items_with_tracking_by_category(p_plan_id uuid, p_category_id uuid)
 RETURNS TABLE(id uuid, plan_id uuid, category_id uuid, name text, amount numeric, created_at timestamp with time zone, updated_at timestamp with time zone, spent_amount numeric, expense_count bigint, is_completed boolean, remaining_amount numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
begin
  if auth.uid() is null or not exists (
    select 1
    from plans p
    where p.id = p_plan_id
      and (
        p.owner_id = auth.uid()
        or exists (
          select 1
          from plan_shares ps
          where ps.plan_id = p.id
            and ps.shared_with_user_id = auth.uid()
        )
      )
  ) then
    raise exception 'Plan not found or access denied' using errcode = '42501';
  end if;

  return query
  select pi.id,
         pi.plan_id,
         pi.category_id,
         pi.name,
         pi.amount,
         pi.created_at,
         pi.updated_at,
         coalesce(sum(e.amount), 0) as spent_amount,
         count(e.id) as expense_count,
         case when coalesce(sum(e.amount), 0) >= pi.amount then true else false end as is_completed,
         pi.amount - coalesce(sum(e.amount), 0) as remaining_amount
  from plan_items pi
  left join expenses e on e.plan_item_id = pi.id
  where pi.plan_id = p_plan_id
    and pi.category_id = p_category_id
  group by pi.id, pi.plan_id, pi.category_id, pi.name, pi.amount, pi.created_at, pi.updated_at
  order by pi.name;
end;
$function$;


CREATE OR REPLACE FUNCTION public.get_plan_overview_snapshots(p_plan_ids uuid[])
 RETURNS TABLE(plan_id uuid, category_id uuid, category_name text, category_color text, category_icon text, planned_amount numeric, actual_amount numeric, remaining_amount numeric, expense_count bigint)
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
  with requested_plans as (
    select p.id
    from public.plans p
    where p.id = any(coalesce(p_plan_ids, array[]::uuid[]))
  ),
  item_totals as (
    select
      pi.plan_id,
      pi.category_id,
      sum(pi.amount)::numeric as planned_amount,
      sum(pi.amount) filter (
        where pi.is_fixed_payment and not pi.is_completed
      )::numeric as uncompleted_fixed_amount,
      sum(pi.amount) filter (
        where not pi.is_fixed_payment
      )::numeric as non_fixed_planned_amount
    from public.plan_items pi
    join requested_plans rp on rp.id = pi.plan_id
    group by pi.plan_id, pi.category_id
  ),
  expense_totals as (
    select
      e.plan_id,
      e.category_id,
      sum(e.amount)::numeric as actual_amount,
      sum(e.amount) filter (
        where e.plan_item_id is null or linked_item.is_fixed_payment = false
      )::numeric as non_fixed_expense_amount,
      count(*)::bigint as expense_count
    from public.expenses e
    join requested_plans rp on rp.id = e.plan_id
    left join public.plan_items linked_item
      on linked_item.id = e.plan_item_id
      and linked_item.plan_id = e.plan_id
    group by e.plan_id, e.category_id
  ),
  plan_categories as (
    select it.plan_id, it.category_id from item_totals it
    union
    select et.plan_id, et.category_id from expense_totals et
  )
  select
    pc.plan_id,
    pc.category_id,
    c.name as category_name,
    c.color as category_color,
    c.icon as category_icon,
    coalesce(it.planned_amount, 0)::numeric as planned_amount,
    coalesce(et.actual_amount, 0)::numeric as actual_amount,
    (
      coalesce(it.uncompleted_fixed_amount, 0)
      + greatest(
        0,
        coalesce(it.non_fixed_planned_amount, 0)
          - coalesce(et.non_fixed_expense_amount, 0)
      )
    )::numeric as remaining_amount,
    coalesce(et.expense_count, 0)::bigint as expense_count
  from plan_categories pc
  join public.categories c on c.id = pc.category_id
  left join item_totals it
    on it.plan_id = pc.plan_id
    and it.category_id = pc.category_id
  left join expense_totals et
    on et.plan_id = pc.plan_id
    and et.category_id = pc.category_id
  order by pc.plan_id, pc.category_id;
$function$;


CREATE OR REPLACE FUNCTION public.get_plan_expense_summary(p_plan_id uuid)
 RETURNS TABLE(category_id uuid, planned_amount numeric, actual_amount numeric, remaining_amount numeric, expense_count bigint)
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
  select
    snapshot.category_id,
    snapshot.planned_amount,
    snapshot.actual_amount,
    snapshot.remaining_amount,
    snapshot.expense_count
  from public.get_plan_overview_snapshots(array[p_plan_id]) snapshot;
$function$;


CREATE OR REPLACE FUNCTION public.get_plan_shared_users(p_plan_id uuid)
 RETURNS TABLE(user_id uuid, user_name text, user_email text, permission_level text, shared_at timestamp with time zone)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
  select u.id as user_id,
         u.name as user_name,
         u.email as user_email,
         ps.permission_level,
         ps.created_at as shared_at
  from plan_shares ps
  join users u on u.id = ps.shared_with_user_id
  where ps.plan_id = p_plan_id
    and (
      exists (
        select 1
        from plans p
        where p.id = p_plan_id
          and p.owner_id = auth.uid()
      )
      or ps.shared_with_user_id = auth.uid()
    )
  order by ps.created_at desc
$function$;


CREATE OR REPLACE FUNCTION public.get_recent_expenses_page(p_user_id uuid, p_limit integer DEFAULT 40, p_offset integer DEFAULT 0, p_search text DEFAULT NULL::text, p_category_id uuid DEFAULT NULL::uuid, p_sort_by text DEFAULT 'date-desc'::text)
 RETURNS TABLE(id uuid, amount numeric, category_id uuid, created_at timestamp with time zone, currency text, expense_date date, name text, original_amount numeric, original_currency text, plan_id uuid, plan_item_id uuid, updated_at timestamp with time zone, user_id uuid, categories jsonb, plans jsonb)
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
  select
    e.id,
    e.amount,
    e.category_id,
    e.created_at,
    e.currency,
    e.expense_date,
    e.name,
    e.original_amount,
    e.original_currency,
    e.plan_id,
    e.plan_item_id,
    e.updated_at,
    e.user_id,
    to_jsonb(c) as categories,
    jsonb_build_object(
      'id', p.id,
      'name', p.name,
      'currency', p.currency
    ) as plans
  from public.expenses e
  join public.categories c on c.id = e.category_id
  join public.plans p on p.id = e.plan_id
  where e.user_id = p_user_id
    and p_user_id = auth.uid()
    and (p_category_id is null or e.category_id = p_category_id)
    and (
      nullif(trim(p_search), '') is null
      or strpos(lower(e.name), lower(trim(p_search))) > 0
      or strpos(lower(c.name), lower(trim(p_search))) > 0
      or strpos(lower(p.name), lower(trim(p_search))) > 0
    )
    and coalesce(p_sort_by, 'date-desc') in (
      'date-desc',
      'date-asc',
      'amount-desc',
      'amount-asc'
    )
  order by
    case when coalesce(p_sort_by, 'date-desc') = 'date-desc' then e.expense_date end desc,
    case when coalesce(p_sort_by, 'date-desc') = 'date-desc' then e.created_at end desc,
    case when coalesce(p_sort_by, 'date-desc') = 'date-desc' then e.id end desc,
    case when p_sort_by = 'date-asc' then e.expense_date end asc,
    case when p_sort_by = 'date-asc' then e.created_at end asc,
    case when p_sort_by = 'date-asc' then e.id end asc,
    case when p_sort_by = 'amount-desc' then e.amount end desc,
    case when p_sort_by = 'amount-desc' then e.expense_date end desc,
    case when p_sort_by = 'amount-desc' then e.created_at end desc,
    case when p_sort_by = 'amount-desc' then e.id end desc,
    case when p_sort_by = 'amount-asc' then e.amount end asc,
    case when p_sort_by = 'amount-asc' then e.expense_date end desc,
    case when p_sort_by = 'amount-asc' then e.created_at end desc,
    case when p_sort_by = 'amount-asc' then e.id end desc
  limit greatest(1, least(coalesce(p_limit, 40), 100))
  offset greatest(0, coalesce(p_offset, 0));
$function$;


CREATE OR REPLACE FUNCTION public.get_template_shared_users(p_template_id uuid)
 RETURNS TABLE(user_id uuid, user_name text, user_email text, permission_level text, shared_at timestamp with time zone)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
  select u.id as user_id,
         u.name as user_name,
         u.email as user_email,
         ts.permission_level,
         ts.created_at as shared_at
  from template_shares ts
  join users u on u.id = ts.shared_with_user_id
  where ts.template_id = p_template_id
    and (
      exists (
        select 1
        from templates t
        where t.id = p_template_id
          and t.owner_id = auth.uid()
      )
      or ts.shared_with_user_id = auth.uid()
    )
  order by ts.created_at desc
$function$;


CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
BEGIN
  INSERT INTO public.users (id, name, email, avatar)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$function$;


CREATE OR REPLACE FUNCTION public.prevent_protected_column_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'auth'
AS $function$
declare
  protected_column text;
begin
  foreach protected_column in array tg_argv loop
    if to_jsonb(new) -> protected_column is distinct from to_jsonb(old) -> protected_column then
      raise exception 'Cannot update protected column %', protected_column using errcode = '42501';
    end if;
  end loop;

  return new;
end;
$function$;


CREATE OR REPLACE FUNCTION public.search_users_for_sharing(entity_type text, entity_id uuid, q text)
 RETURNS TABLE(id uuid, name text, email text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
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

  if entity_type = 'plan' then
    if not exists (
      select 1
      from plans
      where plans.id = entity_id
        and plans.owner_id = actor_id
    ) then
      return;
    end if;

    return query
    select u.id, u.name, u.email
    from users u
    where u.id <> actor_id
      and lower(u.email) like '%' || normalized_query || '%'
      and not exists (
        select 1
        from plan_shares ps
        where ps.plan_id = entity_id
          and ps.shared_with_user_id = u.id
      )
    order by lower(u.email)
    limit 10;
  elsif entity_type = 'template' then
    if not exists (
      select 1
      from templates
      where templates.id = entity_id
        and templates.owner_id = actor_id
    ) then
      return;
    end if;

    return query
    select u.id, u.name, u.email
    from users u
    where u.id <> actor_id
      and lower(u.email) like '%' || normalized_query || '%'
      and not exists (
        select 1
        from template_shares ts
        where ts.template_id = entity_id
          and ts.shared_with_user_id = u.id
      )
    order by lower(u.email)
    limit 10;
  end if;
end;
$function$;


CREATE OR REPLACE FUNCTION public.sync_plan_total()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
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
$function$;


CREATE OR REPLACE FUNCTION public.sync_template_total()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
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
$function$;


CREATE OR REPLACE FUNCTION public.touch_push_subscription_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'auth'
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;


CREATE OR REPLACE FUNCTION public.update_plan_status()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'auth'
AS $function$
begin
  if new.status != 'cancelled' or old.status is null then
    new.status := calculate_plan_status(new.start_date, new.end_date, new.status);
  end if;

  return new;
end;
$function$;


CREATE OR REPLACE FUNCTION public.update_plan_with_items(p_plan_id uuid, p_plan jsonb, p_items jsonb DEFAULT '[]'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  actor_id uuid := auth.uid();
  updated_plan public.plans%rowtype;
  incoming_item_ids uuid[];
  incoming_id_count integer;
  result jsonb;
begin
  if actor_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if jsonb_typeof(coalesce(p_plan, '{}'::jsonb)) <> 'object'
    or jsonb_typeof(coalesce(p_items, '[]'::jsonb)) <> 'array' then
    raise exception 'Invalid plan transaction payload' using errcode = '22023';
  end if;

  perform 1
  from public.plans p
  where p.id = p_plan_id
    and (
      p.owner_id = actor_id
      or exists (
        select 1
        from public.plan_shares ps
        where ps.plan_id = p.id
          and ps.shared_with_user_id = actor_id
          and ps.permission_level = 'edit'
      )
    )
  for update;

  if not found then
    raise exception 'Plan not found or edit permission denied' using errcode = '42501';
  end if;

  select
    coalesce(array_agg(distinct (entry.value->>'id')::uuid), '{}'::uuid[]),
    count(*)
  into incoming_item_ids, incoming_id_count
  from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) entry
  where nullif(entry.value->>'id', '') is not null;

  if incoming_id_count <> cardinality(incoming_item_ids) then
    raise exception 'Duplicate plan item IDs are not allowed' using errcode = '22023';
  end if;

  if (
    select count(*)
    from public.plan_items pi
    where pi.plan_id = p_plan_id
      and pi.id = any(incoming_item_ids)
  ) <> cardinality(incoming_item_ids) then
    raise exception 'A plan item does not belong to the plan' using errcode = '42501';
  end if;

  update public.plans p
  set
    name = case when p_plan ? 'name' then p_plan->>'name' else p.name end,
    start_date = case
      when p_plan ? 'start_date' then (p_plan->>'start_date')::date
      else p.start_date
    end,
    end_date = case
      when p_plan ? 'end_date' then (p_plan->>'end_date')::date
      else p.end_date
    end,
    currency = case when p_plan ? 'currency' then p_plan->>'currency' else p.currency end,
    total = case
      when p_plan ? 'total' then (p_plan->>'total')::numeric
      else p.total
    end,
    status = case when p_plan ? 'status' then p_plan->>'status' else p.status end,
    updated_at = now()
  where p.id = p_plan_id
  returning * into updated_plan;

  update public.plan_items pi
  set
    name = item.name,
    category_id = item.category_id,
    amount = item.amount,
    is_fixed_payment = item.is_fixed_payment,
    updated_at = now()
  from jsonb_to_recordset(coalesce(p_items, '[]'::jsonb)) as item(
    id uuid,
    name text,
    category_id uuid,
    amount numeric,
    is_fixed_payment boolean
  )
  where item.id is not null
    and pi.id = item.id
    and pi.plan_id = p_plan_id;

  delete from public.plan_items pi
  where pi.plan_id = p_plan_id
    and not (pi.id = any(incoming_item_ids));

  insert into public.plan_items (
    plan_id,
    name,
    category_id,
    amount,
    is_fixed_payment
  )
  select
    p_plan_id,
    item.name,
    item.category_id,
    item.amount,
    item.is_fixed_payment
  from jsonb_to_recordset(coalesce(p_items, '[]'::jsonb)) as item(
    id uuid,
    name text,
    category_id uuid,
    amount numeric,
    is_fixed_payment boolean
  )
  where item.id is null;

  select
    to_jsonb(updated_plan)
    || jsonb_build_object(
      'plan_items',
      coalesce(
        (
          select jsonb_agg(to_jsonb(pi) order by pi.created_at, pi.id)
          from public.plan_items pi
          where pi.plan_id = p_plan_id
        ),
        '[]'::jsonb
      )
    )
  into result;

  return result;
end;
$function$;


CREATE OR REPLACE FUNCTION public.update_template_with_items(p_template_id uuid, p_template jsonb, p_items jsonb DEFAULT '[]'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  actor_id uuid := auth.uid();
  updated_template public.templates%rowtype;
  incoming_item_ids uuid[];
  incoming_id_count integer;
  result jsonb;
begin
  if actor_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if jsonb_typeof(coalesce(p_template, '{}'::jsonb)) <> 'object'
    or jsonb_typeof(coalesce(p_items, '[]'::jsonb)) <> 'array' then
    raise exception 'Invalid template transaction payload' using errcode = '22023';
  end if;

  perform 1
  from public.templates t
  where t.id = p_template_id
    and (
      t.owner_id = actor_id
      or exists (
        select 1
        from public.template_shares ts
        where ts.template_id = t.id
          and ts.shared_with_user_id = actor_id
          and ts.permission_level = 'edit'
      )
    )
  for update;

  if not found then
    raise exception 'Template not found or edit permission denied' using errcode = '42501';
  end if;

  select
    coalesce(array_agg(distinct (entry.value->>'id')::uuid), '{}'::uuid[]),
    count(*)
  into incoming_item_ids, incoming_id_count
  from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) entry
  where nullif(entry.value->>'id', '') is not null;

  if incoming_id_count <> cardinality(incoming_item_ids) then
    raise exception 'Duplicate template item IDs are not allowed' using errcode = '22023';
  end if;

  if (
    select count(*)
    from public.template_items ti
    where ti.template_id = p_template_id
      and ti.id = any(incoming_item_ids)
  ) <> cardinality(incoming_item_ids) then
    raise exception 'A template item does not belong to the template' using errcode = '42501';
  end if;

  update public.templates t
  set
    name = case when p_template ? 'name' then p_template->>'name' else t.name end,
    duration = case
      when p_template ? 'duration' then p_template->>'duration'
      else t.duration
    end,
    currency = case
      when p_template ? 'currency' then p_template->>'currency'
      else t.currency
    end,
    updated_at = now()
  where t.id = p_template_id
  returning * into updated_template;

  update public.template_items ti
  set
    name = item.name,
    category_id = item.category_id,
    amount = item.amount,
    is_fixed_payment = item.is_fixed_payment,
    updated_at = now()
  from jsonb_to_recordset(coalesce(p_items, '[]'::jsonb)) as item(
    id uuid,
    name text,
    category_id uuid,
    amount numeric,
    is_fixed_payment boolean
  )
  where item.id is not null
    and ti.id = item.id
    and ti.template_id = p_template_id;

  delete from public.template_items ti
  where ti.template_id = p_template_id
    and not (ti.id = any(incoming_item_ids));

  insert into public.template_items (
    template_id,
    name,
    category_id,
    amount,
    is_fixed_payment
  )
  select
    p_template_id,
    item.name,
    item.category_id,
    item.amount,
    item.is_fixed_payment
  from jsonb_to_recordset(coalesce(p_items, '[]'::jsonb)) as item(
    id uuid,
    name text,
    category_id uuid,
    amount numeric,
    is_fixed_payment boolean
  )
  where item.id is null;

  select
    to_jsonb(t)
    || jsonb_build_object(
      'template_items',
      coalesce(
        (
          select jsonb_agg(to_jsonb(ti) order by ti.created_at, ti.id)
          from public.template_items ti
          where ti.template_id = p_template_id
        ),
        '[]'::jsonb
      )
    )
  into result
  from public.templates t
  where t.id = p_template_id;

  return result;
end;
$function$;


CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'auth'
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;


CREATE TRIGGER update_expense_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER protect_expense_user_id BEFORE UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION prevent_protected_column_changes('id', 'user_id', 'created_at');
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER sync_plan_total_after_item_write AFTER INSERT OR DELETE OR UPDATE OF amount, plan_id ON public.plan_items FOR EACH ROW EXECUTE FUNCTION sync_plan_total();
CREATE TRIGGER update_plan_items_updated_at BEFORE UPDATE ON public.plan_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER protect_plan_ownership BEFORE UPDATE ON public.plans FOR EACH ROW EXECUTE FUNCTION prevent_protected_column_changes('id', 'owner_id', 'created_at');
CREATE TRIGGER trigger_plan_status_insert BEFORE INSERT ON public.plans FOR EACH ROW EXECUTE FUNCTION update_plan_status();
CREATE TRIGGER trigger_plan_status_update BEFORE UPDATE ON public.plans FOR EACH ROW EXECUTE FUNCTION update_plan_status();
CREATE TRIGGER update_plans_updated_at BEFORE UPDATE ON public.plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER protect_push_subscription_user_id BEFORE UPDATE ON public.push_subscriptions FOR EACH ROW EXECUTE FUNCTION prevent_protected_column_changes('id', 'user_id', 'created_at');
CREATE TRIGGER touch_push_subscription_updated_at BEFORE UPDATE ON public.push_subscriptions FOR EACH ROW EXECUTE FUNCTION touch_push_subscription_updated_at();
CREATE TRIGGER sync_template_total_after_item_write AFTER INSERT OR DELETE OR UPDATE OF amount, template_id ON public.template_items FOR EACH ROW EXECUTE FUNCTION sync_template_total();
CREATE TRIGGER update_expense_template_items_updated_at BEFORE UPDATE ON public.template_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER protect_template_ownership BEFORE UPDATE ON public.templates FOR EACH ROW EXECUTE FUNCTION prevent_protected_column_changes('id', 'owner_id', 'created_at');
CREATE TRIGGER update_expense_templates_updated_at BEFORE UPDATE ON public.templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX expenses_plan_category_recent_idx ON public.expenses USING btree (plan_id, category_id, expense_date DESC, created_at DESC, id DESC);
CREATE INDEX expenses_plan_item_idx ON public.expenses USING btree (plan_id, plan_item_id) WHERE (plan_item_id IS NOT NULL);
CREATE INDEX expenses_plan_recent_idx ON public.expenses USING btree (plan_id, expense_date DESC, created_at DESC, id DESC);
CREATE INDEX expenses_user_amount_idx ON public.expenses USING btree (user_id, amount, expense_date DESC, created_at DESC, id DESC);
CREATE INDEX expenses_user_category_recent_idx ON public.expenses USING btree (user_id, category_id, expense_date DESC, created_at DESC, id DESC);
CREATE INDEX expenses_plan_item_context_idx ON public.expenses USING btree (plan_item_id, plan_id, category_id);
CREATE INDEX expenses_user_recent_idx ON public.expenses USING btree (user_id, expense_date DESC, created_at DESC, id DESC);
CREATE INDEX idx_expenses_category_id ON public.expenses USING btree (category_id);
CREATE INDEX idx_expenses_date ON public.expenses USING btree (expense_date);
CREATE INDEX idx_expenses_plan_id ON public.expenses USING btree (plan_id);
CREATE INDEX idx_expenses_plan_item_id ON public.expenses USING btree (plan_item_id);
CREATE INDEX idx_expenses_user_id ON public.expenses USING btree (user_id);
CREATE INDEX notification_outbox_pending_idx ON public.notification_outbox USING btree (status, available_at, created_at) WHERE (status = ANY (ARRAY['pending'::text, 'failed'::text]));
CREATE INDEX notification_outbox_actor_user_id_idx ON public.notification_outbox USING btree (actor_user_id);
CREATE INDEX notifications_actor_user_id_idx ON public.notifications USING btree (actor_user_id);
CREATE INDEX notifications_user_created_at_idx ON public.notifications USING btree (user_id, created_at DESC);
CREATE INDEX notifications_user_unread_idx ON public.notifications USING btree (user_id, created_at DESC) WHERE ((read_at IS NULL) AND (deleted_at IS NULL));
CREATE INDEX idx_plan_items_category_id ON public.plan_items USING btree (category_id);
CREATE INDEX idx_plan_items_is_fixed_payment ON public.plan_items USING btree (plan_id, is_fixed_payment);
CREATE INDEX idx_plan_items_plan_id ON public.plan_items USING btree (plan_id);
CREATE INDEX idx_plan_shares_plan_id ON public.plan_shares USING btree (plan_id);
CREATE INDEX idx_plan_shares_shared_by_user_id ON public.plan_shares USING btree (shared_by_user_id);
CREATE INDEX idx_plan_shares_shared_with_user_id ON public.plan_shares USING btree (shared_with_user_id);
CREATE INDEX idx_plans_template_id ON public.plans USING btree (template_id);
CREATE INDEX push_subscriptions_user_active_idx ON public.push_subscriptions USING btree (user_id, updated_at DESC) WHERE (revoked_at IS NULL);
CREATE INDEX idx_expense_template_items_category_id ON public.template_items USING btree (category_id);
CREATE INDEX idx_expense_template_items_template_id ON public.template_items USING btree (template_id);
CREATE INDEX idx_template_shares_shared_by_user_id ON public.template_shares USING btree (shared_by_user_id);
CREATE INDEX idx_template_shares_shared_with_user_id ON public.template_shares USING btree (shared_with_user_id);
CREATE INDEX idx_template_shares_template_id ON public.template_shares USING btree (template_id);
CREATE INDEX idx_expense_templates_owner_id ON public.templates USING btree (owner_id);

alter table public.categories enable row level security;
alter table public.expenses enable row level security;
alter table public.notification_outbox enable row level security;
alter table public.notifications enable row level security;
alter table public.plan_items enable row level security;
alter table public.plan_shares enable row level security;
alter table public.plans enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.template_items enable row level security;
alter table public.template_shares enable row level security;
alter table public.templates enable row level security;
alter table public.users enable row level security;

create policy categories_select_authenticated on public.categories as PERMISSIVE for SELECT to authenticated
using (true);

create policy expenses_delete_editable on public.expenses as PERMISSIVE for DELETE to authenticated
using (private.can_edit_plan(plan_id));

create policy expenses_insert_editable on public.expenses as PERMISSIVE for INSERT to authenticated
with check (((user_id = ( SELECT auth.uid() AS uid)) AND private.can_edit_plan(plan_id)));

create policy expenses_select_accessible on public.expenses as PERMISSIVE for SELECT to authenticated
using (private.can_access_plan(plan_id));

create policy expenses_update_editable on public.expenses as PERMISSIVE for UPDATE to authenticated
using (private.can_edit_plan(plan_id))
with check (((user_id = ( SELECT auth.uid() AS uid)) AND private.can_edit_plan(plan_id)));

create policy notifications_select_own on public.notifications as PERMISSIVE for SELECT to authenticated
using ((( SELECT auth.uid() AS uid) = user_id));

create policy notifications_update_own on public.notifications as PERMISSIVE for UPDATE to authenticated
using (((( SELECT auth.uid() AS uid) = user_id) AND (deleted_at IS NULL)))
with check ((( SELECT auth.uid() AS uid) = user_id));

create policy plan_items_delete_editable on public.plan_items as PERMISSIVE for DELETE to authenticated
using (private.can_edit_plan(plan_id));

create policy plan_items_insert_editable on public.plan_items as PERMISSIVE for INSERT to authenticated
with check (private.can_edit_plan(plan_id));

create policy plan_items_select_accessible on public.plan_items as PERMISSIVE for SELECT to authenticated
using (private.can_access_plan(plan_id));

create policy plan_items_update_editable on public.plan_items as PERMISSIVE for UPDATE to authenticated
using (private.can_edit_plan(plan_id))
with check (private.can_edit_plan(plan_id));

create policy plan_shares_delete_owned on public.plan_shares as PERMISSIVE for DELETE to authenticated
using (private.is_plan_owner(plan_id));

create policy plan_shares_insert_owned on public.plan_shares as PERMISSIVE for INSERT to authenticated
with check (((shared_by_user_id = ( SELECT auth.uid() AS uid)) AND private.is_plan_owner(plan_id)));

create policy plan_shares_select_involved on public.plan_shares as PERMISSIVE for SELECT to authenticated
using (((shared_by_user_id = ( SELECT auth.uid() AS uid)) OR (shared_with_user_id = ( SELECT auth.uid() AS uid))));

create policy plan_shares_update_owned on public.plan_shares as PERMISSIVE for UPDATE to authenticated
using (private.is_plan_owner(plan_id))
with check (((shared_by_user_id = ( SELECT auth.uid() AS uid)) AND private.is_plan_owner(plan_id)));

create policy plans_delete_owned on public.plans as PERMISSIVE for DELETE to authenticated
using (private.is_plan_owner(id));

create policy plans_insert_owned on public.plans as PERMISSIVE for INSERT to authenticated
with check ((( SELECT auth.uid() AS uid) = owner_id));

create policy plans_select_accessible on public.plans as PERMISSIVE for SELECT to authenticated
using (private.can_access_plan(id));

create policy plans_update_editable on public.plans as PERMISSIVE for UPDATE to authenticated
using (private.can_edit_plan(id))
with check (private.can_edit_plan(id));

create policy push_subscriptions_delete_own on public.push_subscriptions as PERMISSIVE for DELETE to authenticated
using ((( SELECT auth.uid() AS uid) = user_id));

create policy push_subscriptions_insert_own on public.push_subscriptions as PERMISSIVE for INSERT to authenticated
with check ((( SELECT auth.uid() AS uid) = user_id));

create policy push_subscriptions_select_own on public.push_subscriptions as PERMISSIVE for SELECT to authenticated
using ((( SELECT auth.uid() AS uid) = user_id));

create policy push_subscriptions_update_own on public.push_subscriptions as PERMISSIVE for UPDATE to authenticated
using ((( SELECT auth.uid() AS uid) = user_id))
with check ((( SELECT auth.uid() AS uid) = user_id));

create policy template_items_delete_editable on public.template_items as PERMISSIVE for DELETE to authenticated
using (private.can_edit_template(template_id));

create policy template_items_insert_editable on public.template_items as PERMISSIVE for INSERT to authenticated
with check (private.can_edit_template(template_id));

create policy template_items_select_accessible on public.template_items as PERMISSIVE for SELECT to authenticated
using (private.can_access_template(template_id));

create policy template_items_update_editable on public.template_items as PERMISSIVE for UPDATE to authenticated
using (private.can_edit_template(template_id))
with check (private.can_edit_template(template_id));

create policy template_shares_delete_owned on public.template_shares as PERMISSIVE for DELETE to authenticated
using (private.is_template_owner(template_id));

create policy template_shares_insert_owned on public.template_shares as PERMISSIVE for INSERT to authenticated
with check (((shared_by_user_id = ( SELECT auth.uid() AS uid)) AND private.is_template_owner(template_id)));

create policy template_shares_select_involved on public.template_shares as PERMISSIVE for SELECT to authenticated
using (((shared_by_user_id = ( SELECT auth.uid() AS uid)) OR (shared_with_user_id = ( SELECT auth.uid() AS uid))));

create policy template_shares_update_owned on public.template_shares as PERMISSIVE for UPDATE to authenticated
using (private.is_template_owner(template_id))
with check (((shared_by_user_id = ( SELECT auth.uid() AS uid)) AND private.is_template_owner(template_id)));

create policy templates_delete_owned on public.templates as PERMISSIVE for DELETE to authenticated
using (private.is_template_owner(id));

create policy templates_insert_owned on public.templates as PERMISSIVE for INSERT to authenticated
with check ((( SELECT auth.uid() AS uid) = owner_id));

create policy templates_select_accessible on public.templates as PERMISSIVE for SELECT to authenticated
using (private.can_access_template(id));

create policy templates_update_editable on public.templates as PERMISSIVE for UPDATE to authenticated
using (private.can_edit_template(id))
with check (private.can_edit_template(id));

create policy users_insert_own on public.users as PERMISSIVE for INSERT to authenticated
with check ((( SELECT auth.uid() AS uid) = id));

create policy users_select_own on public.users as PERMISSIVE for SELECT to authenticated
using ((( SELECT auth.uid() AS uid) = id));

create policy users_update_own on public.users as PERMISSIVE for UPDATE to authenticated
using ((( SELECT auth.uid() AS uid) = id))
with check ((( SELECT auth.uid() AS uid) = id));

revoke all on all tables in schema public from anon;

grant DELETE on table public.categories to authenticated;
grant INSERT on table public.categories to authenticated;
grant REFERENCES on table public.categories to authenticated;
grant SELECT on table public.categories to authenticated;
grant TRIGGER on table public.categories to authenticated;
grant TRUNCATE on table public.categories to authenticated;
grant UPDATE on table public.categories to authenticated;
grant DELETE on table public.categories to service_role;
grant INSERT on table public.categories to service_role;
grant REFERENCES on table public.categories to service_role;
grant SELECT on table public.categories to service_role;
grant TRIGGER on table public.categories to service_role;
grant TRUNCATE on table public.categories to service_role;
grant UPDATE on table public.categories to service_role;
grant DELETE on table public.expenses to authenticated;
grant INSERT on table public.expenses to authenticated;
grant REFERENCES on table public.expenses to authenticated;
grant SELECT on table public.expenses to authenticated;
grant TRIGGER on table public.expenses to authenticated;
grant TRUNCATE on table public.expenses to authenticated;
grant UPDATE on table public.expenses to authenticated;
grant DELETE on table public.expenses to service_role;
grant INSERT on table public.expenses to service_role;
grant REFERENCES on table public.expenses to service_role;
grant SELECT on table public.expenses to service_role;
grant TRIGGER on table public.expenses to service_role;
grant TRUNCATE on table public.expenses to service_role;
grant UPDATE on table public.expenses to service_role;
grant DELETE on table public.notification_outbox to service_role;
grant INSERT on table public.notification_outbox to service_role;
grant REFERENCES on table public.notification_outbox to service_role;
grant SELECT on table public.notification_outbox to service_role;
grant TRIGGER on table public.notification_outbox to service_role;
grant TRUNCATE on table public.notification_outbox to service_role;
grant UPDATE on table public.notification_outbox to service_role;
grant DELETE on table public.notifications to authenticated;
grant INSERT on table public.notifications to authenticated;
grant REFERENCES on table public.notifications to authenticated;
grant SELECT on table public.notifications to authenticated;
grant TRIGGER on table public.notifications to authenticated;
grant TRUNCATE on table public.notifications to authenticated;
grant UPDATE on table public.notifications to authenticated;
grant DELETE on table public.notifications to service_role;
grant INSERT on table public.notifications to service_role;
grant REFERENCES on table public.notifications to service_role;
grant SELECT on table public.notifications to service_role;
grant TRIGGER on table public.notifications to service_role;
grant TRUNCATE on table public.notifications to service_role;
grant UPDATE on table public.notifications to service_role;
grant DELETE on table public.plan_items to authenticated;
grant INSERT on table public.plan_items to authenticated;
grant REFERENCES on table public.plan_items to authenticated;
grant SELECT on table public.plan_items to authenticated;
grant TRIGGER on table public.plan_items to authenticated;
grant TRUNCATE on table public.plan_items to authenticated;
grant UPDATE on table public.plan_items to authenticated;
grant DELETE on table public.plan_items to service_role;
grant INSERT on table public.plan_items to service_role;
grant REFERENCES on table public.plan_items to service_role;
grant SELECT on table public.plan_items to service_role;
grant TRIGGER on table public.plan_items to service_role;
grant TRUNCATE on table public.plan_items to service_role;
grant UPDATE on table public.plan_items to service_role;
grant DELETE on table public.plan_shares to authenticated;
grant INSERT on table public.plan_shares to authenticated;
grant REFERENCES on table public.plan_shares to authenticated;
grant SELECT on table public.plan_shares to authenticated;
grant TRIGGER on table public.plan_shares to authenticated;
grant TRUNCATE on table public.plan_shares to authenticated;
grant UPDATE on table public.plan_shares to authenticated;
grant DELETE on table public.plan_shares to service_role;
grant INSERT on table public.plan_shares to service_role;
grant REFERENCES on table public.plan_shares to service_role;
grant SELECT on table public.plan_shares to service_role;
grant TRIGGER on table public.plan_shares to service_role;
grant TRUNCATE on table public.plan_shares to service_role;
grant UPDATE on table public.plan_shares to service_role;
grant DELETE on table public.plans to authenticated;
grant INSERT on table public.plans to authenticated;
grant REFERENCES on table public.plans to authenticated;
grant SELECT on table public.plans to authenticated;
grant TRIGGER on table public.plans to authenticated;
grant TRUNCATE on table public.plans to authenticated;
grant UPDATE on table public.plans to authenticated;
grant DELETE on table public.plans to service_role;
grant INSERT on table public.plans to service_role;
grant REFERENCES on table public.plans to service_role;
grant SELECT on table public.plans to service_role;
grant TRIGGER on table public.plans to service_role;
grant TRUNCATE on table public.plans to service_role;
grant UPDATE on table public.plans to service_role;
grant DELETE on table public.push_subscriptions to authenticated;
grant INSERT on table public.push_subscriptions to authenticated;
grant REFERENCES on table public.push_subscriptions to authenticated;
grant SELECT on table public.push_subscriptions to authenticated;
grant TRIGGER on table public.push_subscriptions to authenticated;
grant TRUNCATE on table public.push_subscriptions to authenticated;
grant UPDATE on table public.push_subscriptions to authenticated;
grant DELETE on table public.push_subscriptions to service_role;
grant INSERT on table public.push_subscriptions to service_role;
grant REFERENCES on table public.push_subscriptions to service_role;
grant SELECT on table public.push_subscriptions to service_role;
grant TRIGGER on table public.push_subscriptions to service_role;
grant TRUNCATE on table public.push_subscriptions to service_role;
grant UPDATE on table public.push_subscriptions to service_role;
grant DELETE on table public.template_items to authenticated;
grant INSERT on table public.template_items to authenticated;
grant REFERENCES on table public.template_items to authenticated;
grant SELECT on table public.template_items to authenticated;
grant TRIGGER on table public.template_items to authenticated;
grant TRUNCATE on table public.template_items to authenticated;
grant UPDATE on table public.template_items to authenticated;
grant DELETE on table public.template_items to service_role;
grant INSERT on table public.template_items to service_role;
grant REFERENCES on table public.template_items to service_role;
grant SELECT on table public.template_items to service_role;
grant TRIGGER on table public.template_items to service_role;
grant TRUNCATE on table public.template_items to service_role;
grant UPDATE on table public.template_items to service_role;
grant DELETE on table public.template_shares to authenticated;
grant INSERT on table public.template_shares to authenticated;
grant REFERENCES on table public.template_shares to authenticated;
grant SELECT on table public.template_shares to authenticated;
grant TRIGGER on table public.template_shares to authenticated;
grant TRUNCATE on table public.template_shares to authenticated;
grant UPDATE on table public.template_shares to authenticated;
grant DELETE on table public.template_shares to service_role;
grant INSERT on table public.template_shares to service_role;
grant REFERENCES on table public.template_shares to service_role;
grant SELECT on table public.template_shares to service_role;
grant TRIGGER on table public.template_shares to service_role;
grant TRUNCATE on table public.template_shares to service_role;
grant UPDATE on table public.template_shares to service_role;
grant DELETE on table public.templates to authenticated;
grant INSERT on table public.templates to authenticated;
grant REFERENCES on table public.templates to authenticated;
grant SELECT on table public.templates to authenticated;
grant TRIGGER on table public.templates to authenticated;
grant TRUNCATE on table public.templates to authenticated;
grant UPDATE on table public.templates to authenticated;
grant DELETE on table public.templates to service_role;
grant INSERT on table public.templates to service_role;
grant REFERENCES on table public.templates to service_role;
grant SELECT on table public.templates to service_role;
grant TRIGGER on table public.templates to service_role;
grant TRUNCATE on table public.templates to service_role;
grant UPDATE on table public.templates to service_role;
grant DELETE on table public.users to authenticated;
grant INSERT on table public.users to authenticated;
grant REFERENCES on table public.users to authenticated;
grant SELECT on table public.users to authenticated;
grant TRIGGER on table public.users to authenticated;
grant TRUNCATE on table public.users to authenticated;
grant UPDATE on table public.users to authenticated;
grant DELETE on table public.users to service_role;
grant INSERT on table public.users to service_role;
grant REFERENCES on table public.users to service_role;
grant SELECT on table public.users to service_role;
grant TRIGGER on table public.users to service_role;
grant TRUNCATE on table public.users to service_role;
grant UPDATE on table public.users to service_role;

revoke all on function private.can_access_plan(target_plan_id uuid) from public, anon, authenticated;
revoke all on function private.can_access_template(target_template_id uuid) from public, anon, authenticated;
revoke all on function private.can_edit_plan(target_plan_id uuid) from public, anon, authenticated;
revoke all on function private.can_edit_template(target_template_id uuid) from public, anon, authenticated;
revoke all on function private.enqueue_notification_event(event_type text, entity_type text, entity_id uuid, payload jsonb, recipient_ids uuid[]) from public, anon, authenticated;
revoke all on function private.is_plan_owner(target_plan_id uuid) from public, anon, authenticated;
revoke all on function private.is_template_owner(target_template_id uuid) from public, anon, authenticated;
revoke all on function public.calculate_plan_status(p_start_date date, p_end_date date, p_current_status text) from public, anon, authenticated;
revoke all on function public.create_expense_transaction(p_expense jsonb, p_complete_plan_item boolean) from public, anon, authenticated;
revoke all on function public.create_expenses_transaction(p_expenses jsonb, p_complete_plan_items boolean) from public, anon, authenticated;
revoke all on function public.create_plan_with_items(p_plan jsonb, p_items jsonb) from public, anon, authenticated;
revoke all on function public.create_template_with_items(p_template jsonb, p_items jsonb) from public, anon, authenticated;
revoke all on function public.delete_expenses_and_reconcile(p_expense_ids uuid[]) from public, anon, authenticated;
revoke all on function public.delete_plan_transaction(p_plan_id uuid) from public, anon, authenticated;
revoke all on function public.delete_template_transaction(p_template_id uuid) from public, anon, authenticated;
revoke all on function public.get_plan_expense_summary(p_plan_id uuid) from public, anon, authenticated;
revoke all on function public.get_plan_items_with_tracking(p_plan_id uuid) from public, anon, authenticated;
revoke all on function public.get_plan_items_with_tracking_by_category(p_plan_id uuid, p_category_id uuid) from public, anon, authenticated;
revoke all on function public.get_plan_overview_snapshots(p_plan_ids uuid[]) from public, anon, authenticated;
revoke all on function public.get_plan_shared_users(p_plan_id uuid) from public, anon, authenticated;
revoke all on function public.get_recent_expenses_page(p_user_id uuid, p_limit integer, p_offset integer, p_search text, p_category_id uuid, p_sort_by text) from public, anon, authenticated;
revoke all on function public.get_template_shared_users(p_template_id uuid) from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.prevent_protected_column_changes() from public, anon, authenticated;
revoke all on function public.search_users_for_sharing(entity_type text, entity_id uuid, q text) from public, anon, authenticated;
revoke all on function public.sync_plan_total() from public, anon, authenticated;
revoke all on function public.sync_template_total() from public, anon, authenticated;
revoke all on function public.touch_push_subscription_updated_at() from public, anon, authenticated;
revoke all on function public.update_plan_status() from public, anon, authenticated;
revoke all on function public.update_plan_with_items(p_plan_id uuid, p_plan jsonb, p_items jsonb) from public, anon, authenticated;
revoke all on function public.update_template_with_items(p_template_id uuid, p_template jsonb, p_items jsonb) from public, anon, authenticated;
revoke all on function public.update_updated_at_column() from public, anon, authenticated;

grant execute on function private.can_access_plan(target_plan_id uuid) to authenticated;
grant execute on function private.can_access_plan(target_plan_id uuid) to service_role;
grant execute on function private.can_access_template(target_template_id uuid) to authenticated;
grant execute on function private.can_access_template(target_template_id uuid) to service_role;
grant execute on function private.can_edit_plan(target_plan_id uuid) to authenticated;
grant execute on function private.can_edit_plan(target_plan_id uuid) to service_role;
grant execute on function private.can_edit_template(target_template_id uuid) to authenticated;
grant execute on function private.can_edit_template(target_template_id uuid) to service_role;
grant execute on function private.enqueue_notification_event(event_type text, entity_type text, entity_id uuid, payload jsonb, recipient_ids uuid[]) to authenticated;
grant execute on function private.enqueue_notification_event(event_type text, entity_type text, entity_id uuid, payload jsonb, recipient_ids uuid[]) to service_role;
grant execute on function private.is_plan_owner(target_plan_id uuid) to authenticated;
grant execute on function private.is_plan_owner(target_plan_id uuid) to service_role;
grant execute on function private.is_template_owner(target_template_id uuid) to authenticated;
grant execute on function private.is_template_owner(target_template_id uuid) to service_role;
grant execute on function public.calculate_plan_status(p_start_date date, p_end_date date, p_current_status text) to authenticated;
grant execute on function public.calculate_plan_status(p_start_date date, p_end_date date, p_current_status text) to service_role;
grant execute on function public.create_expense_transaction(p_expense jsonb, p_complete_plan_item boolean) to authenticated;
grant execute on function public.create_expense_transaction(p_expense jsonb, p_complete_plan_item boolean) to service_role;
grant execute on function public.create_expenses_transaction(p_expenses jsonb, p_complete_plan_items boolean) to authenticated;
grant execute on function public.create_expenses_transaction(p_expenses jsonb, p_complete_plan_items boolean) to service_role;
grant execute on function public.create_plan_with_items(p_plan jsonb, p_items jsonb) to authenticated;
grant execute on function public.create_plan_with_items(p_plan jsonb, p_items jsonb) to service_role;
grant execute on function public.create_template_with_items(p_template jsonb, p_items jsonb) to authenticated;
grant execute on function public.create_template_with_items(p_template jsonb, p_items jsonb) to service_role;
grant execute on function public.delete_expenses_and_reconcile(p_expense_ids uuid[]) to authenticated;
grant execute on function public.delete_expenses_and_reconcile(p_expense_ids uuid[]) to service_role;
grant execute on function public.delete_plan_transaction(p_plan_id uuid) to authenticated;
grant execute on function public.delete_plan_transaction(p_plan_id uuid) to service_role;
grant execute on function public.delete_template_transaction(p_template_id uuid) to authenticated;
grant execute on function public.delete_template_transaction(p_template_id uuid) to service_role;
grant execute on function public.get_plan_expense_summary(p_plan_id uuid) to authenticated;
grant execute on function public.get_plan_expense_summary(p_plan_id uuid) to service_role;
grant execute on function public.get_plan_items_with_tracking(p_plan_id uuid) to authenticated;
grant execute on function public.get_plan_items_with_tracking(p_plan_id uuid) to service_role;
grant execute on function public.get_plan_items_with_tracking_by_category(p_plan_id uuid, p_category_id uuid) to authenticated;
grant execute on function public.get_plan_items_with_tracking_by_category(p_plan_id uuid, p_category_id uuid) to service_role;
grant execute on function public.get_plan_overview_snapshots(p_plan_ids uuid[]) to authenticated;
grant execute on function public.get_plan_overview_snapshots(p_plan_ids uuid[]) to service_role;
grant execute on function public.get_plan_shared_users(p_plan_id uuid) to authenticated;
grant execute on function public.get_plan_shared_users(p_plan_id uuid) to service_role;
grant execute on function public.get_recent_expenses_page(p_user_id uuid, p_limit integer, p_offset integer, p_search text, p_category_id uuid, p_sort_by text) to authenticated;
grant execute on function public.get_recent_expenses_page(p_user_id uuid, p_limit integer, p_offset integer, p_search text, p_category_id uuid, p_sort_by text) to service_role;
grant execute on function public.get_template_shared_users(p_template_id uuid) to authenticated;
grant execute on function public.get_template_shared_users(p_template_id uuid) to service_role;
grant execute on function public.handle_new_user() to service_role;
grant execute on function public.prevent_protected_column_changes() to authenticated;
grant execute on function public.prevent_protected_column_changes() to service_role;
grant execute on function public.search_users_for_sharing(entity_type text, entity_id uuid, q text) to authenticated;
grant execute on function public.search_users_for_sharing(entity_type text, entity_id uuid, q text) to service_role;
grant execute on function public.sync_plan_total() to authenticated;
grant execute on function public.sync_plan_total() to service_role;
grant execute on function public.sync_template_total() to authenticated;
grant execute on function public.sync_template_total() to service_role;
grant execute on function public.touch_push_subscription_updated_at() to authenticated;
grant execute on function public.touch_push_subscription_updated_at() to service_role;
grant execute on function public.update_plan_status() to authenticated;
grant execute on function public.update_plan_status() to service_role;
grant execute on function public.update_plan_with_items(p_plan_id uuid, p_plan jsonb, p_items jsonb) to authenticated;
grant execute on function public.update_plan_with_items(p_plan_id uuid, p_plan jsonb, p_items jsonb) to service_role;
grant execute on function public.update_template_with_items(p_template_id uuid, p_template jsonb, p_items jsonb) to authenticated;
grant execute on function public.update_template_with_items(p_template_id uuid, p_template jsonb, p_items jsonb) to service_role;
grant execute on function public.update_updated_at_column() to authenticated;
grant execute on function public.update_updated_at_column() to service_role;

grant usage on schema private to authenticated, service_role;

insert into public.categories (id,name,color,icon,created_at,updated_at) values ('6624800c-e036-47a2-8a1f-5ac17bdeb7a4','Childcare','#fde047','eva-people-outline','2025-08-12 15:39:31.773823+00','2026-02-20 15:07:25.942239+00') on conflict (id) do update set name=excluded.name,color=excluded.color,icon=excluded.icon,updated_at=excluded.updated_at;
insert into public.categories (id,name,color,icon,created_at,updated_at) values ('2c3ffda0-b388-4d15-abbf-3c5c20d44338','Clothing & Accessories','#8b5cf6','eva-shopping-bag-outline','2025-08-12 15:39:31.773823+00','2026-02-20 15:07:25.942239+00') on conflict (id) do update set name=excluded.name,color=excluded.color,icon=excluded.icon,updated_at=excluded.updated_at;
insert into public.categories (id,name,color,icon,created_at,updated_at) values ('2b9d27a9-d719-45e5-9e5e-15722ee0321a','Debt Payments','#7f1d1d','eva-credit-card-outline','2025-08-12 15:39:31.773823+00','2026-02-20 15:07:25.942239+00') on conflict (id) do update set name=excluded.name,color=excluded.color,icon=excluded.icon,updated_at=excluded.updated_at;
insert into public.categories (id,name,color,icon,created_at,updated_at) values ('3d9affcd-6752-41a3-a7d7-c1ed9055631e','Education','#f59e0b','eva-book-outline','2025-08-12 15:39:31.773823+00','2026-02-20 15:07:25.942239+00') on conflict (id) do update set name=excluded.name,color=excluded.color,icon=excluded.icon,updated_at=excluded.updated_at;
insert into public.categories (id,name,color,icon,created_at,updated_at) values ('8e679ab7-55de-4773-aaca-04d998cd110d','Entertainment','#e879f9','eva-tv-outline','2025-08-12 15:39:31.773823+00','2026-02-20 15:07:25.942239+00') on conflict (id) do update set name=excluded.name,color=excluded.color,icon=excluded.icon,updated_at=excluded.updated_at;
insert into public.categories (id,name,color,icon,created_at,updated_at) values ('c700b921-8125-4479-bfb3-eecccf087001','Fees & Bank Charges','#6b7280','eva-file-text-outline','2025-08-12 15:39:31.773823+00','2026-02-20 15:07:25.942239+00') on conflict (id) do update set name=excluded.name,color=excluded.color,icon=excluded.icon,updated_at=excluded.updated_at;
insert into public.categories (id,name,color,icon,created_at,updated_at) values ('2e4da633-a7bb-4f02-ae99-842fd3cbd254','Fitness & Sports','#84cc16','eva-activity-outline','2025-08-12 15:39:31.773823+00','2026-02-20 15:07:25.942239+00') on conflict (id) do update set name=excluded.name,color=excluded.color,icon=excluded.icon,updated_at=excluded.updated_at;
insert into public.categories (id,name,color,icon,created_at,updated_at) values ('9663c961-dd1c-41be-a56e-3fb04fee067f','Gifts & Donations','#fb7185','eva-gift-outline','2025-08-12 15:39:31.773823+00','2026-02-20 15:07:25.942239+00') on conflict (id) do update set name=excluded.name,color=excluded.color,icon=excluded.icon,updated_at=excluded.updated_at;
insert into public.categories (id,name,color,icon,created_at,updated_at) values ('2595c5b0-c4bf-4cbf-8b5e-b9841a8c4682','Groceries','#22c55e','eva-shopping-cart-outline','2025-08-12 15:39:31.773823+00','2026-02-20 15:07:25.942239+00') on conflict (id) do update set name=excluded.name,color=excluded.color,icon=excluded.icon,updated_at=excluded.updated_at;
insert into public.categories (id,name,color,icon,created_at,updated_at) values ('ffbf4f6d-e13e-42c1-a23c-c4e61e6b4682','Health & Medical','#ef4444','eva-heart-outline','2025-08-12 15:39:31.773823+00','2026-02-20 15:07:25.942239+00') on conflict (id) do update set name=excluded.name,color=excluded.color,icon=excluded.icon,updated_at=excluded.updated_at;
insert into public.categories (id,name,color,icon,created_at,updated_at) values ('0cf872c3-e1d2-40d3-afe1-e03aded34885','Hobbies & Leisure','#a855f7','eva-color-palette-outline','2025-08-12 15:39:31.773823+00','2026-02-20 15:07:25.942239+00') on conflict (id) do update set name=excluded.name,color=excluded.color,icon=excluded.icon,updated_at=excluded.updated_at;
insert into public.categories (id,name,color,icon,created_at,updated_at) values ('41b38558-17c9-4006-93b9-5e781a8e49e3','Home Maintenance','#b45309','eva-home-outline','2025-08-12 15:39:31.773823+00','2026-02-20 15:07:25.942239+00') on conflict (id) do update set name=excluded.name,color=excluded.color,icon=excluded.icon,updated_at=excluded.updated_at;
insert into public.categories (id,name,color,icon,created_at,updated_at) values ('0a91c3f2-cc77-4331-b014-4b56e23bf9d7','Household Supplies','#9ca3af','eva-cube-outline','2025-08-12 15:39:31.773823+00','2026-02-20 15:07:25.942239+00') on conflict (id) do update set name=excluded.name,color=excluded.color,icon=excluded.icon,updated_at=excluded.updated_at;
insert into public.categories (id,name,color,icon,created_at,updated_at) values ('d7711b9a-c256-42cc-ba47-3344084d4d3f','Insurance','#0f766e','eva-shield-outline','2025-08-12 15:39:31.773823+00','2026-02-20 15:07:25.942239+00') on conflict (id) do update set name=excluded.name,color=excluded.color,icon=excluded.icon,updated_at=excluded.updated_at;
insert into public.categories (id,name,color,icon,created_at,updated_at) values ('38745b56-b795-4216-8ef5-018df08d5be6','Internet & Mobile','#0284c7','eva-smartphone-outline','2025-08-12 15:39:31.773823+00','2026-02-20 15:07:25.942239+00') on conflict (id) do update set name=excluded.name,color=excluded.color,icon=excluded.icon,updated_at=excluded.updated_at;
insert into public.categories (id,name,color,icon,created_at,updated_at) values ('25288d0d-a975-4322-86b3-278577c09119','Miscellaneous','#94a3b8','eva-more-horizontal-outline','2025-08-12 15:39:31.773823+00','2026-02-20 15:07:25.942239+00') on conflict (id) do update set name=excluded.name,color=excluded.color,icon=excluded.icon,updated_at=excluded.updated_at;
insert into public.categories (id,name,color,icon,created_at,updated_at) values ('4d7ae468-858e-475d-a3de-ce2699a6e02c','Personal Care','#ec4899','eva-person-outline','2025-08-12 15:39:31.773823+00','2026-02-20 15:07:25.942239+00') on conflict (id) do update set name=excluded.name,color=excluded.color,icon=excluded.icon,updated_at=excluded.updated_at;
insert into public.categories (id,name,color,icon,created_at,updated_at) values ('9473fd4f-f58f-41d3-a34e-26e4554514e1','Personal Spending','#f4a261','eva-person-add-outline','2025-08-12 15:39:31.773823+00','2026-02-20 15:07:25.942239+00') on conflict (id) do update set name=excluded.name,color=excluded.color,icon=excluded.icon,updated_at=excluded.updated_at;
insert into public.categories (id,name,color,icon,created_at,updated_at) values ('ae38be56-506a-421a-a27e-fe002a54fb7c','Pets','#b56576','eva-github-outline','2025-08-12 15:39:31.773823+00','2026-02-20 15:07:25.942239+00') on conflict (id) do update set name=excluded.name,color=excluded.color,icon=excluded.icon,updated_at=excluded.updated_at;
insert into public.categories (id,name,color,icon,created_at,updated_at) values ('2dedddfa-a847-485a-8fca-319d49491310','Rent/Mortgage','#1d4ed8','eva-pin-outline','2025-08-12 15:39:31.773823+00','2026-02-20 15:07:25.942239+00') on conflict (id) do update set name=excluded.name,color=excluded.color,icon=excluded.icon,updated_at=excluded.updated_at;
insert into public.categories (id,name,color,icon,created_at,updated_at) values ('98c6cc8b-2205-460f-8c3a-c086d4ebd476','Restaurants & Takeout','#f97316','eva-navigation-2-outline','2025-08-12 15:39:31.773823+00','2026-02-20 15:07:25.942239+00') on conflict (id) do update set name=excluded.name,color=excluded.color,icon=excluded.icon,updated_at=excluded.updated_at;
insert into public.categories (id,name,color,icon,created_at,updated_at) values ('dcf4bd9b-4fbc-4b4d-bc6e-8dcf0dc4ee06','Savings & Investments','#16a34a','eva-trending-up-outline','2025-08-12 15:39:31.773823+00','2026-02-20 15:07:25.942239+00') on conflict (id) do update set name=excluded.name,color=excluded.color,icon=excluded.icon,updated_at=excluded.updated_at;
insert into public.categories (id,name,color,icon,created_at,updated_at) values ('82d3c68d-daf3-4a3c-b255-748afdab53b5','Subscriptions','#14b8a6','eva-repeat-outline','2025-08-12 15:39:31.773823+00','2026-02-20 15:07:25.942239+00') on conflict (id) do update set name=excluded.name,color=excluded.color,icon=excluded.icon,updated_at=excluded.updated_at;
insert into public.categories (id,name,color,icon,created_at,updated_at) values ('0640277e-861b-4fb7-b9e8-986d7316f3af','Taxes','#374151','eva-archive-outline','2025-08-12 15:39:31.773823+00','2026-02-20 15:07:25.942239+00') on conflict (id) do update set name=excluded.name,color=excluded.color,icon=excluded.icon,updated_at=excluded.updated_at;
insert into public.categories (id,name,color,icon,created_at,updated_at) values ('1c8c6d28-18b8-4860-a16b-c7931dd6c3f0','Transportation','#6366f1','eva-car-outline','2025-08-12 15:39:31.773823+00','2026-02-20 15:07:25.942239+00') on conflict (id) do update set name=excluded.name,color=excluded.color,icon=excluded.icon,updated_at=excluded.updated_at;
insert into public.categories (id,name,color,icon,created_at,updated_at) values ('5ff8965c-d3ee-4b69-a908-cb0e2a02123f','Travel','#1abc9c','eva-map-outline','2025-08-12 15:39:31.773823+00','2026-02-20 15:07:25.942239+00') on conflict (id) do update set name=excluded.name,color=excluded.color,icon=excluded.icon,updated_at=excluded.updated_at;
insert into public.categories (id,name,color,icon,created_at,updated_at) values ('03e8a203-6d21-41d5-969e-fb692798b566','Utilities','#06b6d4','eva-flash-outline','2025-08-12 15:39:31.773823+00','2026-02-20 15:07:25.942239+00') on conflict (id) do update set name=excluded.name,color=excluded.color,icon=excluded.icon,updated_at=excluded.updated_at;
insert into public.categories (id,name,color,icon,created_at,updated_at) values ('3d4a9776-a020-4889-ad4b-d2742ce7e09f','Work & Professional','#1f2937','eva-briefcase-outline','2025-08-12 15:39:31.773823+00','2026-02-20 15:07:25.942239+00') on conflict (id) do update set name=excluded.name,color=excluded.color,icon=excluded.icon,updated_at=excluded.updated_at;
