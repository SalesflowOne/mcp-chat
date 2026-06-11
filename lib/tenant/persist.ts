import 'server-only';

import { shouldPersistData } from '@/lib/auth-utils';
import { resolveTenantContext, type TenantContext } from '@/lib/tenant/context';

/** Resolve Supabase tenant for chat history reads/writes. */
export async function resolvePersistTenant(): Promise<TenantContext | null> {
  if (!shouldPersistData()) {
    return null;
  }

  try {
    return await resolveTenantContext();
  } catch (error) {
    console.error('Failed to resolve tenant for chat persistence', error);
    return null;
  }
}
