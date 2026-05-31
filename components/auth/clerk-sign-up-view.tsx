'use client';

import { SignUp } from '@clerk/nextjs';
import { useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';

export function ClerkSignUpView() {
  const { isLoaded } = useAuth();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!isLoaded) {
        setTimedOut(true);
      }
    }, 12_000);
    return () => window.clearTimeout(timer);
  }, [isLoaded]);

  if (!isLoaded) {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground border-t-foreground" />
        <p className="text-sm text-muted-foreground">Loading sign up…</p>
        {timedOut ? (
          <p className="max-w-sm text-xs text-muted-foreground">
            Clerk is taking longer than expected. Confirm{' '}
            <strong>agentops.one</strong> is added under Clerk → Domains, then
            refresh.
          </p>
        ) : null}
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
