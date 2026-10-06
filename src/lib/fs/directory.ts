import type { LooseFileEntry, TreeNode } from './types'

export const IGNORED_NAMES = new Set([
  'node_modules',
  '.git',
  'dist',
  '.DS_Store',
])

export function isMarkdownFile(name: string): boolean {
  const lower = name.toLowerCase()
  return lower.endsWith('.md') || lower.endsWith('.markdown')
}

/**
 * Lists the *immediate* children of a directory — no recursion. Directories are
 * returned with `children: undefined` so they can be expanded lazily later.
 */
export async function listDirectory(
  dir: FileSystemDirectoryHandle,
  base = '',
): Promise<TreeNode[]> {
  const directories: TreeNode[] = []
  const files: TreeNode[] = []

  for await (const entry of dir.values()) {
    const name = entry.name
    if (IGNORED_NAMES.has(name)) continue

    const id = base ? `${base}/${name}` : name

    if (entry.kind === 'file') {
      if (isMarkdownFile(name)) {
        files.push({ id, name, kind: 'file', handle: entry })
      }
    } else {
      directories.push({ id, name, kind: 'directory', handle: entry })
    }
  }

  directories.sort((a, b) => a.name.localeCompare(b.name))
  files.sort((a, b) => a.name.localeCompare(b.name))

  return [...directories, ...files]
}

/** Builds a flat node list for a project made of loose (folder-less) files. */
export function buildFileNodes(entries: LooseFileEntry[]): TreeNode[] {
  return entries.map((entry) => ({
    id: entry.id,
    name: entry.name,
    kind: 'file',
    handle: entry.handle,
  }))
}

export function findNode(nodes: TreeNode[], id: string): TreeNode | null {
  for (const node of nodes) {
    if (node.id === id) return node
    if (node.children) {
      const found = findNode(node.children, id)
      if (found) return found
    }
  }
  return null
}

/** Immutably replaces the children of a node, preserving identity when unchanged. */
export function updateNodeChildren(
  nodes: TreeNode[],
  id: string,
  children: TreeNode[],
): TreeNode[] {
  let changed = false
  const next = nodes.map((node) => {
    if (node.id === id) {
      changed = true
      return { ...node, children }
    }
    if (node.children) {
      const updated = updateNodeChildren(node.children, id, children)
      if (updated !== node.children) {
        changed = true
        return { ...node, children: updated }
      }
    }
    return node
  })
  return changed ? next : nodes
}

/** Resolves a file handle from a POSIX path relative to a root directory. */
export async function resolveFileHandle(
  root: FileSystemDirectoryHandle,
  path: string,
): Promise<FileSystemFileHandle | null> {
  const segments = path.split('/').filter(Boolean)
  if (segments.length === 0) return null

  let dir = root
  for (let i = 0; i < segments.length - 1; i += 1) {
    try {
      dir = await dir.getDirectoryHandle(segments[i])
    } catch {
      return null
    }
  }

  try {
    return await dir.getFileHandle(segments[segments.length - 1])
  } catch {
    return null
  }
}
