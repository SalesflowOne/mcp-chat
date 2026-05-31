import 'server-only';

import { isPersistenceDisabled } from '@/lib/constants';
import { isSupabaseConfigured } from '@/lib/supabase/config';

export function shouldPersistData(): boolean {
  if (isPersistenceDisabled) {
    return false;
  }

  return isSupabaseConfigured() || Boolean(process.env.POSTGRES_URL?.trim());
}

export function useSupabasePersistence(): boolean {
  return isSupabaseConfigured() && !isPersistenceDisabled;
}
