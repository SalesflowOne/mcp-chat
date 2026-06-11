'use client';

import { useAuth, useClerk } from '@clerk/nextjs';
import { useMemo } from 'react';

import {
  buildAccountPortalSignInUrl,
  buildAccountPortalSignUpUrl,
  getClerkForceRedirectUrl,
  isClerkSatelliteApp,
} from '@/lib/clerk-config';

type SatelliteAuthMode = 'sign-in' | 'sign-up';

/**
 * Clerk satellite sign-in URLs must come from buildSignInUrl/buildSignUpUrl so the
 * __clerk_synced sync trigger is attached. Hardcoded portal URLs leave users signed
 * out on agentops.one after authenticating on accounts.oneaccess.one.
 */
export function useSatelliteAuthUrl(
  mode: SatelliteAuthMode,
  returnPath = '/',
) {
  const { isLoaded } = useAuth();
  const clerk = useClerk();
  const isSatellite = isClerkSatelliteApp();

  return useMemo(() => {
    if (!isSatellite) {
      return mode === 'sign-in' ? '/sign-in' : '/sign-up';
    }

    const redirectUrl = getClerkForceRedirectUrl(returnPath);
    const fallback =
      mode === 'sign-in'
        ? buildAccountPortalSignInUrl(returnPath)
        : buildAccountPortalSignUpUrl(returnPath);

    if (!isLoaded || !clerk.loaded) {
      return fallback;
    }

    try {
      return mode === 'sign-in'
        ? clerk.buildSignInUrl({ redirectUrl })
        : clerk.buildSignUpUrl({ redirectUrl });
    } catch {
      return fallback;
    }
  }, [clerk, isLoaded, isSatellite, mode, returnPath]);
}
