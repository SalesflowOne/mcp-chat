'use client';

import { useClerk } from '@clerk/nextjs';
import type { ComponentProps } from 'react';

import {
  buildAccountPortalSignInUrl,
  buildAccountPortalSignUpUrl,
  getClerkForceRedirectUrl,
  isClerkSatelliteApp,
} from '@/lib/clerk-config';

type SatelliteAuthLinkProps = ComponentProps<'a'> & {
  mode: 'sign-in' | 'sign-up';
};

/**
 * Resolves the correct Account Portal URL with satellite sync params when Clerk is loaded.
 */
export function SatelliteAuthLink({
  mode,
  href: hrefProp,
  onClick,
  ...props
}: SatelliteAuthLinkProps) {
  const clerk = useClerk();

  let href = hrefProp;
  if (!href && isClerkSatelliteApp()) {
    const returnUrl = getClerkForceRedirectUrl('/');
    if (clerk.loaded) {
      href =
        mode === 'sign-in'
          ? clerk.buildSignInUrl({ signInForceRedirectUrl: returnUrl })
          : clerk.buildSignUpUrl({ signUpForceRedirectUrl: returnUrl });
    } else {
      href =
        mode === 'sign-in'
          ? buildAccountPortalSignInUrl('/')
          : buildAccountPortalSignUpUrl('/');
    }
  }

  return (
    <a
      {...props}
      href={href ?? '#'}
      onClick={(event) => {
        if (!clerk.loaded && isClerkSatelliteApp()) {
          event.preventDefault();
          const url =
            mode === 'sign-in'
              ? buildAccountPortalSignInUrl('/')
              : buildAccountPortalSignUpUrl('/');
          window.location.href = url;
        }
        onClick?.(event);
      }}
    />
  );
}
