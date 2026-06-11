'use client';

import { createContext, useContext } from 'react';

import type { AppSession } from '@/lib/auth-session';
import { GuestSession } from '@/types/user';

type AuthContextType = {
  isAuthDisabled: boolean;
  isPersistenceDisabled: boolean;
  guestSession?: GuestSession;
  /** Server-resolved session from the chat layout — authoritative when client cookies lag */
  serverSession?: AppSession | null;
};

const AuthContext = createContext<AuthContextType>({
  isAuthDisabled: false,
  isPersistenceDisabled: false,
  serverSession: null,
});

export function SessionProvider({
  children,
  isAuthDisabled,
  isPersistenceDisabled,
  guestSession,
  serverSession,
}: {
  children: React.ReactNode;
  isAuthDisabled: boolean;
  isPersistenceDisabled: boolean;
  guestSession?: GuestSession;
  serverSession?: AppSession | null;
}) {
  return (
    <AuthContext.Provider
      value={{
        isAuthDisabled,
        isPersistenceDisabled,
        guestSession,
        serverSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  return useContext(AuthContext);
}
