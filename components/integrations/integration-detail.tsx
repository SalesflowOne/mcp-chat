'use client';

import type { Account, App } from '@pipedream/sdk/browser';
import { ChevronRight, Loader2, Plus } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { IntegrationAccountsTable } from '@/components/integrations/integration-accounts-table';
import { Button } from '@/components/ui/button';
import { useConnectApp } from '@/hooks/use-connect-app';
import { appLogoUrl, getAppSlug } from '@/lib/integrations/utils';

type IntegrationDetailProps = {
  app: App;
  accounts: Account[];
  addedByName: string;
};

export function IntegrationDetail({
  app,
  accounts,
  addedByName,
}: IntegrationDetailProps) {
  const router = useRouter();
  const slug = getAppSlug(app);
  const logo = appLogoUrl(app);
  const { connectApp, connectingSlug } = useConnectApp();

  const handleConnect = () => {
    void connectApp(slug, app.name, () => {
      router.refresh();
    });
  };

  return (
    <div className="space-y-8">
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/connectors" className="hover:text-foreground">
          Integrations
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground">{app.name}</span>
      </nav>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-4">
          <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-white">
            {logo ? (
              <Image
                src={logo}
                alt=""
                width={40}
                height={40}
                className="size-10 object-contain"
              />
            ) : (
              <span className="text-lg font-semibold text-muted-foreground">
                {app.name?.charAt(0)}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{app.name}</h1>
            <p className="mt-1 max-w-2xl text-muted-foreground">
              {app.description ||
                `Connect ${app.name} so AgentOps can read data and take action on your behalf.`}
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          className="shrink-0"
          disabled={connectingSlug === slug}
          onClick={handleConnect}
        >
          {connectingSlug === slug ? (
            <Loader2 className="mr-1.5 size-4 animate-spin" />
          ) : (
            <Plus className="mr-1.5 size-4" />
          )}
          Add another account
        </Button>
      </div>

      {accounts.length === 0 ? (
        <div className="rounded-xl border border-dashed px-6 py-12 text-center">
          <p className="text-muted-foreground">No accounts connected yet.</p>
          <Button type="button" className="mt-4" onClick={handleConnect}>
            Connect {app.name}
          </Button>
        </div>
      ) : (
        <IntegrationAccountsTable
          accounts={accounts}
          appName={app.name}
          appLogo={logo}
          addedByName={addedByName}
        />
      )}
    </div>
  );
}
