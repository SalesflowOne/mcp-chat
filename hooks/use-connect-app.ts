'use client';

import { createFrontendClient, type ConnectResult } from '@pipedream/sdk/browser';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

import { useEffectiveSession } from '@/hooks/use-effective-session';

export function useConnectApp() {
  const { data: session } = useEffectiveSession();
  const externalUserId = session?.user?.id;
  const [connectingSlug, setConnectingSlug] = useState<string | null>(null);

  const connectApp = useCallback(
    async (slug: string, appName: string, onSuccess?: () => void) => {
      if (!externalUserId) {
        toast.error('Sign in to connect apps');
        return;
      }

      setConnectingSlug(slug);
      try {
        const tokenRes = await fetch('/api/connect/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ app: slug }),
        });
        if (!tokenRes.ok) throw new Error('Token failed');
        const { token } = await tokenRes.json();

        const pd = createFrontendClient({ externalUserId });
        pd.connectAccount({
          app: slug,
          token,
          onSuccess: (_result: ConnectResult) => {
            toast.success(`Connected ${appName}`);
            onSuccess?.();
            setConnectingSlug(null);
          },
          onError: (err) => {
            console.error(err);
            toast.error(`Could not connect ${appName}`);
            setConnectingSlug(null);
          },
        });
      } catch {
        toast.error(`Could not connect ${appName}`);
        setConnectingSlug(null);
      }
    },
    [externalUserId],
  );

  return { connectApp, connectingSlug, isConnecting: connectingSlug != null };
}
