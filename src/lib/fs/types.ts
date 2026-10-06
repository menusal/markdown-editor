export type TreeNodeKind = 'file' | 'directory'

export interface TreeNode {
  /** Stable id within a project: relative path (folders) or a generated id. */
  id: string
  /** Display name (last path segment). */
  name: string
  kind: TreeNodeKind
  handle: FileSystemFileHandle | FileSystemDirectoryHandle
  children: TreeNode[]
}

/** A loose (folder-less) markdown file tracked by a project. */
export interface LooseFileEntry {
  id: string
  name: string
  handle: FileSystemFileHandle
}

/** Where a project's files come from. */
export type ProjectSource =
  | { kind: 'directory'; dir: FileSystemDirectoryHandle }
  | { kind: 'files'; entries: LooseFileEntry[] }

/** All filesystem handles a source depends on (for permission checks). */
export function sourceHandles(source: ProjectSource): FileSystemHandle[] {
  return source.kind === 'directory'
    ? [source.dir]
    : source.entries.map((entry) => entry.handle)
}

