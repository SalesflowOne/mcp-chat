import { ClerkSignUpView } from '@/components/auth/clerk-sign-up-view';
import { SatelliteAuthRedirect } from '@/components/auth/satellite-auth-redirect';
import { isClerkSatelliteApp } from '@/lib/clerk-config';

export default function SignUpPage() {
  if (isClerkSatelliteApp()) {
    return <SatelliteAuthRedirect mode="sign-up" />;
  }

  return (
    <div className="flex min-h-dvh w-full items-center justify-center p-4">
      <ClerkSignUpView />
    </div>
  );
}
