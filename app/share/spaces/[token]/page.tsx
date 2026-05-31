import { Suspense } from 'react';

import { SpacePublicPreview } from '@/components/spaces/space-public-preview';

export default function PublicSpacePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  return (
    <Suspense fallback={<div className="h-dvh w-full bg-muted animate-pulse" />}>
      <PublicSpacePageInner params={params} />
    </Suspense>
  );
}

async function PublicSpacePageInner({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <SpacePublicPreview token={token} />;
}
