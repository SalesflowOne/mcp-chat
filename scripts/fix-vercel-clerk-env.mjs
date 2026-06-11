#!/usr/bin/env node
/**
 * Fix Clerk + AI env vars on agentops-mcp-chat (production).
 * Production had empty "sensitive" entries — server auth() fails while client may still show signed-in UI.
 */
const TEAM_ID = 'team_Na274IDFwAHRPi5JdFrzvRUk';
const TARGET_PROJECT = 'prj_9k6rLDi9UP0YMf1QfuMgSi9yirJH';

const token = process.env.VERCEL_TOKEN;
if (!token) {
  console.error('VERCEL_TOKEN is required');
  process.exit(1);
}

const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim();
const secretKey = process.env.CLERK_SECRET_KEY?.trim();
const openaiKey = process.env.OPENAI_API_KEY?.trim();
const anthropicKey = process.env.ANTHROPIC_API_KEY?.trim();
const signUpUrl =
  process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL?.trim() ||
  'https://accounts.oneaccess.one/sign-up';

if (!publishableKey?.startsWith('pk_')) {
  console.error('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY (pk_*) is required');
  process.exit(1);
}
if (!secretKey?.startsWith('sk_')) {
  console.error('CLERK_SECRET_KEY (sk_*) is required');
  process.exit(1);
}

const KEYS = {
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: publishableKey,
  CLERK_SECRET_KEY: secretKey,
  NEXT_PUBLIC_CLERK_IS_SATELLITE: 'true',
  NEXT_PUBLIC_CLERK_DOMAIN: 'agentops.one',
  NEXT_PUBLIC_CLERK_PROXY_URL: 'https://agentops.one/__clerk',
  NEXT_PUBLIC_CLERK_SIGN_IN_URL: 'https://accounts.oneaccess.one/sign-in',
  NEXT_PUBLIC_CLERK_SIGN_UP_URL: signUpUrl,
  NEXT_PUBLIC_APP_URL: 'https://agentops.one',
  NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL: 'https://agentops.one/',
  NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL: 'https://agentops.one/',
  NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL: 'https://agentops.one/',
  NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL: 'https://agentops.one/',
  DISABLE_AUTH: 'false',
};

if (openaiKey) {
  KEYS.OPENAI_API_KEY = openaiKey;
}
if (anthropicKey) {
  KEYS.ANTHROPIC_API_KEY = anthropicKey;
}

const headers = {
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
};

async function fetchEnv() {
  const res = await globalThis.fetch(
    `https://api.vercel.com/v9/projects/${TARGET_PROJECT}/env?decrypt=true&teamId=${TEAM_ID}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) throw new Error(`fetch env failed: ${res.status}`);
  const data = await res.json();
  return data.envs ?? [];
}

async function deleteEnv(id, key) {
  const res = await globalThis.fetch(
    `https://api.vercel.com/v9/projects/${TARGET_PROJECT}/env/${id}?teamId=${TEAM_ID}`,
    { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok && res.status !== 404) {
    throw new Error(`delete ${key} failed: ${res.status}`);
  }
  console.log(`Deleted ${key} (${id})`);
}

async function upsertPlain(key, value) {
  const envs = await fetchEnv();
  const existing = envs.filter((e) => e.key === key);
  for (const entry of existing) {
    await deleteEnv(entry.id, key);
  }

  const res = await globalThis.fetch(
    `https://api.vercel.com/v10/projects/${TARGET_PROJECT}/env?teamId=${TEAM_ID}`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({
        key,
        value,
        type: 'plain',
        target: ['production', 'preview'],
      }),
    },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`set ${key} failed: ${res.status} ${text}`);
  }
  console.log(`Set ${key} (plain)`);
}

for (const [key, value] of Object.entries(KEYS)) {
  await upsertPlain(key, value);
}

const verify = await fetchEnv();
for (const key of Object.keys(KEYS)) {
  const entry = verify.find(
    (e) => e.key === key && e.target?.includes('production'),
  );
  const v = entry?.value ?? '';
  let ok = v.length > 0;
  if (key === 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY') ok = v.startsWith('pk_');
  if (key === 'CLERK_SECRET_KEY') ok = v.startsWith('sk_');
  if (key === 'OPENAI_API_KEY') ok = v.startsWith('sk-');
  if (key === 'ANTHROPIC_API_KEY') ok = v.startsWith('sk-ant-');
  console.log(`Verify ${key}: type=${entry?.type} len=${v.length} ok=${ok}`);
}

console.log('Done. Redeploy agentops-mcp-chat for changes to take effect.');
