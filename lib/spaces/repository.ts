import 'server-only';

import { nanoid } from 'nanoid';

import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { requireOrgAccess } from '@/lib/tenant/auth';
import type { TenantContext } from '@/lib/tenant/context';
import {
  DEFAULT_SPACE_FILES,
  MAX_SPACE_FILES,
  SPACE_PREVIEW_KIND,
} from '@/lib/spaces/constants';
import {
  mimeTypeForPath,
  sanitizeSpacePath,
  validateFileContent,
} from '@/lib/spaces/paths';
import type { PreviewFile } from '@/lib/spaces/preview';

export type SpaceRow = {
  id: string;
  organization_id: string;
  created_by: string | null;
  chat_thread_id: string | null;
  title: string;
  slug: string;
  status: string;
  preview_kind: string;
  visibility: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type SpaceFileRow = {
  id: string;
  space_id: string;
  organization_id: string;
  path: string;
  content: string | null;
  storage_path: string | null;
  mime_type: string;
  byte_size: number;
  updated_at: string;
};

export type SpaceVersionRow = {
  id: string;
  space_id: string;
  organization_id: string;
  version_number: number;
  message_id: string | null;
  snapshot: Array<{ path: string; byte_size: number }>;
  created_by: string | null;
  created_at: string;
};

export type SpaceShareLinkRow = {
  id: string;
  space_id: string;
  token: string;
  expires_at: string | null;
  created_at: string;
};

function slugify(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
  return base || 'space';
}

async function assertSpaceAccess(
  spaceId: string,
  ctx: TenantContext,
): Promise<SpaceRow> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from('spaces')
    .select('*')
    .eq('id', spaceId)
    .maybeSingle();

  if (error) {
    throw error;
  }
  if (!data) {
    throw new Error('Space not found');
  }

  const space = data as SpaceRow;
  if (space.organization_id !== ctx.organizationId && !ctx.appUser.is_master_admin) {
    await requireOrgAccess(space.organization_id);
  } else {
    await requireOrgAccess(ctx.organizationId);
  }

  if (
    !ctx.appUser.is_master_admin &&
    space.organization_id !== ctx.organizationId
  ) {
    throw new Error('Forbidden');
  }

  return space;
}

export async function listSpacesForOrg(ctx: TenantContext): Promise<SpaceRow[]> {
  await requireOrgAccess(ctx.organizationId);
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from('spaces')
    .select('*')
    .eq('organization_id', ctx.organizationId)
    .order('updated_at', { ascending: false });

  if (error) {
    throw error;
  }
  return (data ?? []) as SpaceRow[];
}

export async function createSpace({
  ctx,
  title,
  chatThreadId,
  files,
}: {
  ctx: TenantContext;
  title: string;
  chatThreadId?: string;
  files?: Array<{ path: string; content: string }>;
}): Promise<SpaceRow> {
  await requireOrgAccess(ctx.organizationId);
  const supabase = getSupabaseAdminClient();

  const slugBase = slugify(title);
  const slug = `${slugBase}-${nanoid(6).toLowerCase()}`;

  const { data: space, error } = await supabase
    .from('spaces')
    .insert({
      organization_id: ctx.organizationId,
      created_by: ctx.appUser.id,
      chat_thread_id: chatThreadId ?? null,
      title,
      slug,
      status: 'draft',
      preview_kind: SPACE_PREVIEW_KIND,
      visibility: 'private',
    })
    .select('*')
    .single();

  if (error || !space) {
    throw error ?? new Error('Failed to create space');
  }

  const seedFiles =
    files && files.length > 0
      ? files
      : DEFAULT_SPACE_FILES.map((f) => ({ path: f.path, content: f.content }));

  await upsertSpaceFiles({
    ctx,
    spaceId: space.id,
    organizationId: ctx.organizationId,
    files: seedFiles,
    createVersion: true,
  });

  return space as SpaceRow;
}

export async function getSpaceById(
  spaceId: string,
  ctx: TenantContext,
): Promise<SpaceRow> {
  return assertSpaceAccess(spaceId, ctx);
}

export async function getSpaceByChatThreadId(
  chatThreadId: string,
  ctx: TenantContext,
): Promise<SpaceRow | null> {
  await requireOrgAccess(ctx.organizationId);
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from('spaces')
    .select('*')
    .eq('chat_thread_id', chatThreadId)
    .eq('organization_id', ctx.organizationId)
    .maybeSingle();

  if (error) {
    throw error;
  }
  return (data as SpaceRow | null) ?? null;
}

export async function updateSpaceMeta({
  spaceId,
  ctx,
  title,
  status,
  visibility,
}: {
  spaceId: string;
  ctx: TenantContext;
  title?: string;
  status?: string;
  visibility?: string;
}): Promise<SpaceRow> {
  await assertSpaceAccess(spaceId, ctx);
  const supabase = getSupabaseAdminClient();

  const patch: Record<string, string> = {};
  if (title) patch.title = title;
  if (status) patch.status = status;
  if (visibility) patch.visibility = visibility;

  const { data, error } = await supabase
    .from('spaces')
    .update(patch)
    .eq('id', spaceId)
    .select('*')
    .single();

  if (error || !data) {
    throw error ?? new Error('Update failed');
  }
  return data as SpaceRow;
}

export async function listSpaceFiles(
  spaceId: string,
  ctx: TenantContext,
): Promise<SpaceFileRow[]> {
  await assertSpaceAccess(spaceId, ctx);
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from('space_files')
    .select('*')
    .eq('space_id', spaceId)
    .order('path', { ascending: true });

  if (error) {
    throw error;
  }
  return (data ?? []) as SpaceFileRow[];
}

