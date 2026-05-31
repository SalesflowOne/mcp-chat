import 'server-only';

import { createClient } from '@supabase/supabase-js';

import {
  getSupabaseServiceRoleKey,
  getSupabaseUrl,
  isSupabaseConfigured,
} from '@/lib/supabase/config';

import type { Database } from '@/lib/supabase/types';

let adminClient: ReturnType<typeof createClient<Database>> | null = null;

/** Service-role client — server only, after Clerk + org access checks. */
export function getSupabaseAdminClient() {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured');
  }

  if (!adminClient) {
    adminClient = createClient<Database>(
      getSupabaseUrl(),
      getSupabaseServiceRoleKey(),
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      },
    );
  }

  return adminClient;
}
