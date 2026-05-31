import 'server-only';

import { auth, currentUser } from '@clerk/nextjs/server';

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

export async function upsertAppUserFromClerk(): Promise<AppUserRow> {
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    throw new Error('Not authenticated');
  }

  const clerkUser = await currentUser();
  const email =
    clerkUser?.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)
      ?.emailAddress ??
    clerkUser?.emailAddresses[0]?.emailAddress ??
    '';

  if (!email) {
    throw new Error('Clerk user has no email');
  }

  const master = isMasterAdminEmail(email);
  const supabase = getSupabaseAdminClient();

  const { data: existing } = await supabase
    .from('app_users')
    .select('*')
    .eq('clerk_user_id', clerkUserId)
    .maybeSingle();

  const payload = {
    clerk_user_id: clerkUserId,
    email: email.toLowerCase(),
    full_name:
      clerkUser?.fullName ||
      [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(' ') ||
      null,
    avatar_url: clerkUser?.imageUrl ?? null,
    role: master ? 'master_admin' : 'user',
    is_master_admin: master,
  };

  if (existing) {
    const { data, error } = await supabase
      .from('app_users')
      .update(payload)
      .eq('id', existing.id)
      .select('*')
      .single();

    if (error || !data) {
      throw error ?? new Error('Failed to update app user');
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
    clerk_user_id: appUser.clerk_user_id,
    role: 'owner',
  });

  if (memberError) {
    throw memberError;
  }

  await supabase.from('audit_logs').insert({
    organization_id: org.id,
    actor_id: appUser.id,
    action: 'organization.created',
    details: `organization:${org.id}`,
    metadata: { source: 'default_workspace', target_type: 'organization' },
  });

  return org;
}

export async function syncClerkOrganizationMembership(
  clerkOrgId: string,
  clerkOrgName: string,
  clerkUserId: string,
  clerkRole: string,
): Promise<OrganizationRow> {
  const supabase = getSupabaseAdminClient();

  const appUser = await upsertAppUserFromClerk();

  let { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('clerk_org_id', clerkOrgId)
    .maybeSingle();

  if (!org) {
    const slug = `${slugify(clerkOrgName)}-${clerkOrgId.slice(-8)}`;
    const { data: created, error } = await supabase
      .from('organizations')
      .insert({
        clerk_org_id: clerkOrgId,
        name: clerkOrgName,
        slug,
        owner_id: appUser.id,
        status: 'active',
      })
      .select('*')
      .single();

    if (error || !created) {
      throw error ?? new Error('Failed to sync organization');
    }
    org = created;
  }

  const mappedRole =
    clerkRole === 'org:admin' || clerkRole === 'admin'
      ? 'admin'
      : clerkRole === 'org:member' || clerkRole === 'member'
        ? 'member'
        : clerkRole === 'viewer'
          ? 'viewer'
          : 'member';

  await supabase.from('organization_members').upsert(
    {
      organization_id: org.id,
      user_id: appUser.id,
      clerk_user_id: clerkUserId,
      clerk_org_id: clerkOrgId,
      role: mappedRole,
    },
    { onConflict: 'organization_id,user_id' },
  );

  return org;
}
