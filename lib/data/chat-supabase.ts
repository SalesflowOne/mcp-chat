import 'server-only';

import type { UIMessage } from 'ai';

import {
  getChatByIdViaRpc,
  getChatsByUserViaRpc,
  getMessagesByChatIdViaRpc,
  isRpcPersistConfigured,
  saveChatViaRpc,
  saveMessagesViaRpc,
} from '@/lib/persistence/rpc';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { hasSupabaseServiceRole } from '@/lib/supabase/config';
import { requireOrgAccess } from '@/lib/tenant/auth';
import type { TenantContext } from '@/lib/tenant/context';
import type { ChatThreadRow, ChatMessageRow } from '@/lib/supabase/types';

/** Legacy shape expected by existing UI components */
export type LegacyChat = {
  id: string;
  createdAt: Date;
  title: string;
  userId: string;
  visibility: 'public' | 'private';
};

export type LegacyDBMessage = {
  id: string;
  chatId: string;
  role: string;
  parts: unknown;
  attachments: unknown;
  createdAt: Date;
};

export type LegacyVote = {
  chatId: string;
  messageId: string;
  isUpvoted: boolean;
};

function toLegacyChat(row: ChatThreadRow, appUserId: string): LegacyChat {
  return {
    id: row.id,
    createdAt: new Date(row.created_at),
    title: row.title ?? 'New Chat',
    userId: appUserId,
    visibility: (row.visibility as 'public' | 'private') ?? 'private',
  };
}

function toLegacyMessage(row: ChatMessageRow): LegacyDBMessage {
  return {
    id: row.id,
    chatId: row.thread_id,
    role: row.role,
    parts: row.parts ?? [],
    attachments: row.attachments ?? [],
    createdAt: new Date(row.created_at),
  };
}

async function getContextForThread(
  threadId: string,
  clerkUserId: string,
): Promise<TenantContext> {
  const supabase = getSupabaseAdminClient();
  const { data: thread } = await supabase
    .from('chat_threads')
    .select('organization_id')
    .eq('id', threadId)
    .maybeSingle();

  if (!thread) {
    throw new Error('Chat not found');
  }

  const ctx = await requireOrgAccess(thread.organization_id);
  if (!ctx.appUser.is_master_admin && ctx.clerkUserId !== clerkUserId) {
    const { data: owned } = await supabase
      .from('chat_threads')
      .select('id')
      .eq('id', threadId)
      .eq('user_id', ctx.appUser.id)
      .maybeSingle();

    if (!owned) {
      throw new Error('Forbidden');
    }
  }

  return ctx;
}

export async function saveChatSupabase({
  id,
  clerkUserId,
  appUserId,
  organizationId,
  title,
}: {
  id: string;
  clerkUserId: string;
  appUserId: string;
  organizationId: string;
  title: string;
}) {
  if (!hasSupabaseServiceRole() && isRpcPersistConfigured()) {
    await saveChatViaRpc({ id, appUserId, organizationId, title });
    return;
  }

  await requireOrgAccess(organizationId);
  const supabase = getSupabaseAdminClient();

  const { error } = await supabase.from('chat_threads').upsert(
    {
      id,
      organization_id: organizationId,
      user_id: appUserId,
      title,
      visibility: 'private',
    },
    { onConflict: 'id' },
  );

  if (error) {
    throw error;
  }
}

