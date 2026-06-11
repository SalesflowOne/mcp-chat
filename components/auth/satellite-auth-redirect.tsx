'use client';

import { useAuth } from '@clerk/nextjs';
import { useEffect } from 'react';

import { useSatelliteAuthUrl } from '@/hooks/use-satellite-auth-url';
import { isClerkSatelliteApp } from '@/lib/clerk-config';

type SatelliteAuthRedirectProps = {
  mode: 'sign-in' | 'sign-up';
  returnPath?: string;
};

/**
 * Sends users to the shared Account Portal with Clerk's satellite sync trigger so
 * the session is recognized when they return to agentops.one.
 */
export function SatelliteAuthRedirect({
  mode,
  returnPath = '/',
}: SatelliteAuthRedirectProps) {
  const { isLoaded } = useAuth();
  const targetUrl = useSatelliteAuthUrl(mode, returnPath);

  useEffect(() => {
    if (!isClerkSatelliteApp() || !isLoaded) {
      return;
    }

    window.location.replace(targetUrl);
  }, [isLoaded, mode, returnPath, targetUrl]);

  return (
    <div className="flex min-h-dvh w-full flex-col items-center justify-center gap-3 p-4 text-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground border-t-foreground" />
      <p className="text-sm text-muted-foreground">
        Redirecting to sign {mode === 'sign-in' ? 'in' : 'up'}…
      </p>
    </div>
  );
}
