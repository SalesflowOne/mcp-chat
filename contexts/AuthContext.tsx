'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';

import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { isSupabaseAuthConfigured } from '@/lib/supabase/config';
import type { AuthSessionUser } from '@/lib/auth/types';
import * as authClient from '@/lib/auth/client';

type AuthContextValue = {
  user: AuthSessionUser | null;
  session: Session | null;
  isLoading: boolean;
  signIn: typeof authClient.signIn;
  signUp: typeof authClient.signUp;
  signOut: () => Promise<void>;
  resetPassword: typeof authClient.resetPassword;
  updatePassword: typeof authClient.updatePassword;
  updateProfile: typeof authClient.updateProfile;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function mapUser(user: User | null): AuthSessionUser | null {
  if (!user) {
    return null;
  }

  const meta = user.user_metadata ?? {};
  const firstName = meta.first_name ?? meta.firstName ?? null;
  const lastName = meta.last_name ?? meta.lastName ?? null;
  const displayName =
    (meta.display_name ??
      meta.full_name ??
      meta.name ??
      [firstName, lastName].filter(Boolean).join(' ')) ||
    user.email?.split('@')[0] ||
    'User';

  return {
    id: user.id,
    email: user.email ?? '',
    name: displayName,
    avatarUrl: meta.avatar_url ?? meta.avatarUrl ?? null,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AuthSessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const syncFromServerSession = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/session', {
        credentials: 'include',
        cache: 'no-store',
      });
      if (!response.ok) {
        return false;
      }
      const payload = (await response.json()) as {
        user?: AuthSessionUser | null;
      };
      if (!payload.user) {
        return false;
      }
      setUser(payload.user);
      setIsLoading(false);
      return true;
    } catch {
      return false;
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!isSupabaseAuthConfigured()) {
      const synced = await syncFromServerSession();
      if (!synced) {
        setSession(null);
        setUser(null);
      }
      setIsLoading(false);
      return;
    }

    const supabase = createSupabaseBrowserClient();
    const {
      data: { user: nextUser },
    } = await supabase.auth.getUser();
    const {
      data: { session: nextSession },
    } = await supabase.auth.getSession();

    if (nextUser) {
      setSession(nextSession);
      setUser(mapUser(nextUser));
      setIsLoading(false);
      return;
    }

    const synced = await syncFromServerSession();
    if (!synced) {
      setSession(null);
      setUser(null);
    }
    setIsLoading(false);
  }, [syncFromServerSession]);

  useEffect(() => {
    if (!isSupabaseAuthConfigured()) {
      setIsLoading(false);
      return;
    }

    const supabase = createSupabaseBrowserClient();
    void refresh();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async () => {
      const {
        data: { user: nextUser },
      } = await supabase.auth.getUser();
      const {
        data: { session: nextSession },
      } = await supabase.auth.getSession();
      setSession(nextSession);
      setUser(mapUser(nextUser));
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [refresh]);

  const handleSignOut = useCallback(async () => {
    await authClient.signOut();
    setSession(null);
    setUser(null);
    window.location.href = '/';
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      isLoading,
      signIn: authClient.signIn,
      signUp: authClient.signUp,
      signOut: handleSignOut,
      resetPassword: authClient.resetPassword,
      updatePassword: authClient.updatePassword,
      updateProfile: authClient.updateProfile,
      refresh,
    }),
    [user, session, isLoading, handleSignOut, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return ctx;
}
