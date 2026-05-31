import { NextResponse } from 'next/server';

import { getEffectiveSession } from '@/lib/auth-utils';
import { resolveTenantContext } from '@/lib/tenant/context';
import {
  getSpaceById,
  listSpaceFiles,
  upsertSpaceFiles,
} from '@/lib/spaces/repository';

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
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
    const files = await listSpaceFiles(id, ctx);
    return NextResponse.json({ files });
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}

export async function PUT(request: Request, { params }: Params) {
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

    const space = await getSpaceById(id, ctx);
    const body = await request.json();
    const files = body.files as Array<{ path: string; content: string }>;

    if (!Array.isArray(files) || files.length === 0) {
      return NextResponse.json({ error: 'files array required' }, { status: 400 });
    }

    const result = await upsertSpaceFiles({
      ctx,
      spaceId: space.id,
      organizationId: space.organization_id,
      files,
      createVersion: body.createVersion !== false,
    });

    const updated = await listSpaceFiles(id, ctx);
    return NextResponse.json({ ...result, files: updated });
  } catch (error) {
    console.error('put space files', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Update failed' },
      { status: 500 },
    );
  }
}
