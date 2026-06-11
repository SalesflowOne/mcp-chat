import 'server-only';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

import {
  getSupabaseAnonKey,
  getSupabaseUrl,
  isSupabaseAuthConfigured,
} from '@/lib/supabase/config';

import type { Database } from '@/lib/supabase/types';

/** Server-side Supabase client for Auth (anon key + session cookies). */
export async function getSupabaseServerClient() {
  if (!isSupabaseAuthConfigured()) {
    throw new Error('Supabase Auth is not configured');
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
          // Called from a Server Component — middleware handles refresh.
        }
      },
    },
  });
}
