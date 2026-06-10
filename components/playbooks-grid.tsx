'use client';

import type { Playbook } from '@/lib/playbooks';
import { PLAYBOOK_CATEGORIES } from '@/lib/playbooks';
import { cn } from '@/lib/utils';

type PlaybooksGridProps = {
  playbooks: Playbook[];
  onSelect: (prompt: string) => void;
  compact?: boolean;
};

export function PlaybooksGrid({
  playbooks,
  onSelect,
  compact = false,
}: PlaybooksGridProps) {
  return (
    <div
      className={cn(
        'grid gap-2',
        compact ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3',
      )}
    >
      {playbooks.map((playbook) => (
        <button
          key={playbook.id}
          type="button"
          onClick={() => onSelect(playbook.prompt)}
          className="group rounded-xl border bg-card p-4 text-left transition-all hover:border-indigo-300 hover:shadow-sm dark:hover:border-indigo-800"
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-sm font-medium group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
              {playbook.title}
            </span>
            <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              {PLAYBOOK_CATEGORIES[playbook.category]}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{playbook.description}</p>
        </button>
      ))}
    </div>
  );
}
