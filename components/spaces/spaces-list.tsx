'use client';

import Link from 'next/link';
import useSWR from 'swr';
import { formatDistanceToNow } from 'date-fns';

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
  const { data, isLoading, mutate } = useSWR<SpacesResponse>('/api/spaces', fetcher);

  const createSpace = async () => {
    const res = await fetch('/api/spaces', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'New Space' }),
    });
    if (!res.ok) {
      return;
    }
    const { space } = await res.json();
    window.location.href = `/spaces/${space.id}`;
  };

  if (isLoading) {
    return <div className="p-8 text-muted-foreground">Loading spaces…</div>;
  }

  const spaces = data?.spaces ?? [];

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Spaces</h1>
          <p className="text-sm text-muted-foreground">
            AI-generated sites, landing pages, and simple apps
          </p>
        </div>
        <Button type="button" onClick={createSpace}>
          New Space
        </Button>
      </div>

      {spaces.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="mb-4 text-muted-foreground">No spaces yet.</p>
          <Button type="button" onClick={createSpace}>
            Create your first Space
          </Button>
        </div>
      ) : (
        <ul className="divide-y rounded-lg border">
          {spaces.map((space) => (
            <li key={space.id}>
              <Link
                href={`/spaces/${space.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-muted/50"
              >
                <div>
                  <p className="font-medium">{space.title}</p>
                  <p className="text-xs text-muted-foreground">{space.slug}</p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(space.updated_at), {
                    addSuffix: true,
                  })}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Button
        type="button"
        variant="ghost"
        className="mt-4"
        onClick={() => mutate()}
      >
        Refresh
      </Button>
    </div>
  );
}
