import 'server-only';

import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import type { TenantContext } from '@/lib/tenant/context';
import { canDeploySpaces } from '@/lib/tenant/roles';
import { getPreviewFiles, type SpaceRow } from '@/lib/spaces/repository';
import { assemblePreviewHtml } from '@/lib/spaces/preview';

const VERCEL_API = 'https://api.vercel.com';

export type DeploymentResult = {
  deploymentId: string;
  url: string;
  status: string;
};

export async function deploySpaceToVercel({
  space,
  ctx,
  memberRole,
}: {
  space: SpaceRow;
  ctx: TenantContext;
  memberRole?: string | null;
}): Promise<DeploymentResult> {
  if (!canDeploySpaces(memberRole)) {
    throw new Error('Insufficient permissions to deploy');
  }

  const token = process.env.VERCEL_TOKEN?.trim();
  const teamId = process.env.VERCEL_TEAM_ID?.trim();

  if (!token) {
    throw new Error('VERCEL_TOKEN is not configured');
  }

  const supabase = getSupabaseAdminClient();

  const { data: deploymentRow, error: insertError } = await supabase
    .from('space_deployments')
    .insert({
      space_id: space.id,
      organization_id: space.organization_id,
      provider: 'vercel',
      status: 'pending',
    })
    .select('id')
    .single();

  if (insertError || !deploymentRow) {
    throw insertError ?? new Error('Failed to create deployment record');
  }

  try {
    const files = await getPreviewFiles(space.id, ctx);
    const html = assemblePreviewHtml(
      files,
      `https://agentops.one/api/spaces/${space.id}/assets`,
    );

    const vercelFiles = files.map((f) => ({
      file: f.path,
      data: f.content,
    }));

    if (!vercelFiles.some((f) => f.file === 'index.html')) {
      vercelFiles.unshift({ file: 'index.html', data: html });
    }

    const body = {
      name: `agentops-space-${space.slug}`.slice(0, 63),
      files: vercelFiles.map((f) => ({
        file: f.file,
        data: Buffer.from(f.data, 'utf-8').toString('base64'),
        encoding: 'base64',
      })),
      projectSettings: {
        framework: null,
      },
      target: 'production',
    };

    const url = new URL(`${VERCEL_API}/v13/deployments`);
    if (teamId) {
      url.searchParams.set('teamId', teamId);
    }

    const res = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Vercel deploy failed: ${res.status} ${errText}`);
    }

    const json = (await res.json()) as {
      id: string;
      url?: string;
      alias?: string[];
    };

    const deployUrl =
      json.url != null
        ? `https://${json.url}`
        : json.alias?.[0]
          ? `https://${json.alias[0]}`
          : null;

    if (!deployUrl) {
      throw new Error('Vercel deployment returned no URL');
    }

    await supabase
      .from('space_deployments')
      .update({
        status: 'live',
        external_id: json.id,
        url: deployUrl,
      })
      .eq('id', deploymentRow.id);

    await supabase
      .from('spaces')
      .update({ status: 'published' })
      .eq('id', space.id);

    return {
      deploymentId: deploymentRow.id as string,
      url: deployUrl,
      status: 'live',
    };
  } catch (error) {
    await supabase
      .from('space_deployments')
      .update({ status: 'failed' })
      .eq('id', deploymentRow.id);
    throw error;
  }
}
