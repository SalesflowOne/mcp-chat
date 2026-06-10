import { getEffectiveSession } from '@/lib/auth-utils';
import { resolveTenantContext } from '@/lib/tenant/context';
import { getSpaceById } from '@/lib/spaces/repository';
import { deploySpaceToVercel } from '@/lib/spaces/deploy';
import { auth } from '@clerk/nextjs/server';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getEffectiveSession();
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const tenant = await resolveTenantContext();
  if (!tenant) {
    return Response.json({ error: 'Tenant not found' }, { status: 403 });
  }

  const { orgRole } = await auth();

  try {
    const space = await getSpaceById(id, tenant);
    const result = await deploySpaceToVercel({
      space,
      ctx: tenant,
      memberRole: orgRole,
    });

    return Response.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Deployment failed';
    return Response.json({ error: message }, { status: 500 });
  }
}
