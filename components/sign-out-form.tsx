import { signOutAction } from '@/app/(auth)/actions';
import { Button } from '@/components/ui/button';

export function SignOutForm() {
  return (
    <form action={signOutAction}>
      <Button type="submit" variant="outline">
        Sign out
      </Button>
    </form>
  );
}
