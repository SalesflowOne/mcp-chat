-- AgentOps Spaces: AI-generated sites/apps (org-scoped)

create extension if not exists "pgcrypto";

create table if not exists public.spaces (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_by uuid references public.app_users(id) on delete set null,
  chat_thread_id uuid references public.chat_threads(id) on delete set null,
  title text not null,
  slug text not null,
  status text not null default 'draft',
  preview_kind text not null default 'static_html',
  visibility text not null default 'private',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, slug)
);

create table if not exists public.space_files (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  path text not null,
  content text,
  storage_path text,
  mime_type text not null default 'text/plain',
  byte_size integer not null default 0,
  updated_at timestamptz not null default now(),
  unique (space_id, path)
);

create table if not exists public.space_versions (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  version_number integer not null,
  message_id uuid references public.chat_messages(id) on delete set null,
  snapshot jsonb not null default '[]'::jsonb,
  created_by uuid references public.app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (space_id, version_number)
);

create table if not exists public.space_share_links (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  token text not null unique,
  expires_at timestamptz,
  created_by uuid references public.app_users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.space_deployments (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  version_id uuid references public.space_versions(id) on delete set null,
  provider text not null default 'static',
  external_id text,
  url text,
  status text not null default 'pending',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_spaces_org_id on public.spaces (organization_id);
create index if not exists idx_spaces_chat_thread on public.spaces (chat_thread_id);
create index if not exists idx_space_files_space_id on public.space_files (space_id);
create index if not exists idx_space_versions_space_id on public.space_versions (space_id);
create index if not exists idx_space_share_links_space_id on public.space_share_links (space_id);
create index if not exists idx_space_share_links_token on public.space_share_links (token);

drop trigger if exists trg_spaces_updated_at on public.spaces;
create trigger trg_spaces_updated_at
before update on public.spaces
for each row execute function public.set_updated_at();

alter table public.spaces enable row level security;
alter table public.space_files enable row level security;
alter table public.space_versions enable row level security;
alter table public.space_share_links enable row level security;
alter table public.space_deployments enable row level security;
