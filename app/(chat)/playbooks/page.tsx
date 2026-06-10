'use client';

import { useRouter } from 'next/navigation';
import { generateUUID } from '@/lib/utils';
import { OPERATOR_PLAYBOOKS } from '@/lib/playbooks';
import { PlaybooksGrid } from '@/components/playbooks-grid';

export default function PlaybooksPage() {
  const router = useRouter();

  const runPlaybook = (prompt: string) => {
    const id = generateUUID();
    sessionStorage.setItem('agentops_pending_prompt', prompt);
    router.push(`/chat/${id}`);
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Playbooks</h1>
        <p className="mt-1 text-muted-foreground">
          Proven operator workflows. One click to run across your connected stack.
        </p>
      </div>
      <PlaybooksGrid playbooks={OPERATOR_PLAYBOOKS} onSelect={runPlaybook} />
    </div>
  );
}
