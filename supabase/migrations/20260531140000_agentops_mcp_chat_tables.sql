-- AgentOps mcp-chat: tables on shared One OS Supabase (reuses public.organizations)

create extension if not exists "pgcrypto";

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

create index if not exists idx_app_users_clerk_user_id on public.app_users (clerk_user_id);
create index if not exists idx_app_users_email on public.app_users (email);
create index if not exists idx_chat_threads_org_id on public.chat_threads (organization_id);
create index if not exists idx_chat_messages_thread_id on public.chat_messages (thread_id);
create index if not exists idx_usage_events_org_id on public.usage_events (organization_id);

create or replace function public.bootstrap_master_admin(p_email text default 'ceo@salesflow.one')
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.app_users
  set role = 'master_admin', is_master_admin = true, updated_at = now()
  where lower(email) = lower(p_email);
end;
$$;

alter table public.app_users enable row level security;
alter table public.chat_threads enable row level security;
alter table public.chat_messages enable row level security;
alter table public.connected_accounts enable row level security;
alter table public.usage_events enable row level security;