export async function getChatByIdSupabase({
  id,
  clerkUserId,
}: {
  id: string;
  clerkUserId: string;
}): Promise<LegacyChat | null> {
  if (!hasSupabaseServiceRole() && isRpcPersistConfigured()) {
    const data = await getChatByIdViaRpc({ id, clerkUserId });
    if (!data) return null;
    return toLegacyChat(data, data.user_id ?? '');
  }

  const ctx = await getContextForThread(id, clerkUserId);
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from('chat_threads')
    .select('*')
    .eq('id', id)
    .eq('organization_id', ctx.organizationId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return toLegacyChat(data, ctx.appUser.id);
}

export async function getChatsByUserIdSupabase({
  appUserId,
  organizationId,
}: {
  appUserId: string;
  organizationId: string;
}): Promise<LegacyChat[]> {
  if (!hasSupabaseServiceRole() && isRpcPersistConfigured()) {
    const data = await getChatsByUserViaRpc({ appUserId, organizationId });
    return data.map((row) => toLegacyChat(row, appUserId));
  }

  await requireOrgAccess(organizationId);
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from('chat_threads')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('user_id', appUserId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => toLegacyChat(row, appUserId));
}

export async function deleteChatByIdSupabase({
  id,
  clerkUserId,
}: {
  id: string;
  clerkUserId: string;
}) {
  await getContextForThread(id, clerkUserId);
  const supabase = getSupabaseAdminClient();

  const { error } = await supabase.from('chat_threads').delete().eq('id', id);
  if (error) {
    throw error;
  }
}

export async function saveMessagesSupabase({
  messages,
  organizationId,
  appUserId,
}: {
  messages: Array<{
    id: string;
    chatId: string;
    role: string;
    parts: unknown;
    attachments: unknown;
    createdAt: Date;
  }>;
  organizationId: string;
  appUserId: string;
}) {
  if (!hasSupabaseServiceRole() && isRpcPersistConfigured()) {
    await saveMessagesViaRpc({
      organizationId,
      appUserId,
      messages: messages.map((m) => ({
        ...m,
        createdAt: m.createdAt.toISOString(),
        content: extractTextFromParts(m.parts),
      })),
    });
    return;
  }

  await requireOrgAccess(organizationId);
  const supabase = getSupabaseAdminClient();

  const rows = messages.map((m) => ({
    id: m.id,
    thread_id: m.chatId,
    organization_id: organizationId,
    user_id: appUserId,
    role: m.role,
    content: extractTextFromParts(m.parts),
    parts: m.parts as object,
    attachments: m.attachments as object,
    metadata: {},
    created_at: m.createdAt.toISOString(),
  }));

  const { error } = await supabase.from('chat_messages').upsert(rows, {
    onConflict: 'id',
  });

  if (error) {
    throw error;
  }
}

export async function getMessagesByChatIdSupabase({
  id,
  clerkUserId,
}: {
  id: string;
  clerkUserId: string;
}): Promise<LegacyDBMessage[]> {
  if (!hasSupabaseServiceRole() && isRpcPersistConfigured()) {
    const data = await getMessagesByChatIdViaRpc({ id, clerkUserId });
    return data.map(toLegacyMessage);
  }

  await getContextForThread(id, clerkUserId);
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('thread_id', id)
    .order('created_at', { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map(toLegacyMessage);
}

export async function updateChatVisibilitySupabase({
  chatId,
  visibility,
  clerkUserId,
}: {
  chatId: string;
  visibility: 'private' | 'public';
  clerkUserId: string;
}) {
  await getContextForThread(chatId, clerkUserId);
  const supabase = getSupabaseAdminClient();

  const { error } = await supabase
    .from('chat_threads')
    .update({ visibility })
    .eq('id', chatId);

  if (error) {
    throw error;
  }
}

/** Votes are not migrated to Supabase yet — no-op stubs for compatibility */
export async function voteMessageSupabase() {
  return;
}

export async function getVotesByChatIdSupabase(): Promise<LegacyVote[]> {
  return [];
}

function extractTextFromParts(parts: unknown): string | null {
  if (!Array.isArray(parts)) {
    return null;
  }

  const textPart = parts.find(
    (p) => p && typeof p === 'object' && 'type' in p && (p as { type: string }).type === 'text',
  ) as { text?: string } | undefined;

  return textPart?.text ?? null;
}

export async function recordUsageEvent({
  organizationId,
  userId,
  eventType,
  model,
  inputTokens = 0,
  outputTokens = 0,
  costUsd = 0,
  metadata = {},
}: {
  organizationId: string;
  userId: string | null;
  eventType: string;
  model?: string;
  inputTokens?: number;
  outputTokens?: number;
  costUsd?: number;
  metadata?: Record<string, unknown>;
}) {
  const supabase = getSupabaseAdminClient();

  await supabase.from('usage_events').insert({
    organization_id: organizationId,
    user_id: userId,
    event_type: eventType,
    model: model ?? null,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    cost_usd: costUsd,
    metadata,
  });
}
