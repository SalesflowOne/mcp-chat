import { redirect } from 'next/navigation';

import { ClerkSignUpView } from '@/components/auth/clerk-sign-up-view';
import {
  buildAccountPortalSignUpUrl,
  isClerkSatelliteApp,
} from '@/lib/clerk-config';

export default function SignUpPage() {
  if (isClerkSatelliteApp()) {
    redirect(buildAccountPortalSignUpUrl('/'));
  }

  return (
    <div className="flex min-h-dvh w-full items-center justify-center p-4">
      <ClerkSignUpView />
    </div>
  );
}
