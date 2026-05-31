/**
 * Run after migrations: npx tsx scripts/bootstrap-master-admin.ts
 * Requires SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL in env.
 */
import { config } from 'dotenv';

config({ path: '.env.local' });
config({ path: '.env' });

import { createClient } from '@supabase/supabase-js';

import { MASTER_ADMIN_EMAIL } from '../lib/tenant/constants';

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const supabase = createClient(url, key);

  const { error } = await supabase
    .from('app_users')
    .update({
      role: 'master_admin',
      is_master_admin: true,
      updated_at: new Date().toISOString(),
    })
    .eq('email', MASTER_ADMIN_EMAIL.toLowerCase());

  if (error) {
    console.error('Bootstrap failed:', error.message);
    process.exit(1);
  }

  console.log(`Master admin bootstrap complete for ${MASTER_ADMIN_EMAIL}`);
}

main();
