import 'server-only';

import { mimeTypeForPath } from '@/lib/spaces/paths';

export type PreviewFile = {
  path: string;
  content: string;
};

const PREVIEW_CSP = [
  "default-src 'none'",
  "style-src 'unsafe-inline'",
  "script-src 'unsafe-inline'",
  "img-src data: https:",
  "font-src data:",
  "connect-src 'none'",
  "form-action 'none'",
  "frame-ancestors 'self'",
].join('; ');

export function buildPreviewHeaders(): HeadersInit {
  return {
    'Content-Type': 'text/html; charset=utf-8',
    'Content-Security-Policy': PREVIEW_CSP,
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    'Cache-Control': 'no-store',
  };
}

export function buildAssetHeaders(path: string): HeadersInit {
  return {
    'Content-Type': mimeTypeForPath(path),
    'Content-Security-Policy': PREVIEW_CSP,
    'X-Content-Type-Options': 'nosniff',
    'Cache-Control': 'no-store',
  };
}

/**
 * Assembles a static site preview with asset URLs routed through the preview API.
 */
export function assemblePreviewHtml(
  files: PreviewFile[],
  assetBaseUrl: string,
): string {
  const byPath = new Map(files.map((f) => [f.path, f.content]));
  let html = byPath.get('index.html') ?? byPath.get('index.htm');

  if (!html) {
    const firstHtml = files.find((f) => f.path.endsWith('.html') || f.path.endsWith('.htm'));
    html = firstHtml?.content;
  }

  if (!html) {
    return `<!DOCTYPE html><html><body><p>No index.html found. Add index.html to this Space.</p></body></html>`;
  }

  const baseTag = `<base href="${assetBaseUrl.replace(/\/$/, '')}/" />`;
  if (html.includes('<head>')) {
    html = html.replace('<head>', `<head>${baseTag}`);
  } else if (html.includes('<head ')) {
    html = html.replace(/<head\s[^>]*>/, (match) => `${match}${baseTag}`);
  } else {
    html = html.replace('<html>', `<html><head>${baseTag}</head>`);
  }

  return html;
}

export function getAssetContent(files: PreviewFile[], path: string): string | null {
  const file = files.find((f) => f.path === path);
  return file?.content ?? null;
}
