import { redirect } from 'next/navigation';

import { ClerkSignUpView } from '@/components/auth/clerk-sign-up-view';
import {
  buildSatelliteReturnUrl,
  getClerkPrimarySignUpUrl,
  isClerkSatelliteApp,
} from '@/lib/clerk-config';

export default function SignUpPage() {
  if (isClerkSatelliteApp()) {
    const signUp = new URL(getClerkPrimarySignUpUrl());
    signUp.searchParams.set('redirect_url', buildSatelliteReturnUrl('/'));
    redirect(signUp.toString());
  }

  return (
    <div className="flex min-h-dvh w-full items-center justify-center p-4">
      <ClerkSignUpView />
    </div>
  );
}
