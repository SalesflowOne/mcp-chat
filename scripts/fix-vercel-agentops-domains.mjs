#!/usr/bin/env node
/**
 * Canonical host: agentops.one (apex). Redirect www → apex.
 * Run after Vercel project setup if apex was pointed at www.
 */
const token = process.env.VERCEL_TOKEN?.trim();
const projectId = process.env.VERCEL_PROJECT_ID ?? 'prj_9k6rLDi9UP0YMf1QfuMgSi9yirJH';

if (!token) {
  console.error('VERCEL_TOKEN is required');
  process.exit(1);
}

async function patchDomain(domain, body) {
  const res = await fetch(
    `https://api.vercel.com/v9/projects/${projectId}/domains/${domain}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    },
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`PATCH ${domain} failed: ${res.status} ${JSON.stringify(data)}`);
  }
  return data;
}

async function main() {
  await patchDomain('agentops.one', { redirect: null });
  console.log('agentops.one: no redirect (apex serves traffic)');

  await patchDomain('www.agentops.one', {
    redirect: 'agentops.one',
    redirectStatusCode: 308,
  });
  console.log('www.agentops.one → agentops.one (308)');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
