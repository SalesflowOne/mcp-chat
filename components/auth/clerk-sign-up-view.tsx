'use client';

import { SignUp, useAuth, useClerk } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { isClerkSatelliteApp } from '@/lib/clerk-config';

export function ClerkSignUpView() {
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
      const signUpUrl = clerk.buildSignUpUrl({
        redirectUrl: `${window.location.origin}/`,
      });
      window.location.href = signUpUrl;
    } catch (error) {
      console.error('Failed to build Clerk sign-up URL', error);
      setRedirecting(false);
    }
  }, [isLoaded, isSignedIn, isSatellite, clerk, clerk.loaded, router]);

  if (!isLoaded || redirecting) {
    return (
      <div className="flex flex-col items-center gap-3 text-center max-w-md">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground border-t-foreground" />
        <p className="text-sm text-muted-foreground">
          {isSatellite
            ? 'Redirecting to One OS sign up…'
            : 'Loading sign up…'}
        </p>
      </div>
    );
  }

  return (
    <SignUp
      routing="path"
      path="/sign-up"
      signInUrl="/sign-in"
      fallbackRedirectUrl="/"
    />
  );
}
