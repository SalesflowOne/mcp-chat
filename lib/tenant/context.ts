import 'server-only';

import { cookies } from 'next/headers';

import { getCurrentUser } from '@/lib/auth/server';
import { ACTIVE_ORG_COOKIE } from '@/lib/tenant/constants';
import {
  ensureDefaultOrganization,
  upsertAppUserFromAuth,
  type AuthUserInput,
} from '@/lib/tenant/sync';
import { resolveTenantViaRpc } from '@/lib/persistence/rpc';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { hasSupabaseServiceRole } from '@/lib/supabase/config';
import type { AppUserRow, OrganizationRow } from '@/lib/supabase/types';

export type TenantContext = {
  appUser: AppUserRow;
  organization: OrganizationRow;
  authUserId: string;
  organizationId: string;
  memberRole: string | null;
};

export async function resolveTenantContext(): Promise<TenantContext | null> {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const authInput: AuthUserInput = {
    authUserId: user.id,
    email: user.email,
    fullName: user.name,
    avatarUrl: user.avatarUrl,
  };

  if (!hasSupabaseServiceRole()) {
    const cookieStore = await cookies();
    return resolveTenantViaRpc({
      authUserId: user.id,
      email: user.email,
      fullName: user.name,
      avatarUrl: user.avatarUrl ?? null,
      cookieOrgId: cookieStore.get(ACTIVE_ORG_COOKIE)?.value ?? null,
    });
  }

  const appUser = await upsertAppUserFromAuth(authInput);
  const supabase = getSupabaseAdminClient();

  let organization = await ensureDefaultOrganization(appUser);

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

  const { data: member } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', organization.id)
    .eq('user_id', appUser.id)
    .maybeSingle();

  return {
    appUser,
    organization,
    authUserId: user.id,
    organizationId: organization.id,
    memberRole: member?.role ?? null,
  };
}
