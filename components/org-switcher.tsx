'use client';

import useSWR from 'swr';
import { Building2, Check, ChevronsUpDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type Workspace = {
  id: string;
  name: string;
  slug: string;
  role: string;
  isActive: boolean;
};

async function fetchWorkspaces(): Promise<Workspace[]> {
  const res = await fetch('/api/workspaces');
  if (!res.ok) {
    return [];
  }
  return res.json();
}

export function OrgSwitcher() {
  const router = useRouter();
  const { data: workspaces = [], mutate } = useSWR('workspaces', fetchWorkspaces);
  const [isSwitching, setIsSwitching] = useState(false);

  const active = workspaces.find((w) => w.isActive) ?? workspaces[0];

  async function switchWorkspace(organizationId: string) {
    if (organizationId === active?.id) {
      return;
    }

    setIsSwitching(true);
    try {
      const res = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId }),
      });

      if (!res.ok) {
        throw new Error('Failed to switch workspace');
      }

      await mutate();
      router.refresh();
      toast.success('Workspace switched');
    } catch {
      toast.error('Could not switch workspace');
    } finally {
      setIsSwitching(false);
    }
  }

  if (!active) {
    return (
      <div className="flex w-full items-center gap-2 rounded-lg border bg-background px-2 py-1.5 text-sm text-muted-foreground">
        <Building2 className="size-4 shrink-0" />
        <span className="truncate">My Workspace</span>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between px-2 py-1.5 h-auto font-normal"
          disabled={isSwitching}
        >
          <span className="flex min-w-0 items-center gap-2">
            <Building2 className="size-4 shrink-0" />
            <span className="truncate">{active.name}</span>
          </span>
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[--radix-dropdown-menu-trigger-width]">
        {workspaces.map((workspace) => (
          <DropdownMenuItem
            key={workspace.id}
            className="flex items-center justify-between gap-2"
            onSelect={() => void switchWorkspace(workspace.id)}
          >
            <span className="truncate">{workspace.name}</span>
            {workspace.isActive ? <Check className="size-4 shrink-0" /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
