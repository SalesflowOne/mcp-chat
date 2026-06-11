#!/usr/bin/env node
/**
 * Fix Supabase env vars on agentops-mcp-chat (production).
 * Sets plain-text values so runtime gets real URLs/keys, not corrupt encrypted blobs.
 */
import { readFileSync } from 'node:fs';

const TEAM_ID = 'team_Na274IDFwAHRPi5JdFrzvRUk';
const TARGET_PROJECT = 'prj_9k6rLDi9UP0YMf1QfuMgSi9yirJH';

const SUPABASE_URL = 'https://ebjzdcnphkfpxfldnatm.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVianpkY25waGtmcHhmbGRuYXRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NjcwMzIsImV4cCI6MjA4NzM0MzAzMn0.N-fK-ol2a4zMfMBfuSWLj5vbkdG4yF5Q87Tklrplgf8';

const PERSIST_SECRET =
  process.env.AGENTOPS_PERSIST_SECRET?.trim() ||
  '351d33c547a2c7b8755e9268c999470869c12d3c7efe5683e26129690994a9ba';

const KEYS = {
  NEXT_PUBLIC_SUPABASE_URL: SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: SUPABASE_ANON_KEY,
  AGENTOPS_PERSIST_SECRET: PERSIST_SECRET,
  DISABLE_PERSISTENCE: 'false',
};

const token = process.env.VERCEL_TOKEN;
if (!token) {
  console.error('VERCEL_TOKEN is required');
  process.exit(1);
}

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
if (serviceRoleKey) {
  KEYS.SUPABASE_SERVICE_ROLE_KEY = serviceRoleKey;
} else {
  console.log('Using AGENTOPS_PERSIST_SECRET RPC fallback (no service role on Vercel).');
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
  console.log(`Deleted ${key}`);
}

async function upsertPlain(key, value) {
  const envs = await fetchEnv();
  const existing = envs.find((e) => e.key === key);
  if (existing) {
    await deleteEnv(existing.id, key);
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
  const entry = verify.find((e) => e.key === key);
  const v = entry?.value ?? '';
  const ok =
    key === 'NEXT_PUBLIC_SUPABASE_URL'
      ? v.startsWith('https://')
      : key === 'DISABLE_PERSISTENCE'
        ? v === 'false'
        : key === 'SUPABASE_SERVICE_ROLE_KEY'
          ? v.startsWith('eyJ') || v.startsWith('sb_secret_')
          : v.startsWith('eyJ');
  console.log(`Verify ${key}: type=${entry?.type} ok=${ok}`);
}

console.log('Done. Redeploy agentops-mcp-chat for changes to take effect.');
