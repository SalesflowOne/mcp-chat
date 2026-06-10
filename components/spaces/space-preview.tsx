'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';

import { SpaceVitePreview } from '@/components/spaces/space-vite-preview';
import { Button } from '@/components/ui/button';
import {
  detectSpaceRuntime,
  isViteRuntime,
  previewFilesFromRows,
} from '@/lib/spaces/runtime';
import { fetcher } from '@/lib/utils';

type SpacePreviewProps = {
  spaceId: string;
  refreshKey?: number;
};

type SpaceDetailResponse = {
  space: { preview_kind: string };
  files: Array<{ path: string; content: string | null }>;
};

export function SpacePreview({ spaceId, refreshKey = 0 }: SpacePreviewProps) {
  const [reloadNonce, setReloadNonce] = useState(0);
  const { data, isLoading, mutate } = useSWR<SpaceDetailResponse>(
    `/api/spaces/${spaceId}`,
    fetcher,
    { revalidateOnFocus: false },
  );

  useEffect(() => {
    if (refreshKey > 0) {
      void mutate();
    }
  }, [refreshKey, mutate]);

  const runtime = useMemo(() => {
    if (!data?.files) return null;
    const fromKind = data.space.preview_kind;
    if (isViteRuntime(fromKind)) return 'vite';
    const detected = detectSpaceRuntime(previewFilesFromRows(data.files));
    return detected === 'vite_webcontainer' ? 'vite' : 'static';
  }, [data]);

  const viteFiles = useMemo(() => {
    if (!data?.files) return [];
    return previewFilesFromRows(data.files);
  }, [data?.files]);

  const handleRefresh = useCallback(() => {
    void mutate();
    setReloadNonce((n) => n + 1);
  }, [mutate]);

  const effectiveRefreshKey = refreshKey + reloadNonce;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Loading preview…
      </div>
    );
  }

  if (runtime === 'vite') {
    return (
      <SpaceVitePreview files={viteFiles} refreshKey={effectiveRefreshKey} />
    );
  }

  const previewSrc = `/api/spaces/${spaceId}/preview?_=${effectiveRefreshKey}`;

  return (
    <div className="flex h-full min-h-0 flex-col bg-muted/30">
      <div className="flex shrink-0 items-center justify-between border-b px-3 py-2">
        <span className="text-sm font-medium text-muted-foreground">Preview</span>
        <Button type="button" variant="outline" size="sm" onClick={handleRefresh}>
          Refresh
        </Button>
      </div>
      <div className="relative min-h-0 flex-1 p-2">
        <iframe
          key={previewSrc}
          title="Space preview"
          src={previewSrc}
          className="h-full w-full rounded-md border bg-white"
          sandbox="allow-scripts"
          referrerPolicy="no-referrer"
        />
      </div>
    </div>
  );
}
