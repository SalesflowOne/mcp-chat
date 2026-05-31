import {
  assemblePreviewHtml,
  buildPreviewHeaders,
} from '@/lib/spaces/preview';
import {
  getPublicPreviewFiles,
  getSpaceByShareToken,
} from '@/lib/spaces/repository';

type Params = { params: Promise<{ token: string }> };

export async function GET(request: Request, { params }: Params) {
  const { token } = await params;
  const resolved = await getSpaceByShareToken(token);

  if (!resolved) {
    return new Response('Not found or expired', { status: 404 });
  }

  const files = await getPublicPreviewFiles(resolved.space.id);
  const url = new URL(request.url);
  const assetBase = `${url.origin}/api/public/spaces/${token}/assets/`;
  const html = assemblePreviewHtml(files, assetBase);

  return new Response(html, {
    headers: {
      ...Object.fromEntries(new Headers(buildPreviewHeaders())),
      'X-Frame-Options': 'SAMEORIGIN',
    },
  });
}
