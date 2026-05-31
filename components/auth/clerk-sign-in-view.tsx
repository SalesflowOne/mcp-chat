'use client';

import { SignIn, useAuth } from '@clerk/nextjs';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import {
  buildAccountPortalSignInUrl,
  isClerkSatelliteApp,
} from '@/lib/clerk-config';

/** Non-satellite only — satellites redirect to Account Portal */
export function ClerkSignInView() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isClerkSatelliteApp()) {
      window.location.replace(buildAccountPortalSignInUrl('/'));
      return;
    }
    if (isLoaded && isSignedIn) {
      router.replace('/');
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded) {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground border-t-foreground" />
        <p className="text-sm text-muted-foreground">Loading sign in…</p>
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
