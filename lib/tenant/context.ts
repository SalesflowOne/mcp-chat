import 'server-only';

import { cookies } from 'next/headers';
import { auth, currentUser } from '@clerk/nextjs/server';

import { ACTIVE_ORG_COOKIE } from '@/lib/tenant/constants';
import {
  ensureDefaultOrganization,
  syncClerkOrganizationMembership,
  upsertAppUserFromClerk,
} from '@/lib/tenant/sync';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import type { AppUserRow, OrganizationRow } from '@/lib/supabase/types';

export type TenantContext = {
  appUser: AppUserRow;
  organization: OrganizationRow;
  clerkUserId: string;
  organizationId: string;
};

export async function resolveTenantContext(): Promise<TenantContext | null> {
  const { userId: clerkUserId, orgId: clerkOrgId } = await auth();

  if (!clerkUserId) {
    return null;
  }

  const appUser = await upsertAppUserFromClerk();
  const supabase = getSupabaseAdminClient();

  let organization: OrganizationRow | null = null;

  if (clerkOrgId) {
    const user = await currentUser();
    const membership = user?.organizationMemberships?.find(
      (m) => m.organization.id === clerkOrgId,
    );

    organization = await syncClerkOrganizationMembership(
      clerkOrgId,
      membership?.organization.name ?? 'Organization',
      clerkUserId,
      membership?.role ?? 'member',
    );
  } else {
    organization = await ensureDefaultOrganization(appUser);
  }

  const cookieStore = await cookies();
  const cookieOrgId = cookieStore.get(ACTIVE_ORG_COOKIE)?.value;

  if (cookieOrgId && cookieOrgId !== organization.id) {
    if (appUser.is_master_admin) {
      const { data: overrideOrg } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', cookieOrgId)
        .maybeSingle();
      if (overrideOrg) {
        organization = overrideOrg;
      }
    } else {
      const { data: membership } = await supabase
        .from('organization_members')
        .select('id')
        .eq('organization_id', cookieOrgId)
        .eq('user_id', appUser.id)
        .eq('status', 'active')
        .maybeSingle();

      if (membership) {
        const { data: overrideOrg } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', cookieOrgId)
          .maybeSingle();
        if (overrideOrg) {
          organization = overrideOrg;
        }
      }
    }
  }

  return {
    appUser,
    organization,
    clerkUserId,
    organizationId: organization.id,
  };
}
