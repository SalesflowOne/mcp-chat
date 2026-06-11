'use client';

import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

export function SignOutForm() {
  const { signOut } = useAuth();

  return (
    <Button type="button" variant="outline" onClick={() => void signOut()}>
      Sign out
    </Button>
  );
}
