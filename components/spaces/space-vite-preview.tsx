'use client';

import { useState } from 'react';
import { Loader2, RefreshCw, Terminal } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { VitePreviewPhase } from '@/hooks/use-webcontainer-vite';
import { useWebContainerVite } from '@/hooks/use-webcontainer-vite';

type SpaceVitePreviewProps = {
  files: Array<{ path: string; content: string }>;
  refreshKey?: number;
};

const phaseLabel: Record<VitePreviewPhase, string> = {
  idle: 'Waiting…',
  booting: 'Booting WebContainer…',
  mounting: 'Mounting project files…',
  installing: 'Running npm install…',
  starting: 'Starting Vite dev server…',
  ready: 'Live',
  error: 'Error',
};

export function SpaceVitePreview({ files, refreshKey = 0 }: SpaceVitePreviewProps) {
  const { phase, previewUrl, logs, error, restart } = useWebContainerVite({
    files,
    refreshKey,
    enabled: files.length > 0,
  });
  const [showLogs, setShowLogs] = useState(false);

  return (
    <div className="flex h-full min-h-0 flex-col bg-muted/30">
      <div className="flex shrink-0 items-center justify-between border-b px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Vite preview</span>
          {phase !== 'ready' && phase !== 'error' && phase !== 'idle' && (
            <Loader2 className="size-3.5 animate-spin text-indigo-500" />
          )}
          <span className="truncate text-xs text-muted-foreground">{phaseLabel[phase]}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            onClick={() => setShowLogs((v) => !v)}
          >
            <Terminal className="mr-1 size-3.5" />
            Logs
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => void restart()}>
            <RefreshCw className="mr-1 size-3.5" />
            Restart
          </Button>
        </div>
      </div>

      {showLogs && (
        <pre className="max-h-32 shrink-0 overflow-auto border-b bg-zinc-950 px-3 py-2 text-[11px] leading-relaxed text-zinc-300">
          {logs.length > 0 ? logs.join('') : 'Waiting for output…'}
        </pre>
      )}

      {error && (
        <div className="shrink-0 border-b bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </div>
      )}

      <div className="relative min-h-0 flex-1 p-2">
        {previewUrl ? (
          <iframe
            key={previewUrl}
            title="Vite dev server preview"
            src={previewUrl}
            className="h-full w-full rounded-md border bg-white"
            allow="cross-origin-isolated"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 rounded-md border border-dashed bg-background/80 p-6 text-center">
            <Loader2 className="size-6 animate-spin text-indigo-500" />
            <p className="text-sm text-muted-foreground">{phaseLabel[phase]}</p>
            <p className="max-w-sm text-xs text-muted-foreground">
              Full React apps run in an in-browser Node.js environment. First boot may take
              30–60 seconds while dependencies install.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
