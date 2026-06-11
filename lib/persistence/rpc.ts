import 'server-only';

import { createClient } from '@supabase/supabase-js';

import type { AppUserRow, ChatMessageRow, ChatThreadRow, OrganizationRow } from '@/lib/supabase/types';
import type { TenantContext } from '@/lib/tenant/context';
import {
  getSupabaseAnonKey,
  getSupabaseUrl,
  isRpcPersistConfigured,
} from '@/lib/supabase/config';

export { isRpcPersistConfigured };

function getRpcClient() {
  return createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function persistSecret(): string {
  const secret = process.env.AGENTOPS_PERSIST_SECRET?.trim();
  if (!secret) {
    throw new Error('AGENTOPS_PERSIST_SECRET is not configured');
  }
  return secret;
}

export async function resolveTenantViaRpc(input: {
  clerkUserId: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  clerkOrgId: string | null;
  clerkOrgName: string | null;
  clerkRole: string | null;
  cookieOrgId: string | null;
}): Promise<TenantContext> {
  const supabase = getRpcClient();
  const secret = persistSecret();

  const { data: appUser, error: userError } = await supabase.rpc('agentops_upsert_app_user', {
    p_secret: secret,
    p_clerk_user_id: input.clerkUserId,
    p_email: input.email,
    p_full_name: input.fullName,
    p_avatar_url: input.avatarUrl,
  });

  if (userError || !appUser) {
    throw userError ?? new Error('Failed to upsert app user');
  }

  let organization: OrganizationRow;
  if (input.clerkOrgId) {
    const { data: org, error: orgError } = await supabase.rpc('agentops_sync_clerk_org', {
      p_secret: secret,
      p_clerk_org_id: input.clerkOrgId,
      p_clerk_org_name: input.clerkOrgName ?? 'Organization',
      p_app_user_id: appUser.id,
      p_clerk_user_id: input.clerkUserId,
      p_clerk_role: input.clerkRole ?? 'member',
    });
    if (orgError || !org) {
      throw orgError ?? new Error('Failed to sync organization');
    }
    organization = org as OrganizationRow;
  } else {
    const { data: org, error: orgError } = await supabase.rpc('agentops_ensure_default_org', {
      p_secret: secret,
      p_app_user_id: appUser.id,
    });
    if (orgError || !org) {
      throw orgError ?? new Error('Failed to ensure default organization');
    }
    organization = org as OrganizationRow;
  }

  if (input.cookieOrgId && input.cookieOrgId !== organization.id) {
    const { data: overrideOrg } = await supabase.rpc('agentops_get_org_if_member', {
      p_secret: secret,
      p_org_id: input.cookieOrgId,
      p_app_user_id: appUser.id,
      p_is_master_admin: appUser.is_master_admin,
    });
    if (overrideOrg) {
      organization = overrideOrg as OrganizationRow;
    }
  }

  return {
    appUser: appUser as AppUserRow,
    organization,
    clerkUserId: input.clerkUserId,
    organizationId: organization.id,
  };
}

export async function saveChatViaRpc(input: {
  id: string;
  appUserId: string;
  organizationId: string;
  title: string;
}) {
  const supabase = getRpcClient();
  const { error } = await supabase.rpc('agentops_save_chat', {
    p_secret: persistSecret(),
    p_id: input.id,
    p_organization_id: input.organizationId,
    p_app_user_id: input.appUserId,
    p_title: input.title,
  });
  if (error) throw error;
}

export async function getChatByIdViaRpc(input: {
  id: string;
  clerkUserId: string;
}): Promise<ChatThreadRow | null> {
  const supabase = getRpcClient();
  const { data, error } = await supabase.rpc('agentops_get_chat_by_id', {
    p_secret: persistSecret(),
    p_chat_id: input.id,
    p_clerk_user_id: input.clerkUserId,
  });
  if (error) throw error;
  return (data as ChatThreadRow | null) ?? null;
}

export async function getChatsByUserViaRpc(input: {
  appUserId: string;
  organizationId: string;
}): Promise<ChatThreadRow[]> {
  const supabase = getRpcClient();
  const { data, error } = await supabase.rpc('agentops_get_chats_by_user', {
    p_secret: persistSecret(),
    p_app_user_id: input.appUserId,
    p_organization_id: input.organizationId,
  });
  if (error) throw error;
  return (data as ChatThreadRow[]) ?? [];
}

export async function saveMessagesViaRpc(input: {
  organizationId: string;
  appUserId: string;
  messages: Array<{
    id: string;
    chatId: string;
    role: string;
    parts: unknown;
    attachments: unknown;
    createdAt: string;
    content?: string | null;
  }>;
}) {
  const supabase = getRpcClient();
  const { error } = await supabase.rpc('agentops_save_messages', {
    p_secret: persistSecret(),
    p_organization_id: input.organizationId,
    p_app_user_id: input.appUserId,
    p_messages: input.messages,
  });
  if (error) throw error;
}

export async function getMessagesByChatIdViaRpc(input: {
  id: string;
  clerkUserId: string;
}): Promise<ChatMessageRow[]> {
  const supabase = getRpcClient();
  const { data, error } = await supabase.rpc('agentops_get_messages_by_chat', {
    p_secret: persistSecret(),
    p_chat_id: input.id,
    p_clerk_user_id: input.clerkUserId,
  });
  if (error) throw error;
  return (data as ChatMessageRow[]) ?? [];
}
