'use client';

import { useClerk } from '@clerk/nextjs';
import { useEffect } from 'react';

import {
  getClerkForceRedirectUrl,
  isClerkSatelliteApp,
} from '@/lib/clerk-config';

type SatelliteAuthRedirectProps = {
  mode: 'sign-in' | 'sign-up';
};

/**
 * Satellites must use Clerk.buildSignInUrl() / buildSignUpUrl() so the return URL
 * includes __clerk_sync — hardcoded Account Portal links skip session sync.
 */
export function SatelliteAuthRedirect({ mode }: SatelliteAuthRedirectProps) {
  const clerk = useClerk();

  useEffect(() => {
    if (!isClerkSatelliteApp()) {
      return;
    }

    if (!clerk.loaded) {
      return;
    }

    const returnUrl = getClerkForceRedirectUrl('/');

    const targetUrl =
      mode === 'sign-in'
        ? clerk.buildSignInUrl({ signInForceRedirectUrl: returnUrl })
        : clerk.buildSignUpUrl({ signUpForceRedirectUrl: returnUrl });

    window.location.replace(targetUrl);
  }, [clerk.loaded, mode, clerk]);

  return (
    <div className="flex min-h-dvh w-full flex-col items-center justify-center gap-3 p-4 text-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground border-t-foreground" />
      <p className="text-sm text-muted-foreground">
        Redirecting to sign {mode === 'sign-in' ? 'in' : 'up'}…
      </p>
    </div>
  );
}
