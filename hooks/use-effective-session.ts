'use client';

import { useAuth, useUser } from '@clerk/nextjs';

import { useAuthContext } from '@/components/session-provider';
import { SESSION_DURATION_MS } from '@/lib/constants';
import type { AppSession } from '@/lib/auth-session';

/**
 * Session hook that mirrors the old NextAuth useSession shape so existing
 * components keep working with Clerk underneath.
 */
export function useEffectiveSession() {
  const { isAuthDisabled, guestSession } = useAuthContext();
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();

  if (isAuthDisabled && guestSession) {
    return {
      data: {
        ...guestSession,
        expires: new Date(Date.now() + SESSION_DURATION_MS).toISOString(),
      } satisfies AppSession,
      status: 'authenticated' as const,
      update: () => Promise.resolve(null),
    };
  }

  if (!isLoaded) {
    return {
      data: null,
      status: 'loading' as const,
      update: () => Promise.resolve(null),
    };
  }

  if (!isSignedIn || !user) {
    return {
      data: null,
      status: 'unauthenticated' as const,
      update: () => Promise.resolve(null),
    };
  }

  return {
    data: {
      user: {
        id: user.id,
        name:
          user.fullName ||
          [user.firstName, user.lastName].filter(Boolean).join(' ') ||
          'User',
        email: user.primaryEmailAddress?.emailAddress ?? '',
      },
      clerkUserId: user.id,
      appUserId: user.id,
      organizationId: user.organizationMemberships?.[0]?.organization.id ?? 'default',
      expires: new Date(Date.now() + SESSION_DURATION_MS).toISOString(),
    } satisfies AppSession,
    status: 'authenticated' as const,
    update: () => Promise.resolve(null),
  };
}
