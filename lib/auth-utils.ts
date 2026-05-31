import 'server-only';

import { auth, currentUser } from '@clerk/nextjs/server';

import { isAuthDisabled, isPersistenceDisabled } from '@/lib/constants';
import type { AppSession } from '@/lib/auth-session';
import { createGuestSession } from '@/lib/utils';

export async function getEffectiveSession(): Promise<AppSession | null> {
  if (isAuthDisabled) {
    return createGuestSession();
  }

  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const user = await currentUser();

  return {
    user: {
      id: userId,
      name:
        user?.fullName ||
        [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
        'User',
      email: user?.emailAddresses[0]?.emailAddress ?? '',
    },
  };
}

export function shouldPersistData() {
  return !isPersistenceDisabled;
}
