import { ConnectedAccounts } from '@/components/connected-accounts';
import { ConnectorsHub } from '@/components/connectors-hub';
import { getConnectedAccounts } from '@/app/(chat)/accounts/actions';
import { getEffectiveSession } from '@/lib/auth-utils';
import { redirect } from 'next/navigation';

export default async function ConnectorsPage() {
  const session = await getEffectiveSession();
  if (!session?.user) {
    redirect('/sign-in');
  }

  const accounts = await getConnectedAccounts();
  const connectedSlugs = accounts
    .map((a) => a.app?.name_slug)
    .filter(Boolean) as string[];

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Connectors</h1>
        <p className="mt-1 text-muted-foreground">
          Connect the apps your business runs on. AgentOps can read and act on your behalf.
        </p>
      </div>

      <ConnectorsHub connectedAppSlugs={connectedSlugs} />

      {accounts.length > 0 && (
        <div className="mt-12 border-t pt-8">
          <ConnectedAccounts accounts={accounts} />
        </div>
      )}
    </div>
  );
}
