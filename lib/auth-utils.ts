import 'server-only';

import { getCurrentUser } from '@/lib/auth/server';
import { isAuthDisabled } from '@/lib/constants';
import type { AppSession } from '@/lib/auth-session';
import { createGuestSession } from '@/lib/utils';
import { shouldPersistData as resolveShouldPersist } from '@/lib/data/persistence';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { resolveTenantContext } from '@/lib/tenant/context';

export async function getEffectiveSession(): Promise<AppSession | null> {
  if (isAuthDisabled) {
    const guest = createGuestSession();
    return {
      ...guest,
      authUserId: guest.user.id,
      appUserId: guest.user.id,
      organizationId: 'guest',
    };
  }

  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  if (isSupabaseConfigured()) {
    try {
      const tenant = await resolveTenantContext();
      if (tenant) {
        return {
          user: {
            id: tenant.authUserId,
            name:
              tenant.appUser.full_name ||
              user.name ||
              'User',
            email: tenant.appUser.email,
          },
          authUserId: tenant.authUserId,
          appUserId: tenant.appUser.id,
          organizationId: tenant.organizationId,
          isMasterAdmin: tenant.appUser.is_master_admin,
          memberRole: tenant.memberRole,
        };
      }

      console.warn(
        'Supabase tenant context unavailable; falling back to auth-only session',
      );
    } catch (error) {
      console.error(
        'Failed to resolve Supabase tenant context; falling back to auth-only session',
        error,
      );
    }
  }

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
    authUserId: user.id,
    appUserId: user.id,
    organizationId: 'default',
  };
}

export function shouldPersistData() {
  return resolveShouldPersist();
}
