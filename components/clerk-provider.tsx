'use client';

import { ClerkProvider } from '@clerk/nextjs';

import {
  getClerkForceRedirectUrl,
  getClerkPrimarySignInUrl,
  getClerkPrimarySignUpUrl,
  getClerkProxyUrl,
  getClerkSatelliteDomain,
  isClerkSatelliteApp,
} from '@/lib/clerk-config';

const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export function AppClerkProvider({ children }: { children: React.ReactNode }) {
  if (!publishableKey?.startsWith('pk_')) {
    return <>{children}</>;
  }

  const isSatellite = isClerkSatelliteApp();
  const forceRedirectUrl = isSatellite ? getClerkForceRedirectUrl('/') : undefined;
  const proxyUrl = isSatellite ? getClerkProxyUrl() : undefined;

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      isSatellite={isSatellite}
      {...(proxyUrl
        ? { proxyUrl }
        : isSatellite
          ? { domain: getClerkSatelliteDomain() }
          : {})}
      signInUrl={getClerkPrimarySignInUrl()}
      signUpUrl={getClerkPrimarySignUpUrl()}
      signInFallbackRedirectUrl={forceRedirectUrl ?? '/'}
      signUpFallbackRedirectUrl={forceRedirectUrl ?? '/'}
      signInForceRedirectUrl={forceRedirectUrl}
      signUpForceRedirectUrl={forceRedirectUrl}
      satelliteAutoSync={isSatellite}
    >
      {children}
    </ClerkProvider>
  );
}
