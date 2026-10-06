import { describe, expect, it } from 'vitest'

import {
  findNode,
  listDirectory,
  resolveFileHandle,
  updateNodeChildren,
} from '@/lib/fs/directory'
import type { TreeNode } from '@/lib/fs/types'

type FakeEntry = { name: string; kind: 'file' | 'directory' }

function dirWith(entries: FakeEntry[]) {
  return {
    values: async function* () {
      for (const entry of entries) yield entry
    },
  }
}

describe('listDirectory', () => {
  it('lists immediate children (dirs first), filters markdown and ignores junk', async () => {
    const dir = dirWith([
      { name: 'b.md', kind: 'file' },
      { name: 'zeta', kind: 'directory' },
      { name: 'alpha', kind: 'directory' },
      { name: 'readme.txt', kind: 'file' },
      { name: 'node_modules', kind: 'directory' },
    ])

    const nodes = await listDirectory(dir as unknown as FileSystemDirectoryHandle, '')

    expect(nodes.map((node) => node.id)).toEqual(['alpha', 'zeta', 'b.md'])
    // Lazy: directory children are not loaded yet.
    expect(nodes.every((node) => node.children === undefined)).toBe(true)
  })

  it('prefixes ids with the base path', async () => {
    const dir = dirWith([{ name: 'a.md', kind: 'file' }])
    const nodes = await listDirectory(dir as unknown as FileSystemDirectoryHandle, 'docs')
    expect(nodes[0].id).toBe('docs/a.md')
  })
})

describe('findNode', () => {
  const tree: TreeNode[] = [
    {
      id: 'docs',
      name: 'docs',
      kind: 'directory',
      handle: {} as FileSystemDirectoryHandle,
      children: [
        {
          id: 'docs/a.md',
          name: 'a.md',
          kind: 'file',
          handle: {} as FileSystemFileHandle,
        },
      ],
    },
  ]

  it('finds nested nodes by id', () => {
    expect(findNode(tree, 'docs/a.md')?.name).toBe('a.md')
    expect(findNode(tree, 'missing')).toBeNull()
  })
})

describe('updateNodeChildren', () => {
  const child: TreeNode = {
    id: 'x',
    name: 'x',
    kind: 'file',
    handle: {} as FileSystemFileHandle,
  }
  const tree: TreeNode[] = [
    { id: 'd', name: 'd', kind: 'directory', handle: {} as FileSystemDirectoryHandle },
  ]

  it('sets children on the matching node', () => {
    const next = updateNodeChildren(tree, 'd', [child])
    expect(next[0].children).toEqual([child])
    expect(tree[0].children).toBeUndefined()
  })

  it('preserves identity when nothing matches', () => {
    expect(updateNodeChildren(tree, 'nope', [child])).toBe(tree)
  })
})

describe('resolveFileHandle', () => {
  const fileHandle = { name: 'b.md', kind: 'file' } as unknown as FileSystemFileHandle
  const sub = {
    getDirectoryHandle: async () => {
      throw new Error('no nested dir')
    },
    getFileHandle: async (name: string) => {
      if (name === 'b.md') return fileHandle
      throw new Error('not found')
    },
  }
  const root = {
    getDirectoryHandle: async (name: string) => {
      if (name === 'a') return sub
      throw new Error('not found')
    },
  } as unknown as FileSystemDirectoryHandle

  it('resolves a nested file handle', async () => {
    expect(await resolveFileHandle(root, 'a/b.md')).toBe(fileHandle)
  })

  it('returns null for missing directories or files', async () => {
    expect(await resolveFileHandle(root, 'missing/b.md')).toBeNull()
    expect(await resolveFileHandle(root, 'a/missing.md')).toBeNull()
  })
})
