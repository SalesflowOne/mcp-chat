#!/usr/bin/env node
/**
 * Clerk fixes for agentops.one satellite auth.
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
  'https://accounts.oneaccess.one',
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
  console.log('Patching instance settings (redirect origins + URL session sync)…');
  const instance = await clerkFetch('/instance', {
    method: 'PATCH',
    body: JSON.stringify({
      allowed_redirect_origins: ALLOWED_ORIGINS,
      url_based_session_syncing: true,
    }),
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

  const envRes = await fetch('https://clerk.oneaccess.one/v1/environment');
  if (envRes.ok) {
    const env = await envRes.json();
    const dc = env.display_config;
    console.log('\nClerk instance paths (update in Dashboard if still wrong):');
    console.log('  home_url:', dc.home_url);
    console.log('  after_sign_in_url:', dc.after_sign_in_url);
  }

  console.log('\nDashboard → Configure → Paths: set all to https://agentops.one');
  console.log('Dashboard → Domains → agentops.one: verify accounts CNAME for accounts.agentops.one');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
