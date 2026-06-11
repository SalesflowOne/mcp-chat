-- Supabase Auth migration for AgentOps on shared One OS database.
-- Uses existing public.profiles (user_id = auth.users.id) and public.user_roles.
-- Replaces Clerk ID parameters in RPC functions with auth user UUIDs.

-- Relax legacy Clerk columns (shared DB may still have historical data)
alter table public.app_users alter column clerk_user_id drop not null;
alter table public.organizations alter column clerk_org_id drop not null;
alter table public.organization_members alter column clerk_user_id drop not null;

-- Auth-based RPC: upsert app user by Supabase auth.users.id
create or replace function public.agentops_upsert_app_user(
  p_secret text,
  p_auth_user_id uuid,
  p_email text,
  p_full_name text default null,
  p_avatar_url text default null
)
returns public.app_users
language plpgsql
security definer
set search_path = public
as $$
declare
  v_secret text;
  v_row public.app_users;
  v_master boolean;
begin
  select value::text into v_secret from public.app_config where key = 'persist_secret';
  if v_secret is null or v_secret <> p_secret then
    raise exception 'unauthorized';
  end if;

  v_master := lower(p_email) = lower(coalesce(
    (select value::text from public.app_config where key = 'master_admin_email'),
    'ceo@salesflow.one'
  ));

  insert into public.profiles (user_id, email, display_name, first_name, last_name, avatar_url)
  values (
    p_auth_user_id,
    lower(p_email),
    p_full_name,
    split_part(coalesce(p_full_name, ''), ' ', 1),
    nullif(trim(substring(coalesce(p_full_name, '') from position(' ' in coalesce(p_full_name, '')) + 1)), ''),
    p_avatar_url
  )
  on conflict (user_id) do update set
    email = excluded.email,
    display_name = coalesce(excluded.display_name, public.profiles.display_name),
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
    updated_at = now();

  insert into public.app_users (id, email, full_name, avatar_url, role, is_master_admin)
  values (
    p_auth_user_id,
    lower(p_email),
    p_full_name,
    p_avatar_url,
    case when v_master then 'master_admin' else 'user' end,
    v_master
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, public.app_users.full_name),
    avatar_url = coalesce(excluded.avatar_url, public.app_users.avatar_url),
    role = case when v_master then 'master_admin' else public.app_users.role end,
    is_master_admin = v_master or public.app_users.is_master_admin,
    updated_at = now()
  returning * into v_row;

  return v_row;
end;
$$;

create or replace function public.agentops_get_chat_by_id(
  p_secret text,
  p_chat_id uuid,
  p_auth_user_id uuid
)
returns public.chat_threads
language plpgsql
security definer
set search_path = public
as $$
declare
  v_secret text;
  v_row public.chat_threads;
  v_user public.app_users;
begin
  select value::text into v_secret from public.app_config where key = 'persist_secret';
  if v_secret is null or v_secret <> p_secret then
    raise exception 'unauthorized';
  end if;

  select * into v_user from public.app_users where id = p_auth_user_id;
  if not found then
    return null;
  end if;

  select * into v_row from public.chat_threads where id = p_chat_id;
  if not found then
    return null;
  end if;

  if not v_user.is_master_admin and v_row.user_id is distinct from v_user.id then
    return null;
  end if;

  return v_row;
end;
$$;

create or replace function public.agentops_get_messages_by_chat(
  p_secret text,
  p_chat_id uuid,
  p_auth_user_id uuid
)
returns setof public.chat_messages
language plpgsql
security definer
set search_path = public
as $$
declare
  v_thread public.chat_threads;
begin
  select * into v_thread from public.agentops_get_chat_by_id(p_secret, p_chat_id, p_auth_user_id);
  if v_thread is null then
    return;
  end if;

  return query
    select * from public.chat_messages
    where thread_id = p_chat_id
    order by created_at asc;
end;
$$;
