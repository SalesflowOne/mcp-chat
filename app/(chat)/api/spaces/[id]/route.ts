import { NextResponse } from 'next/server';

import { getEffectiveSession } from '@/lib/auth-utils';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { resolveTenantContext } from '@/lib/tenant/context';
import {
  getSpaceById,
  listSpaceFiles,
  listSpaceVersions,
  updateSpaceMeta,
} from '@/lib/spaces/repository';

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const session = await getEffectiveSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase required' }, { status: 503 });
  }

  try {
    const ctx = await resolveTenantContext();
    if (!ctx) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const space = await getSpaceById(id, ctx);
    const files = await listSpaceFiles(id, ctx);
    const versions = await listSpaceVersions(id, ctx);

    return NextResponse.json({ space, files, versions });
  } catch (error) {
    console.error('get space', error);
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}

export async function PATCH(request: Request, { params }: Params) {
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

    const body = await request.json();
    const space = await updateSpaceMeta({
      spaceId: id,
      ctx,
      title: body.title,
      status: body.status,
      visibility: body.visibility,
    });

    return NextResponse.json({ space });
  } catch (error) {
    console.error('patch space', error);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}
