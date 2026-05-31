import {
  buildAssetHeaders,
  getAssetContent,
} from '@/lib/spaces/preview';
import {
  getPublicPreviewFiles,
  getSpaceByShareToken,
} from '@/lib/spaces/repository';
import { sanitizeSpacePath } from '@/lib/spaces/paths';

type Params = { params: Promise<{ token: string; path?: string[] }> };

export async function GET(_request: Request, { params }: Params) {
  const { token, path: pathSegments } = await params;
  const resolved = await getSpaceByShareToken(token);

  if (!resolved) {
    return new Response('Not found', { status: 404 });
  }

  const joined = (pathSegments ?? []).join('/');
  const path = sanitizeSpacePath(joined);

  if (!path) {
    return new Response('Invalid path', { status: 400 });
  }

  const files = await getPublicPreviewFiles(resolved.space.id);
  const content = getAssetContent(files, path);

  if (content == null) {
    return new Response('Not found', { status: 404 });
  }

  return new Response(content, { headers: buildAssetHeaders(path) });
}
