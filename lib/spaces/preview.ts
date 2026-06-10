import 'server-only';

import { mimeTypeForPath } from '@/lib/spaces/paths';

export type PreviewFile = {
  path: string;
  content: string;
};

function buildPreviewCsp(reactMode: boolean): string {
  const scriptSrc = reactMode
    ? "script-src 'unsafe-inline' https://esm.sh https://cdn.jsdelivr.net"
    : "script-src 'unsafe-inline'";
  return [
    "default-src 'none'",
    "style-src 'unsafe-inline'",
    scriptSrc,
    "img-src data: https:",
    "font-src data: https:",
    reactMode ? "connect-src https://esm.sh" : "connect-src 'none'",
    "form-action 'none'",
    "frame-ancestors 'self'",
  ].join('; ');
}

export function buildPreviewHeaders(reactMode = false): HeadersInit {
  return {
    'Content-Type': 'text/html; charset=utf-8',
    'Content-Security-Policy': buildPreviewCsp(reactMode),
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    'Cache-Control': 'no-store',
  };
}

export function buildAssetHeaders(path: string, reactMode = false): HeadersInit {
  return {
    'Content-Type': mimeTypeForPath(path),
    'Content-Security-Policy': buildPreviewCsp(reactMode),
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

  const reactMode = detectReactSpace(files);
  if (reactMode) {
    html = wrapReactPreviewHtml(html, files);
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

export function detectReactSpace(files: PreviewFile[]): boolean {
  const combined = files.map((f) => f.content).join('\n');
  return (
    /\bfrom\s+['"]react['"]/.test(combined) ||
    /\bimport\s+React\b/.test(combined) ||
    /type\s*=\s*["']module["']/.test(combined) ||
    files.some((f) => f.path.endsWith('.tsx') || f.path.endsWith('.jsx'))
  );
}

/**
 * Wraps a module-style React entry in an esm.sh import map shell for iframe preview.
 */
export function wrapReactPreviewHtml(html: string, files: PreviewFile[]): string {
  const moduleFile =
    files.find((f) => f.path === 'main.jsx' || f.path === 'main.tsx') ??
    files.find((f) => f.path.endsWith('.jsx') || f.path.endsWith('.tsx'));

  if (!moduleFile) {
    return html;
  }

  const moduleSrc = `/assets/${moduleFile.path}`;
  const shell = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <script type="importmap">
  {
    "imports": {
      "react": "https://esm.sh/react@19",
      "react-dom/client": "https://esm.sh/react-dom@19/client"
    }
  }
  </script>
  <style>body { margin: 0; font-family: system-ui, sans-serif; }</style>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="${moduleSrc}"></script>
</body>
</html>`;
  return shell;
}

export function getAssetContent(files: PreviewFile[], path: string): string | null {
  const file = files.find((f) => f.path === path);
  return file?.content ?? null;
}
