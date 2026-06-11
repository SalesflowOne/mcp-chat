import 'server-only';

import { getCurrentUser } from '@/lib/auth/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { MASTER_ADMIN_EMAIL } from '@/lib/tenant/constants';
import type { AppUserRow, OrganizationRow } from '@/lib/supabase/types';

function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);

  return base || 'workspace';
}

function isMasterAdminEmail(email: string): boolean {
  return email.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase();
}

export type AuthUserInput = {
  authUserId: string;
  email: string;
  fullName?: string | null;
  avatarUrl?: string | null;
  firstName?: string | null;
  lastName?: string | null;
};

export async function upsertProfile(input: AuthUserInput): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const displayName =
    (input.fullName ??
      [input.firstName, input.lastName].filter(Boolean).join(' ')) ||
    input.email.split('@')[0];

  await supabase.from('profiles').upsert(
    {
      user_id: input.authUserId,
      email: input.email.toLowerCase(),
      first_name: input.firstName ?? null,
      last_name: input.lastName ?? null,
      display_name: displayName,
      avatar_url: input.avatarUrl ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );
}

export async function upsertAppUserFromAuth(
  input?: AuthUserInput,
): Promise<AppUserRow> {
  let authInput = input;

  if (!authInput) {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('Not authenticated');
    }
    authInput = {
      authUserId: user.id,
      email: user.email,
      fullName: user.name,
      avatarUrl: user.avatarUrl,
    };
  }

  const { authUserId, email, fullName, avatarUrl } = authInput;

  if (!email) {
    throw new Error('User has no email');
  }

  const master = isMasterAdminEmail(email);
  const supabase = getSupabaseAdminClient();

  await upsertProfile(authInput);

  const { data: existing } = await supabase
    .from('app_users')
    .select('*')
    .eq('id', authUserId)
    .maybeSingle();

  const payload = {
    id: authUserId,
    email: email.toLowerCase(),
    full_name: fullName ?? null,
    avatar_url: avatarUrl ?? null,
    role: master ? 'master_admin' : 'user',
    is_master_admin: master,
  };

  if (existing) {
    const { data, error } = await supabase
      .from('app_users')
      .update(payload)
      .eq('id', authUserId)
      .select('*')
      .single();

    if (error || !data) {
      throw error ?? new Error('Failed to update app user');
    }

    return data;
  }

  const { data: byEmail } = await supabase
    .from('app_users')
    .select('*')
    .eq('email', email.toLowerCase())
    .maybeSingle();

  if (byEmail && byEmail.id !== authUserId) {
    const { data, error } = await supabase
      .from('app_users')
      .update({
        full_name: payload.full_name,
        avatar_url: payload.avatar_url,
        role: payload.role,
        is_master_admin: payload.is_master_admin,
      })
      .eq('id', byEmail.id)
      .select('*')
      .single();

    if (error || !data) {
      throw error ?? new Error('Failed to link legacy app user');
    }
    return data;
  }

  const { data, error } = await supabase
    .from('app_users')
    .insert(payload)
    .select('*')
    .single();

  if (error || !data) {
    throw error ?? new Error('Failed to create app user');
  }

  return data;
}

export async function ensureDefaultOrganization(
  appUser: AppUserRow,
): Promise<OrganizationRow> {
  const supabase = getSupabaseAdminClient();

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', appUser.id)
    .limit(1)
    .maybeSingle();

  if (membership?.organization_id) {
    const { data: existingOrg } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', membership.organization_id)
      .single();

    if (existingOrg) {
      return existingOrg;
    }
  }

  const baseSlug = slugify(
    appUser.full_name || appUser.email.split('@')[0] || 'workspace',
  );
  const slug = `${baseSlug}-${appUser.id.slice(0, 8)}`;
  const name = appUser.full_name
    ? `${appUser.full_name}'s Workspace`
    : 'My Workspace';

  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .insert({
      name,
      slug,
      owner_id: appUser.id,
      status: 'active',
    })
    .select('*')
    .single();

  if (orgError || !org) {
    throw orgError ?? new Error('Failed to create default organization');
  }

  const { error: memberError } = await supabase.from('organization_members').insert({
    organization_id: org.id,
    user_id: appUser.id,
    role: 'owner',
    status: 'active',
  });

  if (memberError) {
    throw memberError;
  }

  return org;
}

export async function getMemberRole(
  organizationId: string,
  userId: string,
): Promise<string | null> {
  const supabase = getSupabaseAdminClient();
  const { data } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', organizationId)
    .eq('user_id', userId)
    .maybeSingle();

  return data?.role ?? null;
}
