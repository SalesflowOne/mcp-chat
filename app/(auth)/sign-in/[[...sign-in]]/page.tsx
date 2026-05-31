import { ClerkSignInView } from '@/components/auth/clerk-sign-in-view';

export default function SignInPage() {
  return (
    <div className="flex min-h-dvh w-full items-center justify-center p-4">
      <ClerkSignInView />
    </div>
  );
}
