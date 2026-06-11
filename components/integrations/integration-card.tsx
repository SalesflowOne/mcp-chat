'use client';

import type { App } from '@pipedream/sdk/browser';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { appLogoUrl, getAppSlug } from '@/lib/integrations/utils';
import { cn } from '@/lib/utils';

type IntegrationCardProps = {
  app: App;
  connectedCount?: number;
  href?: string;
  compact?: boolean;
  onConnect?: () => void;
  isConnecting?: boolean;
  showConnectButton?: boolean;
};

export function IntegrationCard({
  app,
  connectedCount = 0,
  href,
  compact = false,
  onConnect,
  isConnecting = false,
  showConnectButton = false,
}: IntegrationCardProps) {
  const slug = getAppSlug(app);
  const logo = appLogoUrl(app);
  const isConnected = connectedCount > 0;

  const cardBody = (
    <>
      <div className="flex items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-white">
          {logo ? (
            <Image
              src={logo}
              alt=""
              width={32}
              height={32}
              className="size-8 object-contain"
            />
          ) : (
            <span className="text-sm font-semibold text-muted-foreground">
              {app.name?.charAt(0) ?? '?'}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{app.name}</p>
          {isConnected ? (
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="size-1.5 shrink-0 rounded-full bg-emerald-500" />
              {connectedCount} account{connectedCount === 1 ? '' : 's'} connected
            </p>
          ) : (
            <p className="truncate text-xs text-muted-foreground">{slug}</p>
          )}
        </div>
      </div>
      {showConnectButton && onConnect && (
        <Button
          type="button"
          size="sm"
          variant={isConnected ? 'secondary' : 'default'}
          disabled={isConnecting}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onConnect();
          }}
          className="w-full"
        >
          {isConnecting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : isConnected ? (
            'Connected'
          ) : (
            'Connect'
          )}
        </Button>
      )}
    </>
  );

  const className = cn(
    'flex flex-col gap-3 rounded-xl border bg-card p-4 transition-all',
    href && 'hover:border-indigo-200 hover:shadow-sm dark:hover:border-indigo-800',
    compact ? 'gap-2 p-3' : 'p-4',
  );

  if (href && !showConnectButton) {
    return (
      <Link href={href} className={className}>
        {cardBody}
      </Link>
    );
  }

  return <div className={className}>{cardBody}</div>;
}
