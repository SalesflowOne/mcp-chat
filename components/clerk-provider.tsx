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
      signInUrl={getClerkPrimarySignInUrl()}
      signUpUrl={getClerkPrimarySignUpUrl()}
      signInFallbackRedirectUrl="/"
      signUpFallbackRedirectUrl="/"
      satelliteAutoSync={false}
    >
      {children}
    </ClerkProvider>
  );
}
