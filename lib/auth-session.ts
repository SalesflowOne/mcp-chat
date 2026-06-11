import type { GuestSession } from '@/types/user';

/** Session shape used across chat, API routes, and artifacts. */
export type AppSession = GuestSession & {
  expires?: string;
  /** Supabase auth.users.id — permanent user identity */
  authUserId: string;
  /** app_users.id (same as authUserId for new users) */
  appUserId: string;
  organizationId: string;
  isMasterAdmin?: boolean;
  memberRole?: string | null;
};
