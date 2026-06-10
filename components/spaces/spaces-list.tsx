'use client';

import Link from 'next/link';
import useSWR from 'swr';
import { formatDistanceToNow } from 'date-fns';
import { LayoutTemplate, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { fetcher } from '@/lib/utils';

type SpacesResponse = {
  spaces: Array<{
    id: string;
    title: string;
    slug: string;
    status: string;
    updated_at: string;
  }>;
};

export function SpacesList() {
  const { data, isLoading } = useSWR<SpacesResponse>('/api/spaces', fetcher);

  const createSpace = async () => {
    const res = await fetch('/api/spaces', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'New Space' }),
    });
    if (!res.ok) return;
    const { space } = await res.json();
    window.location.href = `/spaces/${space.id}`;
  };

  if (isLoading) {
    return <div className="p-8 text-muted-foreground">Loading spaces…</div>;
  }

  const spaces = data?.spaces ?? [];

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Spaces</h1>
          <p className="mt-1 text-muted-foreground">
            AI-generated sites and apps — versioned, previewable, shareable.
          </p>
        </div>
        <Button type="button" onClick={createSpace}>
          <Plus className="mr-1.5 size-4" />
          New Space
        </Button>
      </div>

      {spaces.length === 0 ? (
        <div className="rounded-xl border border-dashed p-16 text-center">
          <LayoutTemplate className="mx-auto mb-4 size-10 text-muted-foreground" />
          <p className="mb-4 text-muted-foreground">
            No spaces yet. Ask the agent to build a landing page, or create one manually.
          </p>
          <Button type="button" onClick={createSpace}>
            Create your first Space
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {spaces.map((space) => (
            <Link
              key={space.id}
              href={`/spaces/${space.id}`}
              className="group rounded-xl border bg-card p-4 transition-all hover:border-indigo-300 hover:shadow-sm dark:hover:border-indigo-800"
            >
              <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                <LayoutTemplate className="size-5" />
              </div>
              <p className="font-medium group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                {space.title}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {space.status} · updated{' '}
                {formatDistanceToNow(new Date(space.updated_at), { addSuffix: true })}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
