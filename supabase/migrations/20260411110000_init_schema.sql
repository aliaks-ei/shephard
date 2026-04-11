create extension if not exists pgcrypto;

create or replace function public.set_row_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  icon text not null,
  color text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz,
  constraint categories_name_not_blank check (char_length(trim(name)) > 0),
  constraint categories_icon_not_blank check (char_length(trim(icon)) > 0),
  constraint categories_color_hex check (color ~ '^#[0-9A-Fa-f]{6}$')
);

create unique index if not exists categories_name_key
  on public.categories (lower(name));

create table if not exists public.users (
  id uuid primary key,
  email text not null,
  name text not null,
  avatar text,
  preferences jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz,
  constraint users_email_not_blank check (char_length(trim(email)) > 0),
  constraint users_name_not_blank check (char_length(trim(name)) > 0)
);

create unique index if not exists users_email_lower_key
  on public.users (lower(email));

create table if not exists public.templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null,
  duration text not null,
  total numeric(12, 2),
  currency text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz,
  constraint templates_name_not_blank check (char_length(trim(name)) > 0),
  constraint templates_duration_valid check (duration in ('weekly', 'monthly', 'yearly')),
  constraint templates_total_non_negative check (total is null or total >= 0),
  constraint templates_currency_valid check (
    currency is null or currency in ('EUR', 'USD', 'GBP')
  )
);

create unique index if not exists unique_template_name_per_user
  on public.templates (owner_id, lower(name));

create index if not exists templates_owner_created_at_idx
  on public.templates (owner_id, created_at desc);

create table if not exists public.template_items (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.templates(id) on delete cascade,
  name text not null,
  category_id uuid not null references public.categories(id),
  amount numeric(12, 2) not null,
  is_fixed_payment boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz,
  constraint template_items_name_not_blank check (char_length(trim(name)) > 0),
  constraint template_items_amount_positive check (amount > 0)
);

create index if not exists template_items_template_id_idx
  on public.template_items (template_id, created_at asc);

create index if not exists template_items_category_id_idx
  on public.template_items (category_id);

create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null,
  template_id uuid not null references public.templates(id),
  start_date date not null,
  end_date date not null,
  total numeric(12, 2),
  currency text,
  status text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz,
  constraint plans_name_not_blank check (char_length(trim(name)) > 0),
  constraint plans_total_non_negative check (total is null or total >= 0),
  constraint plans_currency_valid check (
    currency is null or currency in ('EUR', 'USD', 'GBP')
  ),
  constraint plans_status_valid check (
    status in ('pending', 'active', 'completed', 'cancelled')
  ),
  constraint plans_date_range_valid check (start_date <= end_date)
);

create unique index if not exists unique_plan_name_per_user
  on public.plans (owner_id, lower(name));

create index if not exists plans_owner_created_at_idx
  on public.plans (owner_id, created_at desc);

create index if not exists plans_status_idx
  on public.plans (status);

create table if not exists public.plan_items (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans(id) on delete cascade,
  name text not null,
  category_id uuid not null references public.categories(id),
  amount numeric(12, 2) not null,
  is_fixed_payment boolean not null default false,
  is_completed boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz,
  constraint plan_items_name_not_blank check (char_length(trim(name)) > 0),
  constraint plan_items_amount_positive check (amount > 0)
);

create index if not exists plan_items_plan_id_idx
  on public.plan_items (plan_id, created_at asc);

create index if not exists plan_items_category_id_idx
  on public.plan_items (category_id);

create table if not exists public.template_shares (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.templates(id) on delete cascade,
  shared_by_user_id uuid not null,
  shared_with_user_id uuid not null,
  permission_level text not null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint template_shares_permission_valid check (permission_level in ('view', 'edit')),
  constraint template_shares_not_self check (shared_by_user_id <> shared_with_user_id)
);

create unique index if not exists template_shares_template_user_key
  on public.template_shares (template_id, shared_with_user_id);

create index if not exists template_shares_shared_with_idx
  on public.template_shares (shared_with_user_id, created_at desc);

create table if not exists public.plan_shares (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans(id) on delete cascade,
  shared_by_user_id uuid not null,
  shared_with_user_id uuid not null,
  permission_level text not null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint plan_shares_permission_valid check (permission_level in ('view', 'edit')),
  constraint plan_shares_not_self check (shared_by_user_id <> shared_with_user_id)
);

