'use client';

import { startTransition, useMemo, useOptimistic, useState } from 'react';
import useSWR from 'swr';
import { ChevronDown } from 'lucide-react';

import { saveChatModelAsCookie } from '@/app/(chat)/actions';
import { chatModels } from '@/lib/ai/models';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function ModelSelectorInline({
  selectedModelId,
  disabled,
}: {
  selectedModelId: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [optimisticModelId, setOptimisticModelId] =
    useOptimistic(selectedModelId);

  const { data: availableModels } = useSWR('/api/models', (url: string) =>
    fetch(url).then((r) => r.json()),
    { dedupingInterval: 3_600_000 },
  );

  const models = availableModels ?? chatModels;
  const selected = useMemo(
    () => models.find((m: { id: string }) => m.id === optimisticModelId),
    [optimisticModelId, models],
  );

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        disabled={disabled}
        className={cn(
          'inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50',
        )}
      >
        <span className="max-w-[120px] truncate">{selected?.name ?? 'Model'}</span>
        <ChevronDown className="size-3 opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[260px]">
        {models.map((model: { id: string; name: string; description: string }) => (
          <DropdownMenuItem
            key={model.id}
            onSelect={() => {
              setOpen(false);
              startTransition(() => {
                setOptimisticModelId(model.id);
                saveChatModelAsCookie(model.id);
              });
            }}
          >
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium">{model.name}</span>
              <span className="text-xs text-muted-foreground">{model.description}</span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
