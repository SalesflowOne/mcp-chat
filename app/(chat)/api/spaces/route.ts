import { NextResponse } from 'next/server';

import { getEffectiveSession } from '@/lib/auth-utils';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { resolveTenantContext } from '@/lib/tenant/context';
import { createSpace, listSpacesForOrg } from '@/lib/spaces/repository';

export async function GET() {
  const session = await getEffectiveSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: 'Supabase is required for Spaces' },
      { status: 503 },
    );
  }

  try {
    const ctx = await resolveTenantContext();
    if (!ctx) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const spaces = await listSpacesForOrg(ctx);
    return NextResponse.json({ spaces });
  } catch (error) {
    console.error('list spaces', error);
    return NextResponse.json({ error: 'Failed to list spaces' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getEffectiveSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: 'Supabase is required for Spaces' },
      { status: 503 },
    );
  }

  try {
    const ctx = await resolveTenantContext();
    if (!ctx) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const title = typeof body.title === 'string' ? body.title : 'New Space';
    const chatThreadId =
      typeof body.chatThreadId === 'string' ? body.chatThreadId : undefined;

    const space = await createSpace({
      ctx,
      title,
      chatThreadId,
      files: Array.isArray(body.files) ? body.files : undefined,
    });

    return NextResponse.json({ space }, { status: 201 });
  } catch (error) {
    console.error('create space', error);
    return NextResponse.json({ error: 'Failed to create space' }, { status: 500 });
  }
}
