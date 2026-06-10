import 'server-only';

import { tool, type ToolSet } from 'ai';
import { z } from 'zod';

import { resolveTenantContext } from '@/lib/tenant/context';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import {
  createSpace,
  getSpaceById,
  updateSpaceMeta,
  upsertSpaceFiles,
} from '@/lib/spaces/repository';

const fileSchema = z.object({
  path: z
    .string()
    .describe('Relative file path, e.g. index.html, styles.css, script.js'),
  content: z.string().describe('Full file contents'),
});

export type SpaceToolsContext = {
  chatThreadId: string;
  spaceId?: string;
};

export async function getSpaceTools(
  ctx: SpaceToolsContext,
): Promise<ToolSet> {
  if (!isSupabaseConfigured()) {
    return {};
  }

  const tenant = await resolveTenantContext();
  if (!tenant) {
    return {};
  }

  const { chatThreadId, spaceId: boundSpaceId } = ctx;

  return {
    createSpace: tool({
      description:
        'Create a new AgentOps Space (generated website/app). Use when the user wants a landing page, site, dashboard, or multi-file web deliverable. Returns spaceId for subsequent updates.',
      parameters: z.object({
        title: z.string().describe('Short title for the space'),
        files: z
          .array(fileSchema)
          .optional()
          .describe('Optional initial files; defaults to index.html, styles.css, script.js'),
      }),
      execute: async ({ title, files }) => {
        const space = await createSpace({
          ctx: tenant,
          title,
          chatThreadId,
          files,
        });

        await updateSpaceMeta({
          spaceId: space.id,
          ctx: tenant,
          status: 'draft',
        });

        return {
          spaceId: space.id,
          slug: space.slug,
          title: space.title,
          previewPath: `/spaces/${space.id}`,
          message: `Created Space "${title}". User can preview at /spaces/${space.id}`,
        };
      },
    }),

    updateSpaceFiles: tool({
      description:
        'Update one or more files in an AgentOps Space. Creates a new version snapshot. Use for revisions to HTML/CSS/JS. Requires spaceId from createSpace or the active Space.',
      parameters: z.object({
        spaceId: z
          .string()
          .uuid()
          .optional()
          .describe('Space UUID; uses the chat-linked space if omitted'),
        files: z
          .array(fileSchema)
          .min(1)
          .describe('Files to create or replace (full content each)'),
        summary: z
          .string()
          .optional()
          .describe('Brief description of changes for version history'),
      }),
      execute: async ({ spaceId: paramSpaceId, files, summary }) => {
        let spaceId = paramSpaceId ?? boundSpaceId;

        if (!spaceId) {
          const { getSpaceByChatThreadId } = await import(
            '@/lib/spaces/repository'
          );
          const linked = await getSpaceByChatThreadId(chatThreadId, tenant);
          if (!linked) {
            throw new Error(
              'No spaceId provided and no Space linked to this chat. Call createSpace first.',
            );
          }
          spaceId = linked.id;
        }

        const space = await getSpaceById(spaceId, tenant);
        const { versionNumber } = await upsertSpaceFiles({
          ctx: tenant,
          spaceId: space.id,
          organizationId: space.organization_id,
          files,
          createVersion: true,
        });

        return {
          spaceId: space.id,
          title: space.title,
          versionNumber,
          filesUpdated: files.map((f) => f.path),
          previewPath: `/spaces/${space.id}`,
          message: `Updated Space "${space.title}"`,
        };
      },
    }),
  };
}
