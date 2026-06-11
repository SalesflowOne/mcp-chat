import { Suspense } from 'react';

import { AuthShell } from '@/components/auth/auth-shell';
import { RegisterForm } from '@/components/auth/register-form';

export default function RegisterPage() {
  return (
    <AuthShell title="Create account" subtitle="Start running your stack from one agent">
      <Suspense fallback={<div className="h-56 animate-pulse rounded-lg bg-muted" />}>
        <RegisterForm />
      </Suspense>
    </AuthShell>
  );
}
