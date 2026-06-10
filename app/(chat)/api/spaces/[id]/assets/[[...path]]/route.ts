import { getEffectiveSession } from '@/lib/auth-utils';
import { resolveTenantContext } from '@/lib/tenant/context';
import {
  buildAssetHeaders,
  detectReactSpace,
  getAssetContent,
} from '@/lib/spaces/preview';
import { getPreviewFiles } from '@/lib/spaces/repository';
import { sanitizeSpacePath } from '@/lib/spaces/paths';

type Params = { params: Promise<{ id: string; path?: string[] }> };

export async function GET(_request: Request, { params }: Params) {
  const { id, path: pathSegments } = await params;
  const session = await getEffectiveSession();
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const joined = (pathSegments ?? []).join('/');
  const path = sanitizeSpacePath(joined);

  if (!path) {
    return new Response('Invalid path', { status: 400 });
  }

  try {
    const ctx = await resolveTenantContext();
    if (!ctx) {
      return new Response('Unauthorized', { status: 401 });
    }

    const files = await getPreviewFiles(id, ctx);
    const content = getAssetContent(files, path);

    if (content == null) {
      return new Response('Not found', { status: 404 });
    }

    const reactMode = detectReactSpace(files);
    return new Response(content, { headers: buildAssetHeaders(path, reactMode) });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
