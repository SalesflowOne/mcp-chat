import type { AppSession } from '@/lib/auth-session';
import type { TenantContext } from '@/lib/tenant/context';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** True when chat history can be saved to Supabase for this session. */
export function canPersistChatSession(session: AppSession | null): boolean {
  if (!session?.organizationId || !session.appUserId) {
    return false;
  }
  const orgId = session.organizationId;
  if (orgId === 'default' || orgId === 'guest') {
    return false;
  }
  return UUID_RE.test(orgId);
}

/** Prefer resolving tenant at request time over session fallbacks. */
export function canPersistTenant(tenant: TenantContext | null): boolean {
  return Boolean(tenant?.organizationId && tenant.appUser.id);
}
