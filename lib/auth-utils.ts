import 'server-only';

import { auth, currentUser } from '@clerk/nextjs/server';

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
      clerkUserId: guest.user.id,
      appUserId: guest.user.id,
      organizationId: 'guest',
    };
  }

  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    return null;
  }

  const clerkProfile = await currentUser();
  const email =
    clerkProfile?.emailAddresses.find(
      (e) => e.id === clerkProfile.primaryEmailAddressId,
    )?.emailAddress ??
    clerkProfile?.emailAddresses[0]?.emailAddress ??
    '';

  if (isSupabaseConfigured()) {
    try {
      const tenant = await resolveTenantContext();
      if (tenant) {
        return {
          user: {
            id: tenant.clerkUserId,
            name:
              tenant.appUser.full_name ||
              [clerkProfile?.firstName, clerkProfile?.lastName]
                .filter(Boolean)
                .join(' ') ||
              'User',
            email: tenant.appUser.email,
          },
          clerkUserId: tenant.clerkUserId,
          appUserId: tenant.appUser.id,
          organizationId: tenant.organizationId,
          isMasterAdmin: tenant.appUser.is_master_admin,
        };
      }

      console.warn(
        'Supabase tenant context unavailable; falling back to Clerk-only session',
      );
    } catch (error) {
      console.error(
        'Failed to resolve Supabase tenant context; falling back to Clerk-only session',
        error,
      );
    }
  }

  return {
    user: {
      id: clerkUserId,
      name:
        clerkProfile?.fullName ||
        [clerkProfile?.firstName, clerkProfile?.lastName]
          .filter(Boolean)
          .join(' ') ||
        'User',
      email,
    },
    clerkUserId,
    appUserId: clerkUserId,
    organizationId: 'default',
  };
}

export function shouldPersistData() {
  return resolveShouldPersist();
}
