import type { LooseFileEntry, TreeNode } from './types'

const IGNORED_NAMES = new Set(['node_modules', '.git', 'dist', '.DS_Store'])

export function isMarkdownFile(name: string): boolean {
  const lower = name.toLowerCase()
  return lower.endsWith('.md') || lower.endsWith('.markdown')
}

/**
 * Recursively walks a directory handle and returns a tree containing only
 * markdown files. Directories with no markdown anywhere below them are pruned.
 * Node ids are POSIX-style paths relative to the root.
 */
export async function buildTree(
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
        files.push({ id, name, kind: 'file', handle: entry, children: [] })
      }
    } else {
      const children = await buildTree(entry, id)
      if (children.length > 0) {
        directories.push({ id, name, kind: 'directory', handle: entry, children })
      }
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
    children: [],
  }))
}

export function findNode(nodes: TreeNode[], id: string): TreeNode | null {
  for (const node of nodes) {
    if (node.id === id) return node
    if (node.kind === 'directory') {
      const found = findNode(node.children, id)
      if (found) return found
    }
  }
  return null
}

/** Returns every directory path in the tree (used to expand folders by default). */
export function collectDirectoryPaths(nodes: TreeNode[]): string[] {
  const paths: string[] = []
  for (const node of nodes) {
    if (node.kind === 'directory') {
      paths.push(node.id)
      paths.push(...collectDirectoryPaths(node.children))
    }
  }
  return paths
}
