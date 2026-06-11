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
function withExpires(session: AppSession): AppSession {
  return {
    ...session,
    expires:
      session.expires ??
      new Date(Date.now() + SESSION_DURATION_MS).toISOString(),
  };
}

export function useEffectiveSession() {
  const { isAuthDisabled, guestSession, serverSession } = useAuthContext();
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
      data: withExpires({
        ...guestSession,
        authUserId: guestSession.user.id,
        appUserId: guestSession.user.id,
        organizationId: 'guest',
      }),
      status: 'authenticated' as const,
      update: () => Promise.resolve(null),
    };
  }

  // Server layout already verified the session — don't block chat on client auth lag.
  if (serverSession?.user) {
    return {
      data: withExpires(serverSession),
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
    data: withExpires({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      authUserId: user.id,
      appUserId: user.id,
      organizationId: 'default',
    }),
    status: 'authenticated' as const,
    update: () => Promise.resolve(null),
  };
}
