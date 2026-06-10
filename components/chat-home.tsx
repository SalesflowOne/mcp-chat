'use client';

import { UseChatHelpers } from '@ai-sdk/react';
import { LayoutTemplate, Sparkles } from 'lucide-react';
import Link from 'next/link';

import { APP_TAGLINE } from '@/lib/constants';
import { OPERATOR_PLAYBOOKS } from '@/lib/playbooks';
import { PlaybooksGrid } from '@/components/playbooks-grid';
import { Button } from '@/components/ui/button';

type ChatHomeProps = {
  append: UseChatHelpers['append'];
  chatId: string;
};

export function ChatHome({ append, chatId }: ChatHomeProps) {
  const runPlaybook = (prompt: string) => {
    window.history.replaceState({}, '', `/chat/${chatId}`);
    append({ role: 'user', content: prompt });
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-8">
      <div className="mb-8 max-w-2xl text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
          <Sparkles className="size-3.5 text-indigo-500" />
          Operator OS
        </div>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          What should we run?
        </h1>
        <p className="mt-3 text-muted-foreground">{APP_TAGLINE}</p>
      </div>

      <div className="mb-8 w-full max-w-3xl">
        <PlaybooksGrid
          playbooks={OPERATOR_PLAYBOOKS.slice(0, 4)}
          onSelect={runPlaybook}
          compact
        />
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-muted-foreground">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/connectors">Connect your stack</Link>
        </Button>
        <span className="text-border">·</span>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/playbooks">Browse playbooks</Link>
        </Button>
        <span className="text-border">·</span>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/spaces" className="inline-flex items-center gap-1.5">
            <LayoutTemplate className="size-3.5" />
            Spaces
          </Link>
        </Button>
      </div>
    </div>
  );
}
