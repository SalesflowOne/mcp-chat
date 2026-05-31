import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { Suspense } from 'react';

import { SpaceWorkspace } from '@/components/spaces/space-workspace';
import { DEFAULT_CHAT_MODEL } from '@/lib/ai/models';
import { hasValidAPIKeys } from '@/lib/ai/api-keys';
import { getEffectiveSession } from '@/lib/auth-utils';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { resolveTenantContext } from '@/lib/tenant/context';
import { getSpaceById } from '@/lib/spaces/repository';
import { getMessagesByChatId } from '@/lib/db/queries';
import { generateUUID } from '@/lib/utils';
import type { UIMessage } from 'ai';
import type { LegacyDBMessage } from '@/lib/data/chat-supabase';

export default function SpacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<div className="flex h-dvh w-full" />}>
      <SpacePageInner params={params} />
    </Suspense>
  );
}

function toUIMessages(messages: Array<LegacyDBMessage>): UIMessage[] {
  return messages.map((m) => ({
    id: m.id,
    role: m.role as UIMessage['role'],
    content: '',
    parts: m.parts as UIMessage['parts'],
    experimental_attachments: m.attachments as UIMessage['experimental_attachments'],
  }));
}

async function SpacePageInner({ params }: { params: Promise<{ id: string }> }) {
  const { id: spaceId } = await params;

  if (!isSupabaseConfigured()) {
    redirect('/');
  }

  const session = await getEffectiveSession();
  if (!session?.user) {
    redirect('/sign-in');
  }

  const ctx = await resolveTenantContext();
  if (!ctx) {
    redirect('/sign-in');
  }

  let space;
  try {
    space = await getSpaceById(spaceId, ctx);
  } catch {
    notFound();
  }

  let chatId = space.chat_thread_id;
  if (!chatId) {
    chatId = generateUUID();
    const { getSupabaseAdminClient } = await import('@/lib/supabase/admin');
    const supabase = getSupabaseAdminClient();
    await supabase.from('chat_threads').insert({
      id: chatId,
      organization_id: space.organization_id,
      user_id: ctx.appUser.id,
      title: space.title,
      visibility: 'private',
    });
    await supabase
      .from('spaces')
      .update({ chat_thread_id: chatId })
      .eq('id', spaceId);
  }

  const cookieStore = await cookies();
  const modelIdFromCookie = cookieStore.get('chat-model');
  const selectedChatModel = modelIdFromCookie?.value ?? DEFAULT_CHAT_MODEL;

  let initialMessages: UIMessage[] = [];
  try {
    const messages = await getMessagesByChatId({
      id: chatId,
      clerkUserId: ctx.clerkUserId,
    });
    initialMessages = toUIMessages(messages);
  } catch {
    initialMessages = [];
  }

  return (
    <SpaceWorkspace
      spaceId={spaceId}
      chatId={chatId}
      initialMessages={initialMessages}
      selectedChatModel={selectedChatModel}
      selectedVisibilityType="private"
      hasAPIKeys={hasValidAPIKeys()}
    />
  );
}
