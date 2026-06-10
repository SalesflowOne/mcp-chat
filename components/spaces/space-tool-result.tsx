'use client';

import Link from 'next/link';
import { ExternalLink, LayoutTemplate } from 'lucide-react';

import { useActiveSpace } from '@/hooks/use-active-space';
import { Button } from '@/components/ui/button';

type SpaceToolResultProps = {
  result: {
    spaceId?: string;
    title?: string;
    previewPath?: string;
    filesUpdated?: string[];
    versionNumber?: number | null;
    message?: string;
  };
};

export function SpaceToolResult({ result }: SpaceToolResultProps) {
  const { setActiveSpace } = useActiveSpace();
  const href = result.previewPath ?? (result.spaceId ? `/spaces/${result.spaceId}` : null);

  const openPreview = () => {
    if (result.spaceId) {
      setActiveSpace(result.spaceId, result.title);
    }
  };

  return (
    <div className="rounded-xl border bg-card px-4 py-3 text-sm shadow-sm">
      <div className="mb-2 flex items-center gap-2 font-medium">
        <LayoutTemplate className="size-4 text-indigo-500" />
        Space {result.title ? `· ${result.title}` : 'updated'}
      </div>
      {result.message && <p className="mb-2 text-muted-foreground">{result.message}</p>}
      {result.filesUpdated && result.filesUpdated.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {result.filesUpdated.join(', ')}
          {result.versionNumber != null ? ` · v${result.versionNumber}` : ''}
        </p>
      )}
      {href && (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button type="button" size="sm" onClick={openPreview}>
            Open preview
          </Button>
          <Button type="button" size="sm" variant="outline" asChild>
            <Link href={href} target="_blank">
              <ExternalLink className="mr-1.5 size-3.5" />
              Full workspace
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
