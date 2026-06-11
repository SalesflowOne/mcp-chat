'use client';

import { useEffect, useState } from 'react';

import { useAuth } from '@/hooks/useAuth';
import { useAuthContext } from '@/components/session-provider';
import { SESSION_DURATION_MS } from '@/lib/constants';
import type { AppSession } from '@/lib/auth-session';

const AUTH_LOAD_TIMEOUT_MS = 2500;

/**
 * Session hook that mirrors the legacy useSession shape for existing components.
 * Backed by Supabase Auth via AuthProvider.
 */
export function useEffectiveSession() {
  const { isAuthDisabled, guestSession } = useAuthContext();
  const { user, isLoading } = useAuth();
  const [authTimedOut, setAuthTimedOut] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setAuthTimedOut(false);
      return;
    }
    const timer = window.setTimeout(() => setAuthTimedOut(true), AUTH_LOAD_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [isLoading]);

  if (isAuthDisabled && guestSession) {
    return {
      data: {
        ...guestSession,
        authUserId: guestSession.user.id,
        appUserId: guestSession.user.id,
        organizationId: 'guest',
        expires: new Date(Date.now() + SESSION_DURATION_MS).toISOString(),
      } satisfies AppSession,
      status: 'authenticated' as const,
      update: () => Promise.resolve(null),
    };
  }

  if (isLoading && !authTimedOut) {
    return {
      data: null,
      status: 'loading' as const,
      update: () => Promise.resolve(null),
    };
  }

  if (!user) {
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
        name: user.name,
        email: user.email,
      },
      authUserId: user.id,
      appUserId: user.id,
      organizationId: 'default',
      expires: new Date(Date.now() + SESSION_DURATION_MS).toISOString(),
    } satisfies AppSession,
    status: 'authenticated' as const,
    update: () => Promise.resolve(null),
  };
}
