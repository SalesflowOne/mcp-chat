import 'server-only';

import { genSaltSync, hashSync } from 'bcrypt-ts';
import { and, asc, desc, eq, gt, gte, inArray } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import {
  user,
  chat,
  type User,
  document,
  type Suggestion,
  suggestion,
  message,
  vote,
  type DBMessage,
} from './schema';
import { ArtifactKind } from '@/components/artifact';
import { useSupabasePersistence } from '@/lib/data/persistence';
import {
  deleteChatByIdSupabase,
  getChatByIdSupabase,
  getChatsByUserIdSupabase,
  getMessagesByChatIdSupabase,
  getVotesByChatIdSupabase,
  saveChatSupabase,
  saveMessagesSupabase,
  updateChatVisibilitySupabase,
  voteMessageSupabase,
} from '@/lib/data/chat-supabase';
import { resolveTenantContext } from '@/lib/tenant/context';

let drizzleDb: ReturnType<typeof drizzle> | null = null;

function getDrizzleDb() {
  const url = process.env.POSTGRES_URL?.trim();
  if (!url) {
    throw new Error('POSTGRES_URL is not configured');
  }
  if (!drizzleDb) {
    drizzleDb = drizzle(postgres(url));
  }
  return drizzleDb;
}

/** @deprecated Legacy Drizzle export — only when POSTGRES_URL is set */
export function getDb() {
  return getDrizzleDb();
}

export async function getUser(email: string): Promise<Array<User>> {
  try {
    return await getDrizzleDb().select().from(user).where(eq(user.email, email));
  } catch (error) {
    console.error('Failed to get user from database');
    throw error;
  }
}

export async function createUser(email: string, password: string) {
  const salt = genSaltSync(10);
  const hash = hashSync(password, salt);

  try {
    return await getDrizzleDb().insert(user).values({ email, password: hash });
  } catch (error) {
    console.error('Failed to create user in database');
    throw error;
  }
}

export async function saveChat({
  id,
  userId,
  title,
  organizationId,
}: {
  id: string;
  userId: string;
  title: string;
  organizationId?: string;
}) {
  if (useSupabasePersistence()) {
    const tenant = await resolveTenantContext();
    if (!tenant) {
      throw new Error('Unauthorized');
    }
    return saveChatSupabase({
      id,
      authUserId: tenant.authUserId,
      appUserId: tenant.appUser.id,
      organizationId: organizationId ?? tenant.organizationId,
      title,
    });
  }

  try {
    return await getDrizzleDb().insert(chat).values({
      id,
      createdAt: new Date(),
      userId,
      title,
    });
  } catch (error) {
    console.error('Failed to save chat in database');
    throw error;
  }
}

export async function deleteChatById({
  id,
  authUserId,
}: {
  id: string;
  authUserId?: string;
}) {
  if (useSupabasePersistence()) {
    const tenant = await resolveTenantContext();
    if (!tenant) {
      throw new Error('Unauthorized');
    }
    return deleteChatByIdSupabase({
      id,
      authUserId: authUserId ?? tenant.authUserId,
    });
  }

  try {
    const dbx = getDrizzleDb();
    await dbx.delete(vote).where(eq(vote.chatId, id));
    await dbx.delete(message).where(eq(message.chatId, id));

    return await dbx.delete(chat).where(eq(chat.id, id));
  } catch (error) {
    console.error('Failed to delete chat by id from database');
    throw error;
  }
}

export async function getChatsByUserId({
  id,
  organizationId,
}: {
  id: string;
  organizationId?: string;
}) {
  if (useSupabasePersistence()) {
    const tenant = await resolveTenantContext();
    if (!tenant) {
      return [];
    }
    return getChatsByUserIdSupabase({
      appUserId: id,
      organizationId: organizationId ?? tenant.organizationId,
    });
  }

  try {
    return await getDrizzleDb()
      .select()
      .from(chat)
      .where(eq(chat.userId, id))
      .orderBy(desc(chat.createdAt));
  } catch (error) {
    console.error('Failed to get chats by user from database');
    throw error;
  }
}

