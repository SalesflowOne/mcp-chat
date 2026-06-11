import { NextResponse } from 'next/server';

import { getEffectiveSession } from '@/lib/auth-utils';
import { pdClient } from '@/lib/pd-backend-client';

type Params = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, { params }: Params) {
  const session = await getEffectiveSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { slug } = await params;

  try {
    const response = await pdClient().apps.retrieve(slug);
    return NextResponse.json(response);
  } catch {
    return NextResponse.json({ error: 'App not found' }, { status: 404 });
  }
}
