-- AgentOps artifacts (org-scoped documents — replaces Drizzle Document for Supabase tenants)

create table if not exists public.artifacts (
  id uuid not null,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid references public.app_users(id) on delete set null,
  title text not null,
  content text,
  kind text not null default 'text',
  created_at timestamptz not null default now(),
  primary key (id, created_at)
);

create index if not exists idx_artifacts_org on public.artifacts (organization_id);
create index if not exists idx_artifacts_id on public.artifacts (id, created_at desc);

alter table public.artifacts enable row level security;
