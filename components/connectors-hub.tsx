'use client';

import type { App } from '@pipedream/sdk/browser';
import { Loader2, Search } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { IntegrationCard } from '@/components/integrations/integration-card';
import { useConnectApp } from '@/hooks/use-connect-app';
import { useDebounce } from '@/hooks/use-debounce';
import { STARTER_CONNECTOR_SLUGS } from '@/lib/constants';
import { getAppSlug } from '@/lib/integrations/utils';
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
  const [search, setSearch] = useState('');
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);
  const debouncedSearch = useDebounce(search, 300);
  const { connectApp, connectingSlug } = useConnectApp();

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

  const starterApps = apps.filter((a) =>
    STARTER_CONNECTOR_SLUGS.includes(
      getAppSlug(a) as (typeof STARTER_CONNECTOR_SLUGS)[number],
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
            const slug = getAppSlug(app);
            const isConnected = connectedAppSlugs.includes(slug);
            return (
              <IntegrationCard
                key={app.id ?? slug}
                app={app}
                connectedCount={isConnected ? 1 : 0}
                compact={compact}
                showConnectButton
                isConnecting={connectingSlug === slug}
                onConnect={() => {
                  void connectApp(slug, app.name, onConnected);
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
