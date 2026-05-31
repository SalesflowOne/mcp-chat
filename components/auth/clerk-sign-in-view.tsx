'use client';

import { SignIn, useAuth, useClerk } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { isClerkSatelliteApp } from '@/lib/clerk-config';

export function ClerkSignInView() {
  const { isLoaded, isSignedIn } = useAuth();
  const clerk = useClerk();
  const router = useRouter();
  const isSatellite = isClerkSatelliteApp();
  const [redirecting, setRedirecting] = useState(isSatellite);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (isSignedIn) {
      router.replace('/');
      return;
    }

    if (!isSatellite) {
      setRedirecting(false);
      return;
    }

    if (!clerk.loaded) {
      return;
    }

    try {
      const signInUrl = clerk.buildSignInUrl({
        redirectUrl: `${window.location.origin}/`,
      });
      window.location.href = signInUrl;
    } catch (error) {
      console.error('Failed to build Clerk sign-in URL', error);
      setRedirecting(false);
    }
  }, [isLoaded, isSignedIn, isSatellite, clerk, clerk.loaded, router]);

  if (!isLoaded || redirecting) {
    return (
      <div className="flex flex-col items-center gap-3 text-center max-w-md">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground border-t-foreground" />
        <p className="text-sm text-muted-foreground">
          {isSatellite
            ? 'Redirecting to One OS sign in…'
            : 'Loading sign in…'}
        </p>
        {isSatellite ? (
          <p className="text-xs text-muted-foreground">
            agentops.one uses shared One OS authentication. You will return here
            after signing in.
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <SignIn
      routing="path"
      path="/sign-in"
      signUpUrl="/sign-up"
      fallbackRedirectUrl="/"
    />
  );
}
