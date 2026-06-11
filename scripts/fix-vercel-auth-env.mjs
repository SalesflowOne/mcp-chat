#!/usr/bin/env node
/**
 * Remove leftover Clerk env vars and ensure Supabase Auth env on agentops-mcp-chat.
 */
const TEAM_ID = 'team_Na274IDFwAHRPi5JdFrzvRUk';
const TARGET_PROJECT = 'prj_9k6rLDi9UP0YMf1QfuMgSi9yirJH';

const CLERK_KEYS_TO_REMOVE = [
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'CLERK_SECRET_KEY',
  'NEXT_PUBLIC_CLERK_IS_SATELLITE',
  'NEXT_PUBLIC_CLERK_DOMAIN',
  'NEXT_PUBLIC_CLERK_PROXY_URL',
  'NEXT_PUBLIC_CLERK_SIGN_IN_URL',
  'NEXT_PUBLIC_CLERK_SIGN_UP_URL',
  'NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL',
  'NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL',
  'NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL',
  'NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL',
  'CLERK_FRONTEND_API_URL',
  'VITE_CLERK_PUBLISHABLE_KEY',
];

const token = process.env.VERCEL_TOKEN;
if (!token) {
  console.error('VERCEL_TOKEN is required');
  process.exit(1);
}

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
  console.log(`Removed ${key}`);
}

const envs = await fetchEnv();
for (const key of CLERK_KEYS_TO_REMOVE) {
  for (const entry of envs.filter((e) => e.key === key)) {
    await deleteEnv(entry.id, key);
  }
}

console.log('Done. Redeploy agentops-mcp-chat for changes to take effect.');
