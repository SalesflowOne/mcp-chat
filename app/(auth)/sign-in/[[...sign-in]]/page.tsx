import { ClerkSignInView } from '@/components/auth/clerk-sign-in-view';
import { SatelliteAuthRedirect } from '@/components/auth/satellite-auth-redirect';
import { isClerkSatelliteApp } from '@/lib/clerk-config';

export default function SignInPage() {
  if (isClerkSatelliteApp()) {
    return <SatelliteAuthRedirect mode="sign-in" />;
  }

  return (
    <div className="flex min-h-dvh w-full items-center justify-center p-4">
      <ClerkSignInView />
    </div>
  );
}
