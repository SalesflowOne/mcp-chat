import { getEffectiveSession } from '@/lib/auth-utils';
import { resolveTenantContext } from '@/lib/tenant/context';
import {
  assemblePreviewHtml,
  buildPreviewHeaders,
  detectReactSpace,
} from '@/lib/spaces/preview';
import { getPreviewFiles } from '@/lib/spaces/repository';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  const { id } = await params;
  const session = await getEffectiveSession();
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const ctx = await resolveTenantContext();
    if (!ctx) {
      return new Response('Unauthorized', { status: 401 });
    }

    const files = await getPreviewFiles(id, ctx);
    const url = new URL(request.url);
    const assetBase = `${url.origin}/api/spaces/${id}/assets/`;
    const reactMode = detectReactSpace(files);
    const html = assemblePreviewHtml(files, assetBase);

    return new Response(html, { headers: buildPreviewHeaders(reactMode) });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
