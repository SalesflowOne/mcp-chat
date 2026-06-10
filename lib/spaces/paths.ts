import { ALLOWED_SPACE_PATH, MAX_SPACE_FILE_BYTES } from '@/lib/spaces/constants';

const BLOCKED_SEGMENTS = new Set(['..', '.', '']);

export function sanitizeSpacePath(raw: string): string | null {
  const normalized = raw.trim().replace(/\\/g, '/').replace(/^\/+/, '');
  if (!normalized || normalized.length > 200) {
    return null;
  }
  if (!ALLOWED_SPACE_PATH.test(normalized)) {
    return null;
  }
  const segments = normalized.split('/');
  for (const segment of segments) {
    if (BLOCKED_SEGMENTS.has(segment)) {
      return null;
    }
  }
  if (normalized.includes('..')) {
    return null;
  }
  return normalized;
}

export function mimeTypeForPath(path: string): string {
  if (path.endsWith('.html') || path.endsWith('.htm')) return 'text/html';
  if (path.endsWith('.css')) return 'text/css';
  if (path.endsWith('.js') || path.endsWith('.mjs')) return 'text/javascript';
  if (path.endsWith('.jsx')) return 'text/javascript';
  if (path.endsWith('.ts')) return 'text/typescript';
  if (path.endsWith('.tsx')) return 'text/typescript';
  if (path.endsWith('.json')) return 'application/json';
  if (path.endsWith('.svg')) return 'image/svg+xml';
  return 'text/plain';
}

export function validateFileContent(path: string, content: string): void {
  const bytes = new TextEncoder().encode(content).length;
  if (bytes > MAX_SPACE_FILE_BYTES) {
    throw new Error(`File ${path} exceeds ${MAX_SPACE_FILE_BYTES} byte limit`);
  }
}
