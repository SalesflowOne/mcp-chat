import 'server-only';

import { tool, type DataStreamWriter, type ToolSet } from 'ai';
import { z } from 'zod';

import {
  artifactKinds,
  documentHandlersByArtifactKind,
} from '@/lib/artifacts/server';
import type { AppSession } from '@/lib/auth-session';
import { getDocumentById } from '@/lib/db/queries';
import { generateUUID } from '@/lib/utils';

export function getArtifactTools({
  session,
  dataStream,
}: {
  session: AppSession;
  dataStream: DataStreamWriter;
}): ToolSet {
  return {
    createDocument: tool({
      description:
        "Create an artifact beside the chat. Use 'code' for scripts, 'text' for documents, 'sheet' for spreadsheets, 'image' for generated images.",
      parameters: z.object({
        title: z.string().describe('Title of the artifact'),
        kind: z
          .enum(artifactKinds)
          .describe('Artifact type: text, code, sheet, or image'),
      }),
      execute: async ({ title, kind }) => {
        const id = generateUUID();

        dataStream.writeData({ type: 'kind', content: kind });
        dataStream.writeData({ type: 'id', content: id });
        dataStream.writeData({ type: 'title', content: title });
        dataStream.writeData({ type: 'clear', content: '' });

        const handler = documentHandlersByArtifactKind.find((h) => h.kind === kind);
        if (!handler) {
          throw new Error(`No handler for kind: ${kind}`);
        }

        await handler.onCreateDocument({
          id,
          title,
          dataStream,
          session,
        });

        dataStream.writeData({ type: 'finish', content: '' });

        return { id, title, kind, message: `Created ${kind} artifact "${title}"` };
      },
    }),

    updateDocument: tool({
      description:
        'Rewrite an existing artifact. Use for major revisions to a document already created with createDocument.',
      parameters: z.object({
        id: z.string().describe('Artifact document id'),
        description: z
          .string()
          .describe('What to change in the artifact'),
      }),
      execute: async ({ id, description }) => {
        const document = await getDocumentById({ id });
        const ownerId = session.appUserId ?? session.user.id;

        if (!document) {
          return { error: 'Document not found' };
        }
        if (document.userId !== ownerId && document.userId !== session.user.id) {
          return { error: 'Forbidden' };
        }

        dataStream.writeData({ type: 'clear', content: '' });

        const handler = documentHandlersByArtifactKind.find(
          (h) => h.kind === document.kind,
        );
        if (!handler) {
          throw new Error(`No handler for kind: ${document.kind}`);
        }

        await handler.onUpdateDocument({
          document,
          description,
          dataStream,
          session,
        });

        dataStream.writeData({ type: 'finish', content: '' });

        return { id, message: `Updated artifact "${document.title}"` };
      },
    }),
  };
}
