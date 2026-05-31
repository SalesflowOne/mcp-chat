'use client';

import { useCallback, useState } from 'react';

import { Button } from '@/components/ui/button';

type SpacePreviewProps = {
  spaceId: string;
  refreshKey?: number;
};

export function SpacePreview({ spaceId, refreshKey = 0 }: SpacePreviewProps) {
  const [reloadNonce, setReloadNonce] = useState(0);
  const previewSrc = `/api/spaces/${spaceId}/preview?_=${refreshKey}-${reloadNonce}`;

  const handleRefresh = useCallback(() => {
    setReloadNonce((n) => n + 1);
  }, []);

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
