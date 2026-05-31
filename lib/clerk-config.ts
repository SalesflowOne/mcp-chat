/**
 * Clerk configuration for agentops.one (satellite domain on One OS instance).
 *
 * Clerk Account Portal (primary sign-in, until agentops DNS exists):
 *   https://accounts.oneaccess.one/sign-in
 *
 * Embedded <SignIn /> is blocked on satellite domains by Clerk.
 */

/** Must match the hostname users browse (Vercel redirects apex → www). */
export const DEFAULT_SATELLITE_DOMAIN = 'www.agentops.one';

/** Production canonical app origin (Vercel redirects apex → www). */
export const DEFAULT_APP_ORIGIN = 'https://www.agentops.one';

/** Clerk FAPI proxy path on the satellite app (see DEPLOYMENT.md). */
export const CLERK_FAPI_PROXY_PATH = '/__clerk';

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

/**
 * Clerk Core 3 satellite handshake trigger (see clerk/javascript CHANGELOG).
 * Appended to return URLs when buildSignInUrl() is unavailable (SSR fallbacks).
 */
export function appendSatelliteSyncParam(url: string): string {
  const parsed = new URL(url);
  if (!parsed.searchParams.has('__clerk_sync')) {
    parsed.searchParams.set('__clerk_sync', '1');
  }
  return parsed.toString();
}

/** Proxy FAPI through the Next app when clerk.{domain} is blocked (must match Clerk domain settings). */
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

/** Absolute URL Clerk must use after auth — overrides dead oneaccess.one dashboard defaults when set. */
export function getClerkForceRedirectUrl(path = '/'): string {
  const forced = process.env.NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL?.trim();
  if (forced?.startsWith('http')) {
    return forced;
  }
  return buildSatelliteReturnUrl(path);
}

/**
 * Account Portal sign-in URL with satellite return params.
 * Clerk instance still has home_url/after_sign_in_url → oneaccess.one in dashboard;
 * redirect_url + force redirect env must point at agentops.one.
 */
export function buildAccountPortalSignInUrl(returnPath = '/'): string {
  const returnUrl = appendSatelliteSyncParam(buildSatelliteReturnUrl(returnPath));
  const signIn = new URL(getClerkPrimarySignInUrl());
  signIn.searchParams.set('redirect_url', returnUrl);
  return signIn.toString();
}

export function buildAccountPortalSignUpUrl(returnPath = '/'): string {
  const returnUrl = appendSatelliteSyncParam(buildSatelliteReturnUrl(returnPath));
  const signUp = new URL(getClerkPrimarySignUpUrl());
  signUp.searchParams.set('redirect_url', returnUrl);
  return signUp.toString();
}

export function getClerkMiddlewareOptions() {
  if (!isClerkSatelliteApp()) {
    return undefined;
  }

  const proxyUrl = getClerkProxyUrl();
  const options: Record<string, unknown> = {
    isSatellite: true,
    signInUrl: getClerkPrimarySignInUrl(),
    signUpUrl: getClerkPrimarySignUpUrl(),
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
