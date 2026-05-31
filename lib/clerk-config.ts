/**
 * Clerk multi-domain (satellite) configuration for One OS.
 * agentops.one is a satellite; sign-in runs on the primary domain.
 */

const DEFAULT_SATELLITE_DOMAIN = 'agentops.one';

const DEFAULT_PRIMARY_SIGN_IN_URL = 'https://sso.oneaccess.one/sign-in';
const DEFAULT_PRIMARY_SIGN_UP_URL = 'https://sso.oneaccess.one/sign-up';

export function isClerkSatelliteApp(): boolean {
  return (
    process.env.NEXT_PUBLIC_CLERK_IS_SATELLITE === 'true' ||
    Boolean(process.env.NEXT_PUBLIC_CLERK_DOMAIN?.trim())
  );
}

export function getClerkSatelliteDomain(): string {
  return (
    process.env.NEXT_PUBLIC_CLERK_DOMAIN?.trim() || DEFAULT_SATELLITE_DOMAIN
  );
}

export function getClerkPrimarySignInUrl(): string {
  const url = process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL?.trim();
  if (url?.startsWith('http')) {
    return url;
  }
  return DEFAULT_PRIMARY_SIGN_IN_URL;
}

export function getClerkPrimarySignUpUrl(): string {
  const url = process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL?.trim();
  if (url?.startsWith('http')) {
    return url;
  }
  return DEFAULT_PRIMARY_SIGN_UP_URL;
}

export function getClerkMiddlewareOptions() {
  if (!isClerkSatelliteApp()) {
    return undefined;
  }

  return {
    isSatellite: true,
    domain: getClerkSatelliteDomain(),
    signInUrl: getClerkPrimarySignInUrl(),
    signUpUrl: getClerkPrimarySignUpUrl(),
    satelliteAutoSync: true,
  };
}
