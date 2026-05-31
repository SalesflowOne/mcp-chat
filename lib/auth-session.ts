import type { GuestSession } from '@/types/user';

/** Session shape used across chat, API routes, and artifacts. */
export type AppSession = GuestSession & {
  expires?: string;
  /** Clerk user id — used for MCP / Pipedream external user */
  clerkUserId: string;
  /** Supabase app_users.id */
  appUserId: string;
  organizationId: string;
  isMasterAdmin?: boolean;
};
