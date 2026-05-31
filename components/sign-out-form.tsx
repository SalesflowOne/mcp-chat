'use client';

import { useClerk } from '@clerk/nextjs';

export const SignOutForm = () => {
  const { signOut } = useClerk();

  return (
    <button
      type="button"
      className="w-full text-left px-1 py-0.5 text-red-500"
      onClick={() => signOut({ redirectUrl: '/' })}
    >
      Sign out
    </button>
  );
};
