'use client';

import Link from 'next/link';

type SpaceToolResultProps = {
  result: {
    spaceId?: string;
    previewPath?: string;
    filesUpdated?: string[];
    versionNumber?: number | null;
    message?: string;
  };
};

export function SpaceToolResult({ result }: SpaceToolResultProps) {
  const href = result.previewPath ?? (result.spaceId ? `/spaces/${result.spaceId}` : null);

  return (
    <div className="rounded-lg border bg-muted/40 px-3 py-2 text-sm">
      {result.message && <p className="mb-1">{result.message}</p>}
      {result.filesUpdated && result.filesUpdated.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Updated: {result.filesUpdated.join(', ')}
          {result.versionNumber != null ? ` (v${result.versionNumber})` : ''}
        </p>
      )}
      {href && (
        <Link href={href} className="mt-2 inline-block text-sm font-medium underline">
          Open Space preview
        </Link>
      )}
    </div>
  );
}