export async function getChatById({
  id,
  authUserId,
}: {
  id: string;
  authUserId?: string;
}) {
  if (useSupabasePersistence()) {
    const tenant = await resolveTenantContext();
    if (!tenant) {
      return null;
    }
    return getChatByIdSupabase({
      id,
      authUserId: authUserId ?? tenant.authUserId,
    });
  }

  try {
    const [selectedChat] = await getDrizzleDb()
      .select()
      .from(chat)
      .where(eq(chat.id, id));
    return selectedChat;
  } catch (error) {
    console.error('Failed to get chat by id from database');
    throw error;
  }
}

export async function saveMessages({
  messages,
  organizationId,
  appUserId,
}: {
  messages: Array<DBMessage>;
  organizationId?: string;
  appUserId?: string;
}) {
  if (useSupabasePersistence()) {
    const tenant = await resolveTenantContext();
    if (!tenant) {
      throw new Error('Unauthorized');
    }
    return saveMessagesSupabase({
      messages: messages.map((m) => ({
        id: m.id,
        chatId: m.chatId,
        role: m.role,
        parts: m.parts,
        attachments: m.attachments,
        createdAt: m.createdAt,
      })),
      organizationId: organizationId ?? tenant.organizationId,
      appUserId: appUserId ?? tenant.appUser.id,
    });
  }

  try {
    return await getDrizzleDb().insert(message).values(messages);
  } catch (error) {
    console.error('Failed to save messages in database', error);
    throw error;
  }
}

export async function getMessagesByChatId({
  id,
  authUserId,
}: {
  id: string;
  authUserId?: string;
}) {
  if (useSupabasePersistence()) {
    const tenant = await resolveTenantContext();
    if (!tenant) {
      return [];
    }
    return getMessagesByChatIdSupabase({
      id,
      authUserId: authUserId ?? tenant.authUserId,
    });
  }

  try {
    return await getDrizzleDb()
      .select()
      .from(message)
      .where(eq(message.chatId, id))
      .orderBy(asc(message.createdAt));
  } catch (error) {
    console.error('Failed to get messages by chat id from database', error);
    throw error;
  }
}

export async function voteMessage({
  chatId,
  messageId,
  type,
}: {
  chatId: string;
  messageId: string;
  type: 'up' | 'down';
}) {
  if (useSupabasePersistence()) {
    return voteMessageSupabase();
  }

  try {
    const [existingVote] = await getDrizzleDb()
      .select()
      .from(vote)
      .where(and(eq(vote.messageId, messageId)));

    if (existingVote) {
      return await getDrizzleDb()
        .update(vote)
        .set({ isUpvoted: type === 'up' })
        .where(and(eq(vote.messageId, messageId), eq(vote.chatId, chatId)));
    }
    return await getDrizzleDb().insert(vote).values({
      chatId,
      messageId,
      isUpvoted: type === 'up',
    });
  } catch (error) {
    console.error('Failed to upvote message in database', error);
    throw error;
  }
}

export async function getVotesByChatId({ id }: { id: string }) {
  if (useSupabasePersistence()) {
    return getVotesByChatIdSupabase();
  }

  try {
    return await getDrizzleDb().select().from(vote).where(eq(vote.chatId, id));
  } catch (error) {
    console.error('Failed to get votes by chat id from database', error);
    throw error;
  }
}

