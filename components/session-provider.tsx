'use client';

import { createContext, useContext } from 'react';

import type { AppSession } from '@/lib/auth-session';
import { GuestSession } from '@/types/user';

type AuthContextType = {
  isAuthDisabled: boolean;
  isPersistenceDisabled: boolean;
  guestSession?: GuestSession;
  /** True when the server layout rendered the signed-in shell (sidebar). */
  isSignedIn: boolean;
  /** Server-resolved session from the chat layout — authoritative when client cookies lag */
  serverSession?: AppSession | null;
};

const AuthContext = createContext<AuthContextType>({
  isAuthDisabled: false,
  isPersistenceDisabled: false,
  isSignedIn: false,
  serverSession: null,
});

export function SessionProvider({
  children,
  isAuthDisabled,
  isPersistenceDisabled,
  guestSession,
  isSignedIn,
  serverSession,
}: {
  children: React.ReactNode;
  isAuthDisabled: boolean;
  isPersistenceDisabled: boolean;
  guestSession?: GuestSession;
  isSignedIn: boolean;
  serverSession?: AppSession | null;
}) {
  return (
    <AuthContext.Provider
      value={{
        isAuthDisabled,
        isPersistenceDisabled,
        guestSession,
        isSignedIn,
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
