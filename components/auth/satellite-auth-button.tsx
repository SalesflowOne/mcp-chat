'use client';

import { useAuth, useClerk } from '@clerk/nextjs';
import type { ComponentProps } from 'react';

import { Button } from '@/components/ui/button';
import {
  buildAccountPortalSignInUrl,
  buildAccountPortalSignUpUrl,
  getClerkForceRedirectUrl,
  isClerkSatelliteApp,
} from '@/lib/clerk-config';

type SatelliteAuthButtonProps = Omit<ComponentProps<typeof Button>, 'onClick'> & {
  mode: 'sign-in' | 'sign-up';
  returnPath?: string;
  onNavigate?: () => void;
};

/**
 * Full-page redirect to the shared Account Portal using Clerk's satellite-aware
 * redirect helpers. Avoids AlertDialog / client-router swallowing <a> navigation.
 */
export function SatelliteAuthButton({
  mode,
  returnPath = '/',
  onNavigate,
  disabled,
  children,
  ...props
}: SatelliteAuthButtonProps) {
  const { isLoaded } = useAuth();
  const clerk = useClerk();

  const handleClick = async () => {
    onNavigate?.();

    const redirectUrl = getClerkForceRedirectUrl(returnPath);
    const fallback =
      mode === 'sign-in'
        ? buildAccountPortalSignInUrl(returnPath)
        : buildAccountPortalSignUpUrl(returnPath);

    if (!isClerkSatelliteApp()) {
      window.location.assign(mode === 'sign-in' ? '/sign-in' : '/sign-up');
      return;
    }

    if (!isLoaded || !clerk.loaded) {
      window.location.assign(fallback);
      return;
    }

    try {
      if (mode === 'sign-in') {
        await clerk.redirectToSignIn({ redirectUrl });
      } else {
        await clerk.redirectToSignUp({ redirectUrl });
      }
    } catch {
      window.location.assign(fallback);
    }
  };

  return (
    <Button
      type="button"
      disabled={disabled}
      onClick={() => {
        void handleClick();
      }}
      {...props}
    >
      {children}
    </Button>
  );
}
