'use client';

import type { ComponentProps } from 'react';

import { useSatelliteAuthUrl } from '@/hooks/use-satellite-auth-url';
import { isClerkSatelliteApp } from '@/lib/clerk-config';

type SatelliteAuthLinkProps = ComponentProps<'a'> & {
  mode: 'sign-in' | 'sign-up';
  returnPath?: string;
};

export function SatelliteAuthLink({
  mode,
  returnPath = '/',
  href: hrefProp,
  ...props
}: SatelliteAuthLinkProps) {
  const clerkHref = useSatelliteAuthUrl(mode, returnPath);
  const href = hrefProp ?? clerkHref;

  if (!isClerkSatelliteApp()) {
    return <a {...props} href={href} />;
  }

  return <a {...props} href={href} />;
}
