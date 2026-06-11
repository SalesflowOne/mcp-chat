'use client';

import { useEffect, useState } from 'react';

import { useAuth } from '@/hooks/useAuth';
import { useAuthContext } from '@/components/session-provider';
import { getEmbeddedSession } from '@/lib/auth/embedded-session';
import { SESSION_DURATION_MS } from '@/lib/constants';
import type { AppSession } from '@/lib/auth-session';

const AUTH_LOAD_TIMEOUT_MS = 2500;

async function fetchServerSession(): Promise<AppSession | null> {
  try {
    const response = await fetch('/api/auth/session', {
      credentials: 'include',
      cache: 'no-store',
    });
    if (!response.ok) {
      return null;
    }
    const payload = (await response.json()) as { session?: AppSession | null };
    return payload.session?.user ? payload.session : null;
  } catch {
    return null;
  }
}

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
  const { isAuthDisabled, guestSession, isSignedIn, serverSession } =
    useAuthContext();
  const { user, isLoading } = useAuth();
  const [authTimedOut, setAuthTimedOut] = useState(false);
  const [fetchedSession, setFetchedSession] = useState<AppSession | null>(null);
  const [embeddedSession] = useState(() => getEmbeddedSession());

  const resolvedServerSession = serverSession?.user
    ? serverSession
    : embeddedSession?.user
      ? embeddedSession
      : fetchedSession;

  useEffect(() => {
    if (serverSession?.user || embeddedSession?.user) {
      return;
    }
    let cancelled = false;
    void fetchServerSession().then((session) => {
      if (!cancelled && session) {
        setFetchedSession(session);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [serverSession, embeddedSession]);

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

  // Server layout rendered the signed-in shell — never report unauthenticated.
  if (isSignedIn) {
    if (resolvedServerSession?.user) {
      return {
        data: withExpires(resolvedServerSession),
        status: 'authenticated' as const,
        update: () => Promise.resolve(null),
      };
    }

    return {
      data: null,
      status: 'authenticated' as const,
      update: () => Promise.resolve(null),
    };
  }

  // Server session (layout prop, embedded script, or /api/auth/session).
  if (resolvedServerSession?.user) {
    return {
      data: withExpires(resolvedServerSession),
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
