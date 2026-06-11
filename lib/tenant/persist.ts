import 'server-only';

import { shouldPersistData } from '@/lib/auth-utils';
import {
  hasSupabaseServiceRole,
  isRpcPersistConfigured,
  isSupabaseConfigured,
} from '@/lib/supabase/config';
import { resolveTenantContext, type TenantContext } from '@/lib/tenant/context';

/** Resolve Supabase tenant for chat history reads/writes. */
export async function resolvePersistTenant(): Promise<TenantContext | null> {
  if (!shouldPersistData()) {
    if (process.env.NODE_ENV === 'production') {
      console.warn('Chat persistence disabled', {
        persistenceDisabled: process.env.DISABLE_PERSISTENCE,
        supabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
        serviceRole: hasSupabaseServiceRole(),
        rpcPersist: isRpcPersistConfigured(),
        configured: isSupabaseConfigured(),
      });
    }
    return null;
  }

  try {
    return await resolveTenantContext();
  } catch (error) {
    console.error('Failed to resolve tenant for chat persistence', error);
    return null;
  }
}
