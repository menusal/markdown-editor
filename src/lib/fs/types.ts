export type TreeNodeKind = 'file' | 'directory'

export interface TreeNode {
  /** POSIX-style path relative to the workspace root (e.g. `plans/roadmap.md`). */
  path: string
  /** Display name (last path segment). */
  name: string
  kind: TreeNodeKind
  handle: FileSystemFileHandle | FileSystemDirectoryHandle
  children: TreeNode[]
}
