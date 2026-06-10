'use client';

import Link from 'next/link';
import { useState } from 'react';

import { AgentOpsLogo } from '@/components/agentops-logo';
import { SignInModal } from './sign-in-modal';
import { Button } from './ui/button';

export function SignedOutHeader() {
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);

  return (
    <header className="sticky top-0 z-10 flex items-center gap-4 border-b bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <Link href="/">
        <AgentOpsLogo />
      </Link>

      <p className="hidden text-sm text-muted-foreground md:block">
        Run your entire stack from one agent
      </p>

      <div className="ml-auto flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
          <Link href="https://pipedream.com/docs/connect/mcp/developers" target="_blank">
            Docs
          </Link>
        </Button>
        <Button onClick={() => setIsSignInModalOpen(true)} size="sm">
          Sign in
        </Button>
      </div>

      <SignInModal
        isOpen={isSignInModalOpen}
        onClose={() => setIsSignInModalOpen(false)}
      />
    </header>
  );
}