create unique index if not exists plan_shares_plan_user_key
  on public.plan_shares (plan_id, shared_with_user_id);

create index if not exists plan_shares_shared_with_idx
  on public.plan_shares (shared_with_user_id, created_at desc);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  amount numeric(12, 2) not null,
  category_id uuid not null references public.categories(id),
  plan_id uuid not null references public.plans(id) on delete cascade,
  plan_item_id uuid references public.plan_items(id) on delete set null,
  user_id uuid not null,
  expense_date date not null default current_date,
  currency text,
  original_amount numeric(12, 2),
  original_currency text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz,
  constraint expenses_name_not_blank check (char_length(trim(name)) > 0),
  constraint expenses_amount_positive check (amount > 0),
  constraint expenses_original_amount_positive check (
    original_amount is null or original_amount > 0
  ),
  constraint expenses_currency_valid check (
    currency is null or currency in ('EUR', 'USD', 'GBP')
  ),
  constraint expenses_original_currency_valid check (
    original_currency is null or original_currency in ('EUR', 'USD', 'GBP')
  )
);

create index if not exists expenses_plan_id_expense_date_idx
  on public.expenses (plan_id, expense_date desc, created_at desc);

create index if not exists expenses_plan_item_id_idx
  on public.expenses (plan_item_id);

create index if not exists expenses_category_id_idx
  on public.expenses (category_id);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  actor_user_id uuid references public.users(id) on delete set null,
  type text not null,
  title text not null,
  body text not null,
  entity_type text not null,
  entity_id uuid not null,
  payload jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  deleted_at timestamptz,
  push_attempted_at timestamptz,
  push_sent_at timestamptz,
  push_error text,
  created_at timestamptz not null default timezone('utc', now()),
  constraint notifications_type_valid check (
    type in (
      'plan_shared',
      'template_shared',
      'shared_plan_updated',
      'shared_template_updated',
      'shared_plan_expense_added',
      'shared_plan_removed',
      'shared_template_removed',
      'shared_plan_cancelled',
      'shared_plan_permission_changed',
      'shared_template_permission_changed'
    )
  ),
  constraint notifications_entity_type_valid check (entity_type in ('plan', 'template')),
  constraint notifications_title_not_blank check (char_length(trim(title)) > 0),
  constraint notifications_body_not_blank check (char_length(trim(body)) > 0)
);

create index if not exists notifications_user_created_at_idx
  on public.notifications (user_id, created_at desc);

create index if not exists notifications_user_unread_idx
  on public.notifications (user_id, read_at, deleted_at);

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  user_agent text,
  revoked_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint push_subscriptions_endpoint_not_blank check (char_length(trim(endpoint)) > 0),
  constraint push_subscriptions_p256dh_not_blank check (char_length(trim(p256dh)) > 0),
  constraint push_subscriptions_auth_not_blank check (char_length(trim(auth)) > 0)
);

create unique index if not exists push_subscriptions_endpoint_key
  on public.push_subscriptions (endpoint);

create index if not exists push_subscriptions_user_revoked_idx
  on public.push_subscriptions (user_id, revoked_at);

drop trigger if exists categories_set_updated_at on public.categories;
create trigger categories_set_updated_at
before update on public.categories
for each row
execute function public.set_row_updated_at();

drop trigger if exists users_set_updated_at on public.users;
create trigger users_set_updated_at
before update on public.users
for each row
execute function public.set_row_updated_at();

drop trigger if exists templates_set_updated_at on public.templates;
create trigger templates_set_updated_at
before update on public.templates
for each row
execute function public.set_row_updated_at();

drop trigger if exists template_items_set_updated_at on public.template_items;
create trigger template_items_set_updated_at
before update on public.template_items
for each row
execute function public.set_row_updated_at();

drop trigger if exists plans_set_updated_at on public.plans;
create trigger plans_set_updated_at
before update on public.plans
for each row
execute function public.set_row_updated_at();

drop trigger if exists plan_items_set_updated_at on public.plan_items;
create trigger plan_items_set_updated_at
before update on public.plan_items
for each row
execute function public.set_row_updated_at();

drop trigger if exists expenses_set_updated_at on public.expenses;
create trigger expenses_set_updated_at
before update on public.expenses
for each row
execute function public.set_row_updated_at();

drop trigger if exists push_subscriptions_set_updated_at on public.push_subscriptions;
create trigger push_subscriptions_set_updated_at
before update on public.push_subscriptions
for each row
execute function public.set_row_updated_at();
