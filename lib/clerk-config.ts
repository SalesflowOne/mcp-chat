/**
 * Clerk configuration for agentops.one (satellite domain on One OS instance).
 *
 * Clerk Account Portal (primary sign-in, until agentops DNS exists):
 *   https://accounts.oneaccess.one/sign-in
 *
 * Embedded <SignIn /> is blocked on satellite domains by Clerk.
 */

export const DEFAULT_SATELLITE_DOMAIN = 'agentops.one';

/**
 * Clerk Account Portal hostnames (same One OS instance).
 * accounts.agentops.one — preferred branding; requires DNS (CNAME → accounts.clerk.services)
 * accounts.oneaccess.one — live today; use until agentops Account Portal DNS is added
 */
export const CLERK_ACCOUNT_PORTAL_AGENTOPS_SIGN_IN_URL =
  'https://accounts.agentops.one/sign-in';

export const CLERK_ACCOUNT_PORTAL_AGENTOPS_SIGN_UP_URL =
  'https://accounts.agentops.one/sign-up';

/** Working Account Portal for this Clerk instance (DNS verified) */
export const CLERK_ACCOUNT_PORTAL_SIGN_IN_URL =
  'https://accounts.oneaccess.one/sign-in';

export const CLERK_ACCOUNT_PORTAL_SIGN_UP_URL =
  'https://accounts.oneaccess.one/sign-up';

export function isClerkSatelliteApp(): boolean {
  const flag = process.env.NEXT_PUBLIC_CLERK_IS_SATELLITE?.trim().toLowerCase();
  if (flag === 'true') {
    return true;
  }
  if (flag === 'false') {
    return false;
  }
  // agentops.one is a Clerk satellite — default on when sign-in is on Account Portal
  const signInUrl = getClerkPrimarySignInUrl();
  if (
    signInUrl.startsWith('http') &&
    !signInUrl.includes(getClerkSatelliteDomain())
  ) {
    return true;
  }
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() ?? '';
  return appUrl.includes(DEFAULT_SATELLITE_DOMAIN);
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
  return CLERK_ACCOUNT_PORTAL_SIGN_IN_URL;
}

export function getClerkPrimarySignUpUrl(): string {
  const url = process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL?.trim();
  if (url?.startsWith('http')) {
    return url;
  }
  return CLERK_ACCOUNT_PORTAL_SIGN_UP_URL;
}

export function buildSatelliteReturnUrl(path = '/'): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    `https://${getClerkSatelliteDomain()}`;
  return new URL(path, base.endsWith('/') ? base : `${base}/`).toString();
}

export function buildAccountPortalSignInUrl(returnPath = '/'): string {
  const signIn = new URL(getClerkPrimarySignInUrl());
  signIn.searchParams.set(
    'redirect_url',
    buildSatelliteReturnUrl(returnPath),
  );
  return signIn.toString();
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
    satelliteAutoSync: false,
  };
}
