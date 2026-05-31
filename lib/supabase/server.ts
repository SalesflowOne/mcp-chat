import 'server-only';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

import {
  getSupabaseAnonKey,
  getSupabaseUrl,
  isSupabaseConfigured,
} from '@/lib/supabase/config';

import type { Database } from '@/lib/supabase/types';

/** Server-side anon client (no tenant bypass). Prefer admin client after auth checks. */
export async function getSupabaseServerClient() {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured');
  }

  const cookieStore = await cookies();

  return createServerClient<Database>(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component — ignore.
        }
      },
    },
  });
}
