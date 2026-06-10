'use client';

import type { UIMessage } from 'ai';
import { useCallback, useMemo, useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { toast } from 'sonner';

import { Chat } from '@/components/chat';
import { DataStreamHandler } from '@/components/data-stream-handler';
import { SpaceFilesPanel, type SpaceFileItem } from '@/components/spaces/space-files-panel';
import { SpacePreview } from '@/components/spaces/space-preview';
import { Button } from '@/components/ui/button';
import { DEFAULT_CHAT_MODEL } from '@/lib/ai/models';
import { fetcher } from '@/lib/utils';
import type { VisibilityType } from '@/components/visibility-selector';

type SpaceDetailResponse = {
  space: {
    id: string;
    title: string;
    chat_thread_id: string | null;
    status: string;
  };
  files: SpaceFileItem[];
  versions: Array<{ version_number: number; created_at: string }>;
};

type SpaceWorkspaceProps = {
  spaceId: string;
  chatId: string;
  initialMessages: UIMessage[];
  selectedChatModel: string;
  selectedVisibilityType: VisibilityType;
  hasAPIKeys?: boolean;
};

export function SpaceWorkspace({
  spaceId,
  chatId,
  initialMessages,
  selectedChatModel,
  selectedVisibilityType,
  hasAPIKeys,
}: SpaceWorkspaceProps) {
  const { data, mutate } = useSWR<SpaceDetailResponse>(
    `/api/spaces/${spaceId}`,
    fetcher,
    { refreshInterval: 0 },
  );

  const [previewKey, setPreviewKey] = useState(0);
  const [selectedPath, setSelectedPath] = useState<string | null>('index.html');
  const [sharing, setSharing] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [deployUrl, setDeployUrl] = useState<string | null>(null);

  const title = data?.space.title ?? 'Space';

  const bumpPreview = useCallback(() => {
    setPreviewKey((k) => k + 1);
    void mutate();
  }, [mutate]);

  const handleDeploy = async () => {
    setDeploying(true);
    try {
      const res = await fetch(`/api/spaces/${spaceId}/deploy`, { method: 'POST' });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error ?? 'Deploy failed');
      }
      setDeployUrl(json.url);
      toast.success('Deployed to Vercel');
      if (json.url) {
        await navigator.clipboard.writeText(json.url);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Deploy failed');
    } finally {
      setDeploying(false);
    }
  };

  const handleShare = async () => {
    setSharing(true);
    try {
      const res = await fetch(`/api/spaces/${spaceId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expiresInHours: 168 }),
      });
      if (!res.ok) {
        throw new Error('Share failed');
      }
      const json = await res.json();
      await navigator.clipboard.writeText(json.publicUrl);
      toast.success('Share link copied to clipboard');
    } catch {
      toast.error('Could not create share link');
    } finally {
      setSharing(false);
    }
  };

  const selectedFile = useMemo(
    () => data?.files.find((f) => f.path === selectedPath),
    [data?.files, selectedPath],
  );

  return (
    <div className="flex h-dvh min-h-0 w-full flex-col">
      <header className="flex shrink-0 items-center justify-between gap-2 border-b px-4 py-2">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/spaces"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Spaces
          </Link>
          <span className="text-muted-foreground">/</span>
          <h1 className="truncate text-sm font-semibold">{title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={bumpPreview}>
            Sync preview
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDeploy}
            disabled={deploying}
          >
            {deploying ? 'Deploying…' : 'Deploy'}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleShare}
            disabled={sharing}
          >
            {sharing ? 'Sharing…' : 'Share'}
          </Button>
          {deployUrl && (
            <a
              href={deployUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-indigo-600 underline"
            >
              Live
            </a>
          )}
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-2">
        <div className="flex min-h-0 flex-col border-r">
          <Chat
            id={chatId}
            initialMessages={initialMessages}
            selectedChatModel={selectedChatModel}
            selectedVisibilityType={selectedVisibilityType}
            isReadonly={false}
            hasAPIKeys={hasAPIKeys}
            spaceId={spaceId}
            onSpaceUpdated={bumpPreview}
          />
          <DataStreamHandler id={chatId} />
        </div>

        <div className="grid min-h-0 grid-rows-[1fr_12rem] lg:grid-rows-1 lg:grid-cols-[1fr_11rem]">
          <SpacePreview spaceId={spaceId} refreshKey={previewKey} />
          <SpaceFilesPanel
            files={data?.files ?? []}
            selectedPath={selectedPath}
            onSelect={setSelectedPath}
          />
        </div>
      </div>

      {selectedFile?.content != null && (
        <details className="max-h-40 shrink-0 overflow-auto border-t bg-muted/20 px-4 py-2">
          <summary className="cursor-pointer text-xs font-medium text-muted-foreground">
            {selectedFile.path}
          </summary>
          <pre className="mt-2 overflow-x-auto text-xs">{selectedFile.content}</pre>
        </details>
      )}
    </div>
  );
}
