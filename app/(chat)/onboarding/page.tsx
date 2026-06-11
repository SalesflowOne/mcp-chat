import { OnboardingWizard } from '@/components/onboarding-wizard';
import { getEffectiveSession } from '@/lib/auth-utils';
import { getConnectedAccounts } from '@/app/(chat)/accounts/actions';
import { redirect } from 'next/navigation';

export default async function OnboardingPage() {
  const session = await getEffectiveSession();
  if (!session?.user) {
    redirect('/login');
  }

  const accounts = await getConnectedAccounts();
  if (accounts.length >= 2) {
    redirect('/');
  }

  return <OnboardingWizard />;
}
