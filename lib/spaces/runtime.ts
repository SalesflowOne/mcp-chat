import type { PreviewFile } from '@/lib/spaces/preview';

export type SpaceRuntime = 'static_html' | 'vite_webcontainer';

export const SPACE_PREVIEW_KINDS = {
  static: 'static_html',
  vite: 'vite_webcontainer',
} as const;

/** Detect whether a Space should run in WebContainer + Vite vs static preview. */
export function detectSpaceRuntime(
  files: Array<{ path: string; content: string }>,
): SpaceRuntime {
  const pkg = files.find((f) => f.path === 'package.json');
  if (pkg) {
    try {
      const parsed = JSON.parse(pkg.content) as {
        scripts?: Record<string, string>;
        devDependencies?: Record<string, string>;
        dependencies?: Record<string, string>;
      };
      const scripts = parsed.scripts ?? {};
      const deps = {
        ...parsed.dependencies,
        ...parsed.devDependencies,
      };
      if (
        scripts.dev?.includes('vite') ||
        scripts.build?.includes('vite') ||
        deps.vite ||
        files.some((f) => /^vite\.config\.(ts|js|mjs)$/.test(f.path))
      ) {
        return SPACE_PREVIEW_KINDS.vite;
      }
    } catch {
      // fall through
    }
  }

  const hasReactSource = files.some(
    (f) =>
      f.path.endsWith('.tsx') ||
      f.path.endsWith('.jsx') ||
      (f.path.startsWith('src/') &&
        (f.path.endsWith('.ts') || f.path.endsWith('.js'))),
  );

  if (hasReactSource && files.some((f) => f.path === 'index.html')) {
    return SPACE_PREVIEW_KINDS.vite;
  }

  return SPACE_PREVIEW_KINDS.static;
}

export function isViteRuntime(runtime: string): boolean {
  return runtime === SPACE_PREVIEW_KINDS.vite;
}

export function previewFilesFromRows(
  files: Array<{ path: string; content: string | null }>,
): PreviewFile[] {
  return files
    .filter((f) => f.content != null && !f.path.startsWith('node_modules/'))
    .map((f) => ({ path: f.path, content: f.content! }));
}
