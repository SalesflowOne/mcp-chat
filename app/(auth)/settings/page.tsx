import { redirect } from 'next/navigation';

import { AuthShell } from '@/components/auth/auth-shell';
import { ProfileForm } from '@/components/auth/profile-form';
import { requireAuth } from '@/lib/auth/server';

export default async function SettingsPage() {
  await requireAuth('/settings');

  return (
    <AuthShell title="Account settings" subtitle="Manage your profile and security">
      <ProfileForm />
    </AuthShell>
  );
}
