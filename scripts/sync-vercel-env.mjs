#!/usr/bin/env node
/**
 * Copy selected env vars from agent-workspace → agentops-mcp-chat (production).
 * Values are never printed. Requires VERCEL_TOKEN in the environment.
 */
import { execSync } from 'node:child_process';

const TEAM_ID = 'team_Na274IDFwAHRPi5JdFrzvRUk';
const SOURCE_PROJECT = 'prj_rfpkxF851mXoRPObhavjPsTFCpGC'; // agent-workspace
const TARGET_PROJECT = 'prj_9k6rLDi9UP0YMf1QfuMgSi9yirJH'; // agentops-mcp-chat

const KEYS_TO_COPY = [
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'VITE_CLERK_PUBLISHABLE_KEY',
  'CLERK_SECRET_KEY',
  'CLERK_FRONTEND_API_URL',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
];

const KEY_ALIASES = {
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: 'VITE_CLERK_PUBLISHABLE_KEY',
  NEXT_PUBLIC_SUPABASE_URL: 'SUPABASE_URL',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'SUPABASE_PUBLISHABLE_KEY',
};

const KEYS_TO_SET = {
  DISABLE_AUTH: 'false',
  DISABLE_PERSISTENCE: 'false',
  NEXT_PUBLIC_CLERK_SIGN_IN_URL: '/sign-in',
  NEXT_PUBLIC_CLERK_SIGN_UP_URL: '/sign-up',
  NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL: '/',
  NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL: '/',
};

const token = process.env.VERCEL_TOKEN;
if (!token) {
  console.error('VERCEL_TOKEN is required');
  process.exit(1);
}

async function fetchEnv(projectId) {
  const res = await fetch(
    `https://api.vercel.com/v9/projects/${projectId}/env?decrypt=true`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) {
    throw new Error(`Failed to fetch env for ${projectId}: ${res.status}`);
  }
  const data = await res.json();
  return data.envs ?? [];
}

async function upsertEnv(projectId, key, value) {
  const existingList = await fetchEnv(projectId);
  const existing = existingList.find((e) => e.key === key);
  if (existing) {
    const patch = await fetch(
      `https://api.vercel.com/v9/projects/${projectId}/env/${existing.id}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ value, target: ['production', 'preview'] }),
      },
    );
    if (!patch.ok) throw new Error(`Failed to patch ${key}: ${patch.status}`);
    console.log(`Updated ${key}`);
    return;
  }

  const res = await fetch(`https://api.vercel.com/v10/projects/${projectId}/env`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      key,
      value,
      type: 'encrypted',
      target: ['production', 'preview'],
    }),
  });
  if (res.ok) {
    console.log(`Set ${key}`);
    return;
  }
  const text = await res.text();
  throw new Error(`Failed to set ${key}: ${res.status} ${text}`);
}

const source = await fetchEnv(SOURCE_PROJECT);
const sourceByKey = Object.fromEntries(source.map((e) => [e.key, e.value]));

const copied = new Set();
for (const key of KEYS_TO_COPY) {
  if (key.startsWith('VITE_')) continue;
  let value = sourceByKey[key];
  if (!value && KEY_ALIASES[key]) {
    value = sourceByKey[KEY_ALIASES[key]];
  }
  if (!value && key === 'NEXT_PUBLIC_SUPABASE_ANON_KEY') {
    value = sourceByKey.VITE_SUPABASE_PUBLISHABLE_KEY;
  }
  if (!value && key === 'NEXT_PUBLIC_SUPABASE_URL') {
    value = sourceByKey.VITE_SUPABASE_URL;
  }
  if (!value) {
    console.warn(`Skip ${key}: not found on source project`);
    continue;
  }
  if (copied.has(key)) continue;
  copied.add(key);
  await upsertEnv(TARGET_PROJECT, key, value);
}

for (const [key, value] of Object.entries(KEYS_TO_SET)) {
  await upsertEnv(TARGET_PROJECT, key, value);
}

console.log('Done. Redeploy agentops-mcp-chat for changes to take effect.');
