import 'server-only';

import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import {
  resolveTenantContext,
  type TenantContext,
} from '@/lib/tenant/context';
import type { AppUserRow } from '@/lib/supabase/types';

export async function getCurrentUser(): Promise<AppUserRow | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const ctx = await resolveTenantContext();
  return ctx?.appUser ?? null;
}

export async function requireUser(): Promise<AppUserRow> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}

export async function requireTenant(): Promise<TenantContext> {
  const ctx = await resolveTenantContext();
  if (!ctx) {
    throw new Error('Unauthorized');
  }
  return ctx;
}

export async function requireOrganization(): Promise<TenantContext> {
  return requireTenant();
}

export async function requireOrgAccess(
  organizationId: string,
): Promise<TenantContext> {
  const ctx = await requireTenant();

  if (ctx.appUser.is_master_admin) {
    return ctx;
  }

  if (ctx.organizationId !== organizationId) {
    const supabase = getSupabaseAdminClient();
    const { data: membership } = await supabase
      .from('organization_members')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('user_id', ctx.appUser.id)
      .maybeSingle();

    if (!membership) {
      throw new Error('Forbidden');
    }
  }

  return ctx;
}

export async function requireMasterAdmin(): Promise<AppUserRow> {
  const user = await requireUser();
  if (!user.is_master_admin) {
    throw new Error('Forbidden');
  }
  return user;
}
