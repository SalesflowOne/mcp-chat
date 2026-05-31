'use client';

export function SpacePublicPreview({ token }: { token: string }) {
  const src = `/api/public/spaces/${token}/preview`;

  return (
    <div className="h-dvh w-full bg-muted/20 p-2">
      <iframe
        title="Shared space preview"
        src={src}
        className="h-full w-full rounded-md border bg-white"
        sandbox="allow-scripts"
        referrerPolicy="no-referrer"
      />
    </div>
  );
}
