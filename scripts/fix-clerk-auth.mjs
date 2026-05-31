#!/usr/bin/env node
/**
 * Clerk fixes for agentops.one satellite — no oneaccess.one redirects.
 * Requires CLERK_SECRET_KEY.
 */
const secret = process.env.CLERK_SECRET_KEY?.trim();
if (!secret?.startsWith('sk_')) {
  console.error('CLERK_SECRET_KEY (sk_*) is required');
  process.exit(1);
}

const AGENTOPS_SATELLITE_DOMAIN_ID = 'dmn_3ET5dadhn3yLUlfoD75rlV1SOH8';
const ALLOWED_ORIGINS = [
  'https://agentops.one',
  'https://www.agentops.one',
  'https://accounts.agentops.one',
];
const PROXY_URL = 'https://agentops.one/__clerk';

async function clerkFetch(path, init = {}) {
  const res = await fetch(`https://api.clerk.com/v1${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { ok: res.ok, status: res.status, body };
}

async function main() {
  console.log('Patching allowed_redirect_origins (agentops only)…');
  const instance = await clerkFetch('/instance', {
    method: 'PATCH',
    body: JSON.stringify({ allowed_redirect_origins: ALLOWED_ORIGINS }),
  });
  console.log(instance.ok ? '  OK' : `  FAILED ${instance.status}`, instance.body?.errors ?? '');

  console.log('Configuring agentops.one FAPI proxy…');
  const domain = await clerkFetch(`/domains/${AGENTOPS_SATELLITE_DOMAIN_ID}`, {
    method: 'PATCH',
    body: JSON.stringify({ proxy_url: PROXY_URL }),
  });
  console.log(
    domain.ok ? `  OK → ${domain.body?.proxy_url ?? PROXY_URL}` : `  FAILED ${domain.status}`,
    domain.body?.errors ?? '',
  );

  console.log('\nClerk Dashboard → Configure → Paths (stop redirects to dead oneaccess.one):');
  console.log('  Home / After sign-in / After sign-up / Logo link → https://agentops.one');
  console.log('\nCloudflare DNS for agentops.one (required for sign-in UI):');
  console.log('  CNAME accounts → accounts.clerk.services');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
