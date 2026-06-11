'use client';

import type { App } from '@pipedream/sdk/browser';
import { Loader2, Plus, Search } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { IntegrationCard } from '@/components/integrations/integration-card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/hooks/use-debounce';
import { POPULAR_INTEGRATION_SLUGS } from '@/lib/constants';
import { getAppSlug } from '@/lib/integrations/utils';

type IntegrationsHubProps = {
  connectedCounts: Record<string, number>;
  onConnected?: () => void;
};

type Tab = 'all' | 'popular';

export function IntegrationsHub({
  connectedCounts,
  onConnected,
}: IntegrationsHubProps) {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<Tab>('all');
  const [showConnectedOnly, setShowConnectedOnly] = useState(false);
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);
  const [customMcpOpen, setCustomMcpOpen] = useState(false);
  const debouncedSearch = useDebounce(search, 300);
  const fetchApps = useCallback(async (q: string, activeTab: Tab) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search: q,
        page: '1',
        pageSize: activeTab === 'popular' && !q ? '100' : '48',
      });
      const res = await fetch(`/api/list-apps?${params}`);
      if (!res.ok) throw new Error('Failed to load apps');
      const json = await res.json();
      setApps(json.data ?? []);
    } catch {
      toast.error('Could not load integrations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchApps(debouncedSearch, tab);
  }, [debouncedSearch, tab, fetchApps]);

  const displayApps = useMemo(() => {
    let list = apps;

    if (tab === 'popular' && !debouncedSearch) {
      const popularSet = new Set<string>(POPULAR_INTEGRATION_SLUGS);
      list = apps.filter((app) => popularSet.has(getAppSlug(app)));
      list.sort((a, b) => {
        const ai = POPULAR_INTEGRATION_SLUGS.indexOf(
          getAppSlug(a) as (typeof POPULAR_INTEGRATION_SLUGS)[number],
        );
        const bi = POPULAR_INTEGRATION_SLUGS.indexOf(
          getAppSlug(b) as (typeof POPULAR_INTEGRATION_SLUGS)[number],
        );
        return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
      });
    }

    if (showConnectedOnly) {
      list = list.filter((app) => (connectedCounts[getAppSlug(app)] ?? 0) > 0);
    }

    return list;
  }, [apps, tab, debouncedSearch, showConnectedOnly, connectedCounts]);

  const totalConnected = useMemo(
    () => Object.values(connectedCounts).reduce((sum, n) => sum + n, 0),
    [connectedCounts],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Integrations</h1>
          <p className="mt-1 max-w-2xl text-muted-foreground">
            Connect the tools you use and let AgentOps perform tasks across your stack.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="shrink-0"
          onClick={() => setCustomMcpOpen(true)}
        >
          <Plus className="mr-1.5 size-4" />
          Add Custom MCP
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search from 3,000+ integrations"
          className="h-11 pl-9"
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 rounded-lg border bg-muted/40 p-1">
          <button
            type="button"
            onClick={() => setTab('all')}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === 'all'
                ? 'bg-background shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            All integrations
          </button>
          <button
            type="button"
            onClick={() => setTab('popular')}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === 'popular'
                ? 'bg-background shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Popular integrations
          </button>
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
          <span>Show connected only</span>
          <button
            type="button"
            role="switch"
            aria-checked={showConnectedOnly}
            onClick={() => setShowConnectedOnly((v) => !v)}
            className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${
              showConnectedOnly ? 'bg-indigo-600' : 'bg-muted'
            }`}
          >
            <span
              className={`pointer-events-none inline-block size-5 translate-y-0.5 rounded-full bg-white shadow transition-transform ${
                showConnectedOnly ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </label>
      </div>

      {totalConnected > 0 && (
        <p className="text-sm text-muted-foreground">
          {totalConnected} account{totalConnected === 1 ? '' : 's'} connected across{' '}
          {Object.keys(connectedCounts).length} integration
          {Object.keys(connectedCounts).length === 1 ? '' : 's'}
        </p>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="mr-2 size-4 animate-spin" />
          Loading integrations…
        </div>
      ) : displayApps.length === 0 ? (
        <div className="rounded-xl border border-dashed py-16 text-center text-sm text-muted-foreground">
          {showConnectedOnly
            ? 'No connected integrations match your filters.'
            : 'No integrations found. Try a different search.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {displayApps.map((app) => {
            const slug = getAppSlug(app);
            const count = connectedCounts[slug] ?? 0;
            return (
              <IntegrationCard
                key={app.id ?? slug}
                app={app}
                connectedCount={count}
                href={`/connectors/${slug}`}
              />
            );
          })}
        </div>
      )}

      <Dialog open={customMcpOpen} onOpenChange={setCustomMcpOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Custom MCP</DialogTitle>
            <DialogDescription>
              Custom MCP servers let AgentOps call tools from your own APIs or internal
              services. This workspace uses Pipedream Connect — contact your admin to register
              a custom app in your Pipedream project, then connect it here like any other
              integration.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button type="button" onClick={() => setCustomMcpOpen(false)}>
              Got it
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
