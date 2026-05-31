'use client';

import { ClerkProvider } from '@clerk/nextjs';

import {
  getClerkPrimarySignInUrl,
  getClerkPrimarySignUpUrl,
  getClerkSatelliteDomain,
  isClerkSatelliteApp,
} from '@/lib/clerk-config';

const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export function AppClerkProvider({ children }: { children: React.ReactNode }) {
  if (!publishableKey?.startsWith('pk_')) {
    return <>{children}</>;
  }

  const isSatellite = isClerkSatelliteApp();

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      isSatellite={isSatellite}
      domain={isSatellite ? getClerkSatelliteDomain() : undefined}
      signInUrl={isSatellite ? getClerkPrimarySignInUrl() : '/sign-in'}
      signUpUrl={isSatellite ? getClerkPrimarySignUpUrl() : '/sign-up'}
      signInFallbackRedirectUrl="/"
      signUpFallbackRedirectUrl="/"
      satelliteAutoSync
    >
      {children}
    </ClerkProvider>
  );
}
