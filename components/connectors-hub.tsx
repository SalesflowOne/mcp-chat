'use client';

import { createFrontendClient, type App, type ConnectResult } from '@pipedream/sdk/browser';
import { Loader2, Plug, Search } from 'lucide-react';
import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { useDebounce } from '@/hooks/use-debounce';
import { useEffectiveSession } from '@/hooks/use-effective-session';
import { STARTER_CONNECTOR_SLUGS } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type ConnectorsHubProps = {
  connectedAppSlugs?: string[];
  onConnected?: () => void;
  compact?: boolean;
};

export function ConnectorsHub({
  connectedAppSlugs = [],
  onConnected,
  compact = false,
}: ConnectorsHubProps) {
  const { data: session } = useEffectiveSession();
  const externalUserId = session?.user?.id;
  const [search, setSearch] = useState('');
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const debouncedSearch = useDebounce(search, 300);

  const fetchApps = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search: q,
        page: '1',
        pageSize: compact ? '12' : '24',
      });
      const res = await fetch(`/api/list-apps?${params}`);
      if (!res.ok) throw new Error('Failed to load apps');
      const json = await res.json();
      setApps(json.data ?? []);
    } catch {
      toast.error('Could not load connectors');
    } finally {
      setLoading(false);
    }
  }, [compact]);

  useEffect(() => {
    void fetchApps(debouncedSearch);
  }, [debouncedSearch, fetchApps]);

  const connectApp = async (app: App) => {
    if (!externalUserId) {
      toast.error('Sign in to connect apps');
      return;
    }

    setConnecting(app.id);
    try {
      const tokenRes = await fetch('/api/connect/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ app: app.name_slug ?? app.nameSlug }),
      });
      if (!tokenRes.ok) throw new Error('Token failed');
      const { token } = await tokenRes.json();

      const pd = createFrontendClient({ externalUserId });
      pd.connectAccount({
        app: app.name_slug ?? app.nameSlug,
        token,
        onSuccess: (_result: ConnectResult) => {
          toast.success(`Connected ${app.name}`);
          onConnected?.();
          setConnecting(null);
        },
        onError: (err) => {
          console.error(err);
          toast.error(`Could not connect ${app.name}`);
          setConnecting(null);
        },
      });
    } catch {
      toast.error(`Could not connect ${app.name}`);
      setConnecting(null);
    }
  };

  const starterApps = apps.filter((a) =>
    STARTER_CONNECTOR_SLUGS.includes(
      (a.name_slug ?? a.nameSlug) as (typeof STARTER_CONNECTOR_SLUGS)[number],
    ),
  );

  const displayApps = debouncedSearch ? apps : starterApps.length > 0 ? starterApps : apps;

  return (
    <div className={compact ? 'space-y-3' : 'space-y-6'}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search 3,000+ integrations…"
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="mr-2 size-4 animate-spin" />
          Loading connectors…
        </div>
      ) : (
        <div
          className={
            compact
              ? 'grid grid-cols-2 gap-2 sm:grid-cols-3'
              : 'grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4'
          }
        >
          {displayApps.map((app) => {
            const slug = app.name_slug ?? app.nameSlug ?? '';
            const isConnected = connectedAppSlugs.includes(slug);
            return (
              <div
                key={app.id}
                className="flex flex-col gap-3 rounded-xl border bg-card p-4 transition-shadow hover:shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center overflow-hidden rounded-lg border bg-white">
                    <Image
                      src={`https://pipedream.com/s.v0/${app.id}/logo/48`}
                      alt=""
                      width={32}
                      height={32}
                      className="size-8 object-contain"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{app.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {slug}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant={isConnected ? 'secondary' : 'default'}
                  disabled={isConnected || connecting === app.id}
                  onClick={() => connectApp(app)}
                  className="w-full"
                >
                  {connecting === app.id ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : isConnected ? (
                    'Connected'
                  ) : (
                    <>
                      <Plug className="mr-1.5 size-3.5" />
                      Connect
                    </>
                  )}
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
