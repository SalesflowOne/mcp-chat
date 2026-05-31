'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';

export type SpaceFileItem = {
  path: string;
  content: string | null;
  mime_type: string;
  byte_size: number;
};

type SpaceFilesPanelProps = {
  files: SpaceFileItem[];
  selectedPath: string | null;
  onSelect: (path: string) => void;
};

export function SpaceFilesPanel({
  files,
  selectedPath,
  onSelect,
}: SpaceFilesPanelProps) {
  const [tab, setTab] = useState<'files' | 'versions'>('files');

  return (
    <div className="flex h-full min-h-0 flex-col border-l bg-background">
      <div className="flex shrink-0 border-b">
        <button
          type="button"
          className={`flex-1 px-3 py-2 text-sm ${tab === 'files' ? 'border-b-2 border-foreground font-medium' : 'text-muted-foreground'}`}
          onClick={() => setTab('files')}
        >
          Files
        </button>
        <button
          type="button"
          className={`flex-1 px-3 py-2 text-sm ${tab === 'versions' ? 'border-b-2 border-foreground font-medium' : 'text-muted-foreground'}`}
          onClick={() => setTab('versions')}
        >
          Info
        </button>
      </div>
      {tab === 'files' ? (
        <ul className="min-h-0 flex-1 overflow-y-auto p-2 text-sm">
          {files.map((file) => (
            <li key={file.path}>
              <Button
                type="button"
                variant={selectedPath === file.path ? 'secondary' : 'ghost'}
                className="h-auto w-full justify-start px-2 py-1.5 font-mono text-xs"
                onClick={() => onSelect(file.path)}
              >
                {file.path}
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="p-3 text-xs text-muted-foreground">
          Version history is saved on each agent update. Restore via chat: ask the
          agent to revert changes.
        </div>
      )}
    </div>
  );
}
