'use client';

import { SignIn, useAuth, useClerk } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { isClerkSatelliteApp, isClerkStandaloneAuth } from '@/lib/clerk-config';

export function ClerkSignInView() {
  const { isLoaded, isSignedIn } = useAuth();
  const clerk = useClerk();
  const router = useRouter();
  const isSatellite = isClerkSatelliteApp();
  const isStandalone = isClerkStandaloneAuth();
  const [redirecting, setRedirecting] = useState(isSatellite && !isStandalone);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (isSignedIn) {
      router.replace('/');
      return;
    }

    if (isStandalone || !isSatellite) {
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
  }, [isLoaded, isSignedIn, isSatellite, isStandalone, clerk, clerk.loaded, router]);

  if (!isLoaded || redirecting) {
    return (
      <div className="flex max-w-md flex-col items-center gap-3 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground border-t-foreground" />
        <p className="text-sm text-muted-foreground">
          {redirecting ? 'Redirecting to sign in…' : 'Loading sign in…'}
        </p>
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