export async function saveDocument({
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
  organizationId?: string;
}) {
  if (useSupabasePersistence() && organizationId) {
    const { saveArtifactSupabase } = await import('@/lib/data/artifacts-supabase');
    await saveArtifactSupabase({
      id,
      title,
      kind,
      content,
      userId,
      organizationId,
    });
    return;
  }

  try {
    return await getDrizzleDb().insert(document).values({
      id,
      title,
      kind,
      content,
      userId,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error('Failed to save document in database');
    throw error;
  }
}

export async function getDocumentsById({ id }: { id: string }) {
  if (useSupabasePersistence()) {
    const {
      getArtifactsByIdSupabase,
      toLegacyDocument,
    } = await import('@/lib/data/artifacts-supabase');
    const tenant = await resolveTenantContext();
    const rows = await getArtifactsByIdSupabase({ id });
    const userId = tenant?.appUser.id ?? '';
    return rows.map((r) => toLegacyDocument(r, r.user_id ?? userId));
  }

  try {
    const documents = await getDrizzleDb()
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(asc(document.createdAt));

    return documents;
  } catch (error) {
    console.error('Failed to get document by id from database');
    throw error;
  }
}

export async function getDocumentById({ id }: { id: string }) {
  if (useSupabasePersistence()) {
    const {
      getLatestArtifactSupabase,
      toLegacyDocument,
    } = await import('@/lib/data/artifacts-supabase');
    const tenant = await resolveTenantContext();
    const row = await getLatestArtifactSupabase({ id });
    if (!row) return undefined;
    return toLegacyDocument(row, row.user_id ?? tenant?.appUser.id ?? '');
  }

  try {
    const [selectedDocument] = await getDrizzleDb()
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(desc(document.createdAt));

    return selectedDocument;
  } catch (error) {
    console.error('Failed to get document by id from database');
    throw error;
  }
}

export async function deleteDocumentsByIdAfterTimestamp({
  id,
  timestamp,
}: {
  id: string;
  timestamp: Date;
}) {
  if (useSupabasePersistence()) {
    const { deleteArtifactsAfterTimestampSupabase } = await import(
      '@/lib/data/artifacts-supabase'
    );
    await deleteArtifactsAfterTimestampSupabase({ id, timestamp });
    return;
  }

  try {
    await getDrizzleDb()
      .delete(suggestion)
      .where(
        and(
          eq(suggestion.documentId, id),
          gt(suggestion.documentCreatedAt, timestamp),
        ),
      );

    return await getDrizzleDb()
      .delete(document)
      .where(and(eq(document.id, id), gt(document.createdAt, timestamp)));
  } catch (error) {
    console.error(
      'Failed to delete documents by id after timestamp from database',
    );
    throw error;
  }
}

export async function saveSuggestions({
  suggestions,
}: {
  suggestions: Array<Suggestion>;
}) {
  try {
    return await getDrizzleDb().insert(suggestion).values(suggestions);
  } catch (error) {
    console.error('Failed to save suggestions in database');
    throw error;
  }
}

export async function getSuggestionsByDocumentId({
  documentId,
}: {
  documentId: string;
}) {
  try {
    return await getDrizzleDb()
      .select()
      .from(suggestion)
      .where(and(eq(suggestion.documentId, documentId)));
  } catch (error) {
    console.error(
      'Failed to get suggestions by document version from database',
    );
    throw error;
  }
}

export async function getMessageById({ id }: { id: string }) {
  try {
    return await getDrizzleDb().select().from(message).where(eq(message.id, id));
  } catch (error) {
    console.error('Failed to get message by id from database');
    throw error;
  }
}

export async function deleteMessagesByChatIdAfterTimestamp({
  chatId,
  timestamp,
}: {
  chatId: string;
  timestamp: Date;
}) {
  try {
    const messagesToDelete = await getDrizzleDb()
      .select({ id: message.id })
      .from(message)
      .where(
        and(eq(message.chatId, chatId), gte(message.createdAt, timestamp)),
      );

    const messageIds = messagesToDelete.map((message) => message.id);

    if (messageIds.length > 0) {
      await getDrizzleDb()
        .delete(vote)
        .where(
          and(eq(vote.chatId, chatId), inArray(vote.messageId, messageIds)),
        );

      return await getDrizzleDb()
        .delete(message)
        .where(
          and(eq(message.chatId, chatId), inArray(message.id, messageIds)),
        );
    }
  } catch (error) {
    console.error(
      'Failed to delete messages by id after timestamp from database',
    );
    throw error;
  }
}

export async function updateChatVisiblityById({
  chatId,
  visibility,
  authUserId,
}: {
  chatId: string;
  visibility: 'private' | 'public';
  authUserId?: string;
}) {
  if (useSupabasePersistence()) {
    const tenant = await resolveTenantContext();
    if (!tenant) {
      throw new Error('Unauthorized');
    }
    return updateChatVisibilitySupabase({
      chatId,
      visibility,
      authUserId: authUserId ?? tenant.authUserId,
    });
  }

  try {
    return await getDrizzleDb()
      .update(chat)
      .set({ visibility })
      .where(eq(chat.id, chatId));
  } catch (error) {
    console.error('Failed to update chat visibility in database');
    throw error;
  }
}
