import { redirect } from 'next/navigation';

import { ClerkSignInView } from '@/components/auth/clerk-sign-in-view';
import {
  buildAccountPortalSignInUrl,
  isClerkSatelliteApp,
} from '@/lib/clerk-config';

export default function SignInPage() {
  if (isClerkSatelliteApp()) {
    redirect(buildAccountPortalSignInUrl('/'));
  }

  return (
    <div className="flex min-h-dvh w-full items-center justify-center p-4">
      <ClerkSignInView />
    </div>
  );
}
