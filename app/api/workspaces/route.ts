import { cookies } from 'next/headers';

import { getEffectiveSession } from '@/lib/auth-utils';
import { ACTIVE_ORG_COOKIE } from '@/lib/tenant/constants';
import { resolveTenantContext } from '@/lib/tenant/context';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/supabase/config';

export async function GET() {
  const session = await getEffectiveSession();
  if (!session?.user || !isSupabaseConfigured()) {
    return Response.json([], { status: 401 });
  }

  const tenant = await resolveTenantContext();
  if (!tenant) {
    return Response.json([]);
  }

  const supabase = getSupabaseAdminClient();
  const { data: memberships } = await supabase
    .from('organization_members')
    .select('organization_id, role, organizations(id, name, slug)')
    .eq('user_id', tenant.appUser.id);

  const cookieStore = await cookies();
  const activeOrgId =
    cookieStore.get(ACTIVE_ORG_COOKIE)?.value ?? tenant.organizationId;

  const workspaces =
    memberships?.map((m) => {
      const org = m.organizations as { id: string; name: string; slug: string } | null;
      return {
        id: org?.id ?? m.organization_id,
        name: org?.name ?? 'Workspace',
        slug: org?.slug ?? '',
        role: m.role,
        isActive: (org?.id ?? m.organization_id) === activeOrgId,
      };
    }) ?? [];

  if (tenant.appUser.is_master_admin) {
    const { data: allOrgs } = await supabase
      .from('organizations')
      .select('id, name, slug')
      .order('name');

    for (const org of allOrgs ?? []) {
      if (!workspaces.some((w) => w.id === org.id)) {
        workspaces.push({
          id: org.id,
          name: org.name,
          slug: org.slug,
          role: 'admin',
          isActive: org.id === activeOrgId,
        });
      }
    }
  }

  return Response.json(workspaces);
}

export async function POST(request: Request) {
  const session = await getEffectiveSession();
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { organizationId } = await request.json();
  if (!organizationId || typeof organizationId !== 'string') {
    return Response.json({ error: 'Invalid organization' }, { status: 400 });
  }

  const tenant = await resolveTenantContext();
  if (!tenant) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!tenant.appUser.is_master_admin) {
    const supabase = getSupabaseAdminClient();
    const { data: membership } = await supabase
      .from('organization_members')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('user_id', tenant.appUser.id)
      .maybeSingle();

    if (!membership) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_ORG_COOKIE, organizationId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  });

  return Response.json({ ok: true });
}
