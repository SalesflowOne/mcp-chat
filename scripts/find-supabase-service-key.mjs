#!/usr/bin/env node
const TEAM_ID = 'team_Na274IDFwAHRPi5JdFrzvRUk';
const TARGET_REF = 'ebjzdcnphkfpxfldnatm';
const token = process.env.VERCEL_TOKEN;

function decodeJwt(v) {
  try {
    return JSON.parse(Buffer.from(v.split('.')[1], 'base64').toString());
  } catch {
    return null;
  }
}

const res = await globalThis.fetch(
  `https://api.vercel.com/v9/projects?teamId=${TEAM_ID}&limit=50`,
  { headers: { Authorization: `Bearer ${token}` } },
);
const projects = (await res.json()).projects ?? [];

for (const p of projects) {
  const er = await globalThis.fetch(
    `https://api.vercel.com/v9/projects/${p.id}/env?decrypt=true&teamId=${TEAM_ID}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const envs = (await er.json()).envs ?? [];
  for (const e of envs) {
    const v = e.value?.trim();
    if (!v) continue;
    const roleKeys = [
      'SUPABASE_SERVICE_ROLE_KEY',
      'SUPABASE_SECRET_KEY',
      'VITE_SUPABASE_SERVICE_ROLE_KEY',
    ];
    if (!roleKeys.includes(e.key) && !/service.?role|secret/i.test(e.key)) continue;

    if (v.startsWith('sb_secret_') && e.type === 'plain') {
      console.log(`FOUND secret key: ${p.name} / ${e.key} (${v.slice(0, 20)}...)`);
    }
    if (v.split('.').length === 3) {
      const payload = decodeJwt(v);
      if (payload?.ref === TARGET_REF && payload?.role === 'service_role') {
        console.log(`FOUND service_role JWT: ${p.name} / ${e.key} type=${e.type}`);
      }
    }
  }
}
