#!/usr/bin/env node
/**
 * One-time / repeatable Clerk fixes for agentops.one satellite auth.
 * Requires CLERK_SECRET_KEY. Does not print secrets.
 */
const secret = process.env.CLERK_SECRET_KEY?.trim();
if (!secret?.startsWith('sk_')) {
  console.error('CLERK_SECRET_KEY (sk_*) is required');
  process.exit(1);
}

const AGENTOPS_DOMAIN_ID = 'dmn_3ET5dadhn3yLUlfoD75rlV1SOH8';
const ALLOWED_ORIGINS = [
  'https://agentops.one',
  'https://www.agentops.one',
  'https://accounts.oneaccess.one',
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
  console.log('Patching Clerk instance allowed_redirect_origins…');
  const instance = await clerkFetch('/instance', {
    method: 'PATCH',
    body: JSON.stringify({ allowed_redirect_origins: ALLOWED_ORIGINS }),
  });
  console.log(instance.ok ? '  OK' : `  FAILED ${instance.status}`, instance.body?.errors ?? '');

  console.log('Configuring agentops.one satellite FAPI proxy…');
  const domain = await clerkFetch(`/domains/${AGENTOPS_DOMAIN_ID}`, {
    method: 'PATCH',
    body: JSON.stringify({ proxy_url: PROXY_URL }),
  });
  console.log(
    domain.ok ? `  OK → ${domain.body?.proxy_url ?? PROXY_URL}` : `  FAILED ${domain.status}`,
    domain.body?.errors ?? '',
  );

  console.log('\nClerk Dashboard (manual, required for dead oneaccess.one redirects):');
  console.log('  Configure → Paths → set Home / After sign-in / After sign-up to:');
  console.log('  https://www.agentops.one');
  console.log('  (API cannot set home_url to a satellite domain; apex oneaccess.one has no DNS)');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
