import { NextResponse } from 'next/server';

import { getEffectiveSession } from '@/lib/auth-utils';
import { resolveTenantContext } from '@/lib/tenant/context';
import { createShareLink } from '@/lib/spaces/repository';

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const session = await getEffectiveSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const ctx = await resolveTenantContext();
    if (!ctx) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const expiresInHours =
      typeof body.expiresInHours === 'number' ? body.expiresInHours : 168;

    const link = await createShareLink({
      spaceId: id,
      ctx,
      expiresInHours,
    });

    const origin =
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ??
      new URL(request.url).origin;

    return NextResponse.json({
      link,
      publicUrl: `${origin}/share/spaces/${link.token}`,
      previewUrl: `${origin}/api/public/spaces/${link.token}/preview`,
    });
  } catch (error) {
    console.error('share link', error);
    return NextResponse.json({ error: 'Failed to create share link' }, { status: 500 });
  }
}
