-- AgentOps / One OS multi-tenant foundation (Clerk identity + Supabase data)

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text unique not null,
  email text unique not null,
  full_name text,
  avatar_url text,
  role text not null default 'user',
  is_master_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  clerk_org_id text unique,
  name text not null,
  slug text unique not null,
  created_by uuid references public.app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.app_users(id) on delete cascade,
  clerk_user_id text not null,
  role text not null default 'member',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create table if not exists public.chat_threads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid references public.app_users(id) on delete set null,
  title text,
  visibility text not null default 'private',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.chat_threads(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid references public.app_users(id) on delete set null,
  role text not null,
  content text,
  parts jsonb not null default '[]'::jsonb,
  attachments jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.connected_accounts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid references public.app_users(id) on delete set null,
  provider text not null,
  provider_account_id text,
  external_user_id text,
  status text not null default 'active',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.usage_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid references public.app_users(id) on delete set null,
  event_type text not null,
  model text,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  cost_usd numeric(12, 6) not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  user_id uuid references public.app_users(id) on delete set null,
  action text not null,
  target_type text,
  target_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index if not exists idx_app_users_clerk_user_id on public.app_users (clerk_user_id);
create index if not exists idx_app_users_email on public.app_users (email);
create index if not exists idx_organizations_clerk_org_id on public.organizations (clerk_org_id);
create index if not exists idx_organization_members_org_id on public.organization_members (organization_id);
create index if not exists idx_organization_members_user_id on public.organization_members (user_id);
create index if not exists idx_organization_members_clerk_user_id on public.organization_members (clerk_user_id);
create index if not exists idx_chat_threads_org_id on public.chat_threads (organization_id);
create index if not exists idx_chat_threads_user_id on public.chat_threads (user_id);
create index if not exists idx_chat_threads_created_at on public.chat_threads (created_at desc);
create index if not exists idx_chat_messages_thread_id on public.chat_messages (thread_id);
create index if not exists idx_chat_messages_org_id on public.chat_messages (organization_id);
create index if not exists idx_chat_messages_user_id on public.chat_messages (user_id);
create index if not exists idx_chat_messages_created_at on public.chat_messages (created_at desc);
create index if not exists idx_usage_events_org_id on public.usage_events (organization_id);
create index if not exists idx_usage_events_created_at on public.usage_events (created_at desc);
create index if not exists idx_audit_logs_org_id on public.audit_logs (organization_id);
create index if not exists idx_audit_logs_created_at on public.audit_logs (created_at desc);

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_app_users_updated_at on public.app_users;
create trigger trg_app_users_updated_at
before update on public.app_users
for each row execute function public.set_updated_at();

drop trigger if exists trg_organizations_updated_at on public.organizations;
create trigger trg_organizations_updated_at
before update on public.organizations
for each row execute function public.set_updated_at();

drop trigger if exists trg_chat_threads_updated_at on public.chat_threads;
create trigger trg_chat_threads_updated_at
before update on public.chat_threads
for each row execute function public.set_updated_at();

drop trigger if exists trg_connected_accounts_updated_at on public.connected_accounts;
create trigger trg_connected_accounts_updated_at
before update on public.connected_accounts
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Master admin bootstrap
-- ---------------------------------------------------------------------------

create or replace function public.bootstrap_master_admin(p_email text default 'ceo@salesflow.one')
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.app_users
  set
    role = 'master_admin',
    is_master_admin = true,
    updated_at = now()
  where lower(email) = lower(p_email);
end;
$$;

-- ---------------------------------------------------------------------------
-- RLS: enabled; deny-by-default for anon/authenticated API roles.
-- App uses service role on server after Clerk + membership checks.
-- ---------------------------------------------------------------------------

alter table public.app_users enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.chat_threads enable row level security;
alter table public.chat_messages enable row level security;
alter table public.connected_accounts enable row level security;
alter table public.usage_events enable row level security;
alter table public.audit_logs enable row level security;
