'use client';

import { useEffect } from 'react';

import {
  buildAccountPortalSignInUrl,
  buildAccountPortalSignUpUrl,
  isClerkSatelliteApp,
} from '@/lib/clerk-config';

type SatelliteAuthRedirectProps = {
  mode: 'sign-in' | 'sign-up';
};

/**
 * Sends users to the agentops Account Portal with force redirect back to agentops.one.
 * Does not use buildSignInUrl() — that can follow Clerk instance paths to oneaccess.one.
 */
export function SatelliteAuthRedirect({ mode }: SatelliteAuthRedirectProps) {
  useEffect(() => {
    if (!isClerkSatelliteApp()) {
      return;
    }

    const targetUrl =
      mode === 'sign-in'
        ? buildAccountPortalSignInUrl('/')
        : buildAccountPortalSignUpUrl('/');

    window.location.replace(targetUrl);
  }, [mode]);

  return (
    <div className="flex min-h-dvh w-full flex-col items-center justify-center gap-3 p-4 text-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground border-t-foreground" />
      <p className="text-sm text-muted-foreground">
        Redirecting to sign {mode === 'sign-in' ? 'in' : 'up'}…
      </p>
    </div>
  );
}
