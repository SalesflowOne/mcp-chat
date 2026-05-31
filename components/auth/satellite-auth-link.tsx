'use client';

import type { ComponentProps } from 'react';

import {
  buildAccountPortalSignInUrl,
  buildAccountPortalSignUpUrl,
  isClerkSatelliteApp,
} from '@/lib/clerk-config';

type SatelliteAuthLinkProps = ComponentProps<'a'> & {
  mode: 'sign-in' | 'sign-up';
};

export function SatelliteAuthLink({
  mode,
  href: hrefProp,
  ...props
}: SatelliteAuthLinkProps) {
  const href =
    hrefProp ??
    (mode === 'sign-in'
      ? buildAccountPortalSignInUrl('/')
      : buildAccountPortalSignUpUrl('/'));

  if (!isClerkSatelliteApp()) {
    return <a {...props} href={href} />;
  }

  return <a {...props} href={href} />;
}
