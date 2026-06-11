import Link from 'next/link';

import { AgentOpsLogo } from '@/components/agentops-logo';
import { APP_NAME, APP_TAGLINE } from '@/lib/constants';

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-12">
      <div className="mb-8 text-center">
        <Link href="/" className="inline-flex flex-col items-center gap-3">
          <AgentOpsLogo />
          <p className="text-sm text-muted-foreground">{APP_TAGLINE}</p>
        </Link>
      </div>

      <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {subtitle ? (
            <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
        {children}
      </div>

      {footer ? (
        <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>
      ) : (
        <p className="mt-6 text-center text-xs text-muted-foreground">
          {APP_NAME} — powered by Supabase Auth
        </p>
      )}
    </div>
  );
}
