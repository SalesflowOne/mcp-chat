import { NextResponse } from 'next/server';

import { getEffectiveSession } from '@/lib/auth-utils';

/** Lets the browser sync auth state when Supabase client cookies are not yet readable. */
export async function GET() {
  const session = await getEffectiveSession();

  if (!session?.user) {
    return NextResponse.json({ user: null, session: null });
  }

  return NextResponse.json({
    user: session.user,
    session,
  });
}
