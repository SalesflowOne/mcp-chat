import { notFound, redirect } from 'next/navigation';

import { getConnectedAccounts } from '@/app/(chat)/accounts/actions';
import { IntegrationDetail } from '@/components/integrations/integration-detail';
import { getEffectiveSession } from '@/lib/auth-utils';
import { filterAccountsBySlug } from '@/lib/integrations/utils';
import { pdClient } from '@/lib/pd-backend-client';

type Params = { params: Promise<{ slug: string }> };

export default async function IntegrationDetailPage({ params }: Params) {
  const session = await getEffectiveSession();
  if (!session?.user) {
    redirect('/sign-in');
  }

  const { slug } = await params;

  let app;
  try {
    const response = await pdClient().apps.retrieve(slug);
    app = response.data;
  } catch {
    notFound();
  }

  if (!app?.name) {
    notFound();
  }

  const accounts = await getConnectedAccounts();
  const filtered = filterAccountsBySlug(accounts, slug);
  const addedByName = session.user.name || 'You';

  return (
    <div className="px-6 py-8 lg:px-10">
      <IntegrationDetail app={app} accounts={filtered} addedByName={addedByName} />
    </div>
  );
}
