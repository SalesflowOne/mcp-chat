#!/usr/bin/env node
/**
 * Ensure Cloudflare DNS for agentops.one Clerk satellites.
 * Requires CLOUDFLARE_API_KEY and X_AUTH_EMAIL (or ceo@salesflow.one).
 */
const ZONE_NAME = 'agentops.one';
const EMAIL = process.env.X_AUTH_EMAIL?.trim() || 'ceo@salesflow.one';
const API_KEY = process.env.CLOUDFLARE_API_KEY?.trim();

const RECORDS = [
  { type: 'CNAME', name: 'accounts', content: 'accounts.clerk.services', proxied: false },
  { type: 'CNAME', name: 'clerk', content: 'frontend-api.clerk.services', proxied: false },
];

if (!API_KEY) {
  console.error('CLOUDFLARE_API_KEY is required');
  process.exit(1);
}

async function cf(path, init = {}) {
  const res = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    ...init,
    headers: {
      'X-Auth-Key': API_KEY,
      'X-Auth-Email': EMAIL,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
  const body = await res.json();
  if (!body.success) {
    throw new Error(`${path} failed: ${JSON.stringify(body.errors ?? body)}`);
  }
  return body;
}

async function upsertRecord(zoneId, spec) {
  const list = await cf(
    `/zones/${zoneId}/dns_records?type=${spec.type}&name=${spec.name}.${ZONE_NAME}`,
  );
  const existing = list.result[0];
  const payload = {
    type: spec.type,
    name: spec.name,
    content: spec.content,
    ttl: 1,
    proxied: spec.proxied,
  };

  if (existing) {
    await cf(`/zones/${zoneId}/dns_records/${existing.id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    console.log(`Updated ${spec.name}.${ZONE_NAME} → ${spec.content}`);
    return;
  }

  await cf(`/zones/${zoneId}/dns_records`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  console.log(`Created ${spec.name}.${ZONE_NAME} → ${spec.content}`);
}

async function main() {
  const zones = await cf(`/zones?name=${ZONE_NAME}`);
  const zoneId = zones.result[0]?.id;
  if (!zoneId) {
    throw new Error(`Zone ${ZONE_NAME} not found`);
  }

  console.log(`Zone ${ZONE_NAME} (${zoneId})`);
  for (const spec of RECORDS) {
    await upsertRecord(zoneId, spec);
  }

  console.log('\nClerk Dashboard (required for accounts.agentops.one to work):');
  console.log('  Domains → agentops.one → verify DNS / enable Account Portal');
  console.log('  Until then, app uses accounts.oneaccess.one with redirect to agentops.one');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
