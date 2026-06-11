'use client';

import { useAuthContext } from '@/contexts/AuthContext';

/**
 * Primary client auth hook. Use this instead of raw Supabase calls in components.
 * Prepared for future OneAccess hub integration behind the same interface.
 */
export function useAuth() {
  return useAuthContext();
}
