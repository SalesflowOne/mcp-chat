'use client';

import { ClerkProvider } from '@clerk/nextjs';

import {
  getClerkPrimarySignInUrl,
  getClerkPrimarySignUpUrl,
  getClerkSatelliteDomain,
  isClerkSatelliteApp,
  isClerkStandaloneAuth,
} from '@/lib/clerk-config';

const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export function AppClerkProvider({ children }: { children: React.ReactNode }) {
  if (!publishableKey?.startsWith('pk_')) {
    return <>{children}</>;
  }

  const isSatellite = isClerkSatelliteApp();
  const isStandalone = isClerkStandaloneAuth();
  const primarySignIn = getClerkPrimarySignInUrl();
  const primarySignUp = getClerkPrimarySignUpUrl();

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      isSatellite={isSatellite}
      domain={isSatellite ? getClerkSatelliteDomain() : undefined}
      signInUrl={primarySignIn ?? '/sign-in'}
      signUpUrl={primarySignUp ?? '/sign-up'}
      signInFallbackRedirectUrl="/"
      signUpFallbackRedirectUrl="/"
      satelliteAutoSync={isSatellite && !isStandalone}
    >
      {children}
    </ClerkProvider>
  );
}
