'use client';

import { createContext, useContext } from 'react';

import { GuestSession } from '@/types/user';

type AuthContextType = {
  isAuthDisabled: boolean;
  isPersistenceDisabled: boolean;
  guestSession?: GuestSession;
};

const AuthContext = createContext<AuthContextType>({
  isAuthDisabled: false,
  isPersistenceDisabled: false,
});

export function SessionProvider({
  children,
  isAuthDisabled,
  isPersistenceDisabled,
  guestSession,
}: {
  children: React.ReactNode;
  isAuthDisabled: boolean;
  isPersistenceDisabled: boolean;
  guestSession?: GuestSession;
}) {
  return (
    <AuthContext.Provider
      value={{ isAuthDisabled, isPersistenceDisabled, guestSession }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  return useContext(AuthContext);
}
