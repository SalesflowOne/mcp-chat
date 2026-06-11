'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { WebContainer } from '@webcontainer/api';

import { buildWebContainerTree, type FlatSpaceFile } from '@/lib/spaces/webcontainer-tree';

export type VitePreviewPhase =
  | 'idle'
  | 'booting'
  | 'mounting'
  | 'installing'
  | 'starting'
  | 'ready'
  | 'error';

type UseWebContainerViteOptions = {
  files: FlatSpaceFile[];
  refreshKey?: number;
  enabled?: boolean;
};

let webcontainerBoot: Promise<WebContainer> | null = null;

async function getWebContainerInstance(): Promise<WebContainer> {
  if (!webcontainerBoot) {
    webcontainerBoot = import('@webcontainer/api').then(({ WebContainer }) =>
      WebContainer.boot(),
    );
  }
  return webcontainerBoot;
}

function isWebContainerSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    typeof window.crossOriginIsolated !== 'undefined' &&
    window.crossOriginIsolated === true &&
    typeof SharedArrayBuffer !== 'undefined'
  );
}

export function useWebContainerVite({
  files,
  refreshKey = 0,
  enabled = true,
}: UseWebContainerViteOptions) {
  const [phase, setPhase] = useState<VitePreviewPhase>('idle');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const devProcessRef = useRef<{ kill: () => void } | null>(null);
  const unsubscribeServerReadyRef = useRef<(() => void) | null>(null);
  const containerRef = useRef<WebContainer | null>(null);
  const filesRef = useRef(files);
  filesRef.current = files;
  const runIdRef = useRef(0);

  const appendLog = useCallback((line: string) => {
    setLogs((prev) => [...prev.slice(-80), line]);
  }, []);

  const teardown = useCallback(async () => {
    devProcessRef.current?.kill();
    devProcessRef.current = null;

    unsubscribeServerReadyRef.current?.();
    unsubscribeServerReadyRef.current = null;
  }, []);

  const start = useCallback(async () => {
    const currentFiles = filesRef.current;
    if (!enabled || currentFiles.length === 0) return;

    if (!isWebContainerSupported()) {
      setPhase('error');
      setError(
        'WebContainer requires cross-origin isolation. Open this Space at /spaces/{id} for Vite preview.',
      );
      return;
    }

    const runId = ++runIdRef.current;
    setPhase('booting');
    setError(null);
    setPreviewUrl(null);
    setLogs([]);

    try {
      await teardown();

      const container = await getWebContainerInstance();
      if (runId !== runIdRef.current) return;
      containerRef.current = container;

      setPhase('mounting');
      await container.mount(buildWebContainerTree(currentFiles));
      if (runId !== runIdRef.current) return;

      setPhase('installing');
      const install = await container.spawn('npm', ['install']);
      install.output.pipeTo(
        new WritableStream({
          write(data) {
            appendLog(data);
          },
        }),
      );
      const installExit = await install.exit;
      if (runId !== runIdRef.current) return;
      if (installExit !== 0) {
        throw new Error(`npm install failed (exit ${installExit})`);
      }

      setPhase('starting');
      const dev = await container.spawn('npm', ['run', 'dev']);
      devProcessRef.current = dev;
      dev.output.pipeTo(
        new WritableStream({
          write(data) {
            appendLog(data);
          },
        }),
      );

      await new Promise<void>((resolve, reject) => {
        const timeout = window.setTimeout(() => {
          reject(new Error('Vite dev server did not start within 60s'));
        }, 60_000);

        const onReady = (port: number, url: string) => {
          if (runId !== runIdRef.current) return;
          window.clearTimeout(timeout);
          setPreviewUrl(url);
          setPhase('ready');
          appendLog(`Dev server ready on port ${port}: ${url}`);
          resolve();
        };

        unsubscribeServerReadyRef.current = container.on('server-ready', onReady);
      });
    } catch (e) {
      if (runId !== runIdRef.current) return;
      setPhase('error');
      setError(e instanceof Error ? e.message : 'Failed to start Vite preview');
    }
  }, [appendLog, enabled, teardown]);

  useEffect(() => {
    if (!enabled) return;
    void start();
    return () => {
      runIdRef.current += 1;
      void teardown();
    };
  }, [enabled, refreshKey, start, teardown]);

  return {
    phase,
    previewUrl,
    logs,
    error,
    supported: isWebContainerSupported(),
    restart: start,
  };
}
