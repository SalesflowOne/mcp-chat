/**
 * Clerk multi-domain (satellite) configuration for One OS / agentops.one.
 *
 * agentops.one is listed as a Clerk satellite, but the legacy primary
 * (sso.oneaccess.one) is not live. When no valid external primary is configured,
 * we host sign-in directly on agentops.one (standalone auth).
 */

const DEFAULT_SATELLITE_DOMAIN = 'agentops.one';

/** Broken / retired — do not redirect here */
const RETIRED_PRIMARY_HOSTS = ['oneaccess.one', 'sso.oneaccess.one'];

export function isClerkStandaloneAuth(): boolean {
  if (process.env.NEXT_PUBLIC_CLERK_STANDALONE_AUTH === 'true') {
    return true;
  }
  if (process.env.NEXT_PUBLIC_CLERK_STANDALONE_AUTH === 'false') {
    return false;
  }

  const primarySignIn = process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL?.trim();
  if (!primarySignIn?.startsWith('http')) {
    return true;
  }

  try {
    const host = new URL(primarySignIn).hostname;
    if (RETIRED_PRIMARY_HOSTS.some((h) => host === h || host.endsWith(`.${h}`))) {
      return true;
    }
    if (host === DEFAULT_SATELLITE_DOMAIN || host === `www.${DEFAULT_SATELLITE_DOMAIN}`) {
      return true;
    }
  } catch {
    return true;
  }

  return false;
}

export function isClerkSatelliteApp(): boolean {
  if (isClerkStandaloneAuth()) {
    return false;
  }
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

export function getClerkPrimarySignInUrl(): string | undefined {
  if (isClerkStandaloneAuth()) {
    return undefined;
  }
  const url = process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL?.trim();
  return url?.startsWith('http') ? url : undefined;
}

export function getClerkPrimarySignUpUrl(): string | undefined {
  if (isClerkStandaloneAuth()) {
    return undefined;
  }
  const url = process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL?.trim();
  return url?.startsWith('http') ? url : undefined;
}

export function getClerkMiddlewareOptions() {
  if (!isClerkSatelliteApp()) {
    return undefined;
  }

  const signInUrl = getClerkPrimarySignInUrl();
  const signUpUrl = getClerkPrimarySignUpUrl();

  return {
    isSatellite: true,
    domain: getClerkSatelliteDomain(),
    ...(signInUrl ? { signInUrl } : {}),
    ...(signUpUrl ? { signUpUrl } : {}),
    satelliteAutoSync: false,
  };
}
