'use client';

import Link from 'next/link';
import { ExternalLink, PanelRightClose, RefreshCw } from 'lucide-react';
import { useCallback, useState } from 'react';

import { SpacePreview } from '@/components/spaces/space-preview';
import { Button } from '@/components/ui/button';
import { useActiveSpace } from '@/hooks/use-active-space';

export function InlineSpacePanel() {
  const { spaceId, title, clearActiveSpace } = useActiveSpace();
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  if (!spaceId) return null;

  return (
    <div className="flex h-full min-h-0 flex-col border-l bg-background">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b px-3 py-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{title ?? 'Space preview'}</p>
          <p className="text-xs text-muted-foreground">Live artifact</p>
        </div>
        <div className="flex items-center gap-1">
          <Button type="button" variant="ghost" size="icon" className="size-8" onClick={refresh}>
            <RefreshCw className="size-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon" className="size-8" asChild>
            <Link href={`/spaces/${spaceId}`} target="_blank">
              <ExternalLink className="size-4" />
            </Link>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={clearActiveSpace}
          >
            <PanelRightClose className="size-4" />
          </Button>
        </div>
      </div>
      <div className="min-h-0 flex-1">
        <SpacePreview spaceId={spaceId} refreshKey={refreshKey} />
      </div>
    </div>
  );
}