export async function getPreviewFiles(
  spaceId: string,
  ctx: TenantContext,
): Promise<PreviewFile[]> {
  const rows = await listSpaceFiles(spaceId, ctx);
  return rows
    .filter((r) => r.content != null)
    .map((r) => ({ path: r.path, content: r.content! }));
}

export async function upsertSpaceFiles({
  ctx,
  spaceId,
  organizationId,
  files,
  createVersion = true,
  messageId,
}: {
  ctx: TenantContext;
  spaceId: string;
  organizationId: string;
  files: Array<{ path: string; content: string }>;
  createVersion?: boolean;
  messageId?: string;
}): Promise<{ versionNumber: number | null }> {
  await assertSpaceAccess(spaceId, ctx);

  if (files.length > MAX_SPACE_FILES) {
    throw new Error(`Maximum ${MAX_SPACE_FILES} files per space`);
  }

  const supabase = getSupabaseAdminClient();
  const rows = [];

  for (const file of files) {
    const path = sanitizeSpacePath(file.path);
    if (!path) {
      throw new Error(`Invalid file path: ${file.path}`);
    }
    validateFileContent(path, file.content);
    const byte_size = new TextEncoder().encode(file.content).length;
    rows.push({
      space_id: spaceId,
      organization_id: organizationId,
      path,
      content: file.content,
      storage_path: null,
      mime_type: mimeTypeForPath(path),
      byte_size,
      updated_at: new Date().toISOString(),
    });
  }

  const { error: upsertError } = await supabase
    .from('space_files')
    .upsert(rows, { onConflict: 'space_id,path' });

  if (upsertError) {
    throw upsertError;
  }

  await supabase
    .from('spaces')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', spaceId);

  if (!createVersion) {
    return { versionNumber: null };
  }

  const allFiles = await listSpaceFiles(spaceId, ctx);
  const versionNumber = await createSpaceVersion({
    spaceId,
    organizationId,
    ctx,
    files: allFiles,
    messageId,
  });

  return { versionNumber };
}

async function createSpaceVersion({
  spaceId,
  organizationId,
  ctx,
  files,
  messageId,
}: {
  spaceId: string;
  organizationId: string;
  ctx: TenantContext;
  files: SpaceFileRow[];
  messageId?: string;
}): Promise<number> {
  const supabase = getSupabaseAdminClient();

  const { data: latest } = await supabase
    .from('space_versions')
    .select('version_number')
    .eq('space_id', spaceId)
    .order('version_number', { ascending: false })
    .limit(1)
    .maybeSingle();

  const versionNumber = (latest?.version_number ?? 0) + 1;
  const snapshot = files.map((f) => ({
    path: f.path,
    byte_size: f.byte_size,
  }));

  const { error } = await supabase.from('space_versions').insert({
    space_id: spaceId,
    organization_id: organizationId,
    version_number: versionNumber,
    message_id: messageId ?? null,
    snapshot,
    created_by: ctx.appUser.id,
  });

  if (error) {
    throw error;
  }

  return versionNumber;
}

export async function listSpaceVersions(
  spaceId: string,
  ctx: TenantContext,
): Promise<SpaceVersionRow[]> {
  await assertSpaceAccess(spaceId, ctx);
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from('space_versions')
    .select('*')
    .eq('space_id', spaceId)
    .order('version_number', { ascending: false });

  if (error) {
    throw error;
  }
  return (data ?? []) as SpaceVersionRow[];
}

export async function createShareLink({
  spaceId,
  ctx,
  expiresInHours,
}: {
  spaceId: string;
  ctx: TenantContext;
  expiresInHours?: number;
}): Promise<SpaceShareLinkRow> {
  const space = await assertSpaceAccess(spaceId, ctx);
  const supabase = getSupabaseAdminClient();

  const token = nanoid(32);
  const expires_at =
    expiresInHours != null
      ? new Date(Date.now() + expiresInHours * 3600_000).toISOString()
      : null;

  const { data, error } = await supabase
    .from('space_share_links')
    .insert({
      space_id: space.id,
      organization_id: space.organization_id,
      token,
      expires_at,
      created_by: ctx.appUser.id,
    })
    .select('*')
    .single();

  if (error || !data) {
    throw error ?? new Error('Failed to create share link');
  }

  return data as SpaceShareLinkRow;
}

export async function getSpaceByShareToken(
  token: string,
): Promise<{ space: SpaceRow; link: SpaceShareLinkRow } | null> {
  const supabase = getSupabaseAdminClient();

  const { data: link, error } = await supabase
    .from('space_share_links')
    .select('*')
    .eq('token', token)
    .maybeSingle();

  if (error || !link) {
    return null;
  }

  const shareLink = link as SpaceShareLinkRow & { organization_id: string };

  if (shareLink.expires_at && new Date(shareLink.expires_at) < new Date()) {
    return null;
  }

  const { data: space } = await supabase
    .from('spaces')
    .select('*')
    .eq('id', shareLink.space_id)
    .maybeSingle();

  if (!space) {
    return null;
  }

  return {
    space: space as SpaceRow,
    link: shareLink as SpaceShareLinkRow,
  };
}

export async function getPublicPreviewFiles(spaceId: string): Promise<PreviewFile[]> {
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from('space_files')
    .select('path, content')
    .eq('space_id', spaceId);

  if (error) {
    throw error;
  }

  return (data ?? [])
    .filter((r) => r.content != null)
    .map((r) => ({ path: r.path as string, content: r.content as string }));
}
