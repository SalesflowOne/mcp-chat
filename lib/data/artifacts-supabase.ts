import 'server-only';

import type { ArtifactKind } from '@/components/artifact';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/supabase/config';

export type ArtifactRow = {
  id: string;
  organization_id: string;
  user_id: string | null;
  title: string;
  content: string | null;
  kind: string;
  created_at: string;
};

export function useArtifactsSupabase(): boolean {
  return isSupabaseConfigured();
}

export async function saveArtifactSupabase({
  id,
  title,
  kind,
  content,
  userId,
  organizationId,
}: {
  id: string;
  title: string;
  kind: ArtifactKind;
  content: string;
  userId: string;
  organizationId: string;
}) {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from('artifacts').insert({
    id,
    organization_id: organizationId,
    user_id: userId,
    title,
    content,
    kind,
  });

  if (error) {
    throw error;
  }
}

export async function getArtifactsByIdSupabase({
  id,
}: {
  id: string;
}): Promise<ArtifactRow[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from('artifacts')
    .select('*')
    .eq('id', id)
    .order('created_at', { ascending: true });

  if (error) {
    throw error;
  }
  return (data ?? []) as ArtifactRow[];
}

export async function getLatestArtifactSupabase({
  id,
}: {
  id: string;
}): Promise<ArtifactRow | null> {
  const rows = await getArtifactsByIdSupabase({ id });
  return rows.length > 0 ? rows[rows.length - 1]! : null;
}

export async function deleteArtifactsAfterTimestampSupabase({
  id,
  timestamp,
}: {
  id: string;
  timestamp: Date;
}) {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from('artifacts')
    .delete()
    .eq('id', id)
    .gt('created_at', timestamp.toISOString());

  if (error) {
    throw error;
  }
}

/** Map Supabase row → legacy Document shape for artifact UI */
export function toLegacyDocument(row: ArtifactRow, userId: string) {
  return {
    id: row.id,
    createdAt: new Date(row.created_at),
    title: row.title,
    content: row.content,
    kind: row.kind as ArtifactKind,
    userId,
  };
}
