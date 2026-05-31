/**
 * Clerk configuration for agentops.one (satellite on the shared One OS Clerk instance).
 *
 * Sign-in uses the Account Portal on accounts.agentops.one (never apex oneaccess.one).
 * Embedded <SignIn /> is blocked on satellite domains by Clerk.
 */

export const DEFAULT_SATELLITE_DOMAIN = 'agentops.one';

export const DEFAULT_APP_ORIGIN = 'https://agentops.one';

export const CLERK_FAPI_PROXY_PATH = '/__clerk';

/** Account Portal on the agentops satellite domain (CNAME → accounts.clerk.services). */
export const CLERK_ACCOUNT_PORTAL_SIGN_IN_URL =
  'https://accounts.agentops.one/sign-in';

export const CLERK_ACCOUNT_PORTAL_SIGN_UP_URL =
  'https://accounts.agentops.one/sign-up';

/** Satellite sign-in routes — not the Account Portal (avoids oneaccess.* in ClerkProvider). */
export const CLERK_SATELLITE_SIGN_IN_PATH = '/sign-in';
export const CLERK_SATELLITE_SIGN_UP_PATH = '/sign-up';

export function isClerkSatelliteApp(): boolean {
  const flag = process.env.NEXT_PUBLIC_CLERK_IS_SATELLITE?.trim().toLowerCase();
  if (flag === 'true') {
    return true;
  }
  if (flag === 'false') {
    return false;
  }
  const signInUrl = process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL?.trim();
  if (signInUrl?.startsWith('http') && !signInUrl.includes(getClerkSatelliteDomain())) {
    return true;
  }
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() ?? '';
  return appUrl.includes('agentops.one');
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

/** Paths on agentops.one used for ClerkProvider signInUrl / signUpUrl (satellite sync entry). */
export function getClerkSatelliteSignInPath(): string {
  return CLERK_SATELLITE_SIGN_IN_PATH;
}

export function getClerkSatelliteSignUpPath(): string {
  return CLERK_SATELLITE_SIGN_UP_PATH;
}

export function getAppOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured?.startsWith('http')) {
    return configured.replace(/\/$/, '');
  }
  return DEFAULT_APP_ORIGIN;
}

export function buildSatelliteReturnUrl(path = '/'): string {
  const base = getAppOrigin();
  return new URL(path, `${base}/`).toString();
}

export function appendSatelliteSyncParam(url: string): string {
  const parsed = new URL(url);
  if (!parsed.searchParams.has('__clerk_sync')) {
    parsed.searchParams.set('__clerk_sync', '1');
  }
  return parsed.toString();
}

export function getClerkProxyUrl(): string | undefined {
  const fromEnv = process.env.NEXT_PUBLIC_CLERK_PROXY_URL?.trim();
  if (fromEnv?.startsWith('http')) {
    return fromEnv.replace(/\/$/, '');
  }
  if (!isClerkSatelliteApp()) {
    return undefined;
  }
  return `https://${getClerkSatelliteDomain()}${CLERK_FAPI_PROXY_PATH}`;
}

export function getClerkForceRedirectUrl(path = '/'): string {
  const forced = process.env.NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL?.trim();
  if (forced?.startsWith('http')) {
    return forced;
  }
  return buildSatelliteReturnUrl(path);
}

function applyAccountPortalRedirectParams(
  portalUrl: URL,
  mode: 'sign-in' | 'sign-up',
  returnPath: string,
): void {
  const forceRedirect = getClerkForceRedirectUrl(returnPath);
  const returnUrl = appendSatelliteSyncParam(forceRedirect);

  portalUrl.searchParams.set('redirect_url', returnUrl);
  // Override Clerk instance defaults (home_url still points at dead oneaccess.one).
  if (mode === 'sign-in') {
    portalUrl.searchParams.set('sign_in_force_redirect_url', forceRedirect);
  } else {
    portalUrl.searchParams.set('sign_up_force_redirect_url', forceRedirect);
  }
}

export function buildAccountPortalSignInUrl(returnPath = '/'): string {
  const signIn = new URL(getClerkPrimarySignInUrl());
  applyAccountPortalRedirectParams(signIn, 'sign-in', returnPath);
  return signIn.toString();
}

export function buildAccountPortalSignUpUrl(returnPath = '/'): string {
  const signUp = new URL(getClerkPrimarySignUpUrl());
  applyAccountPortalRedirectParams(signUp, 'sign-up', returnPath);
  return signUp.toString();
}

export function getClerkMiddlewareOptions() {
  if (!isClerkSatelliteApp()) {
    return undefined;
  }

  const proxyUrl = getClerkProxyUrl();
  const options: Record<string, unknown> = {
    isSatellite: true,
    signInUrl: getClerkSatelliteSignInPath(),
    signUpUrl: getClerkSatelliteSignUpPath(),
    satelliteAutoSync: false,
    frontendApiProxy: {
      enabled: true,
      path: CLERK_FAPI_PROXY_PATH,
    },
  };

  if (proxyUrl) {
    options.proxyUrl = proxyUrl;
  } else {
    options.domain = getClerkSatelliteDomain();
  }

  return options;
}
