import type { GuestSession } from '@/types/user';

/** Session shape used across chat, API routes, and artifacts. */
export type AppSession = GuestSession & {
  expires?: string;
};
