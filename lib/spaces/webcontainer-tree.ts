import type { FileSystemTree } from '@webcontainer/api';

export type FlatSpaceFile = {
  path: string;
  content: string;
};

const SKIP_PREFIXES = ['node_modules/', '.git/'];

/** Convert flat Space file paths into a WebContainer FileSystemTree. */
export function buildWebContainerTree(files: FlatSpaceFile[]): FileSystemTree {
  const tree: FileSystemTree = {};

  for (const file of files) {
    if (SKIP_PREFIXES.some((p) => file.path.startsWith(p))) {
      continue;
    }

    const parts = file.path.split('/').filter(Boolean);
    if (parts.length === 0) continue;

    let current = tree;
    for (let i = 0; i < parts.length - 1; i++) {
      const dirName = parts[i]!;
      const existing = current[dirName];
      if (existing && 'directory' in existing) {
        current = existing.directory;
        continue;
      }
      const next: FileSystemTree = {};
      current[dirName] = { directory: next };
      current = next;
    }

    const fileName = parts[parts.length - 1]!;
    current[fileName] = { file: { contents: file.content } };
  }

  return tree;
}
