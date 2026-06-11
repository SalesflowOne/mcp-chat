'use client';

import { useAuth, useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';

import { useAuthContext } from '@/components/session-provider';
import { SESSION_DURATION_MS } from '@/lib/constants';
import type { AppSession } from '@/lib/auth-session';

const AUTH_LOAD_TIMEOUT_MS = 2500;

/**
 * Session hook that mirrors the old NextAuth useSession shape so existing
 * components keep working with Clerk underneath.
 */
export function useEffectiveSession() {
  const { isAuthDisabled, guestSession } = useAuthContext();
  const { isLoaded, isSignedIn } = useAuth();
  const { user, isLoaded: isUserLoaded } = useUser();
  const [authTimedOut, setAuthTimedOut] = useState(false);

  useEffect(() => {
    if (isLoaded) {
      setAuthTimedOut(false);
      return;
    }
    const timer = window.setTimeout(() => setAuthTimedOut(true), AUTH_LOAD_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [isLoaded]);

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

  if (!isLoaded && !authTimedOut) {
    return {
      data: null,
      status: 'loading' as const,
      update: () => Promise.resolve(null),
    };
  }

  if (!isSignedIn || !user || !isUserLoaded) {
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
      organizationId:
        user.organizationMemberships?.[0]?.organization.id ?? 'default',
      expires: new Date(Date.now() + SESSION_DURATION_MS).toISOString(),
    } satisfies AppSession,
    status: 'authenticated' as const,
    update: () => Promise.resolve(null),
  };
}
