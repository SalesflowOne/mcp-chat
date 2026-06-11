import { getEffectiveSession } from '@/lib/auth-utils';
import { pdClient } from '@/lib/pd-backend-client';

export async function POST(request: Request) {
  const session = await getEffectiveSession();

  if (!session?.authUserId) {
    return Response.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const app = typeof body.app === 'string' ? body.app : undefined;

    const tokenResponse = await pdClient().tokens.create({
      external_user_id: session.authUserId,
      ...(app ? { app } : {}),
    });

    return Response.json({
      token: tokenResponse.token,
      expires_at: tokenResponse.expires_at,
    });
  } catch (error) {
    console.error('Failed to create connect token', error);
    return Response.json(
      { error: 'Failed to create connect token' },
      { status: 500 },
    );
  }
}
