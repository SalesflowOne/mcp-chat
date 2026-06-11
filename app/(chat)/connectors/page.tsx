import { IntegrationsHub } from '@/components/integrations/integrations-hub';
import { getConnectedAccounts } from '@/app/(chat)/accounts/actions';
import { getEffectiveSession } from '@/lib/auth-utils';
import { countAccountsBySlug } from '@/lib/integrations/utils';
import { redirect } from 'next/navigation';

export default async function ConnectorsPage() {
  const session = await getEffectiveSession();
  if (!session?.user) {
    redirect('/sign-in');
  }

  const accounts = await getConnectedAccounts();
  const connectedCounts = countAccountsBySlug(accounts);

  return (
    <div className="px-6 py-8 lg:px-10">
      <IntegrationsHub connectedCounts={connectedCounts} />
    </div>
  );
}
