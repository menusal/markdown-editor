import { describe, expect, it } from 'vitest'

import { buildProjectIndex, collectFileHandles } from '@/lib/fs/index'
import type { ProjectSource } from '@/lib/fs/types'

type Entry = {
  name: string
  kind: 'file' | 'directory'
  values?: () => AsyncGenerator<Entry>
}

function dirWith(entries: Entry[]) {
  return {
    values: async function* () {
      for (const entry of entries) yield entry
    },
  }
}

function unreadableDir(name: string): Entry {
  return {
    name,
    kind: 'directory',
    values: () =>
      ({
        [Symbol.asyncIterator]() {
          return {
            next: () => Promise.reject(new Error('EACCES: permission denied')),
          }
        },
      }) as unknown as AsyncGenerator<Entry>,
  }
}

describe('buildProjectIndex', () => {
  it('includes root files and nested files', async () => {
    const root = dirWith([
      { name: 'a.md', kind: 'file' },
      { name: 'notes', kind: 'directory', values: dirWith([{ name: 'b.md', kind: 'file' }]).values },
    ])
    const index = await buildProjectIndex({
      kind: 'directory',
      dir: root,
    } as unknown as ProjectSource)

    expect(index.map((entry) => entry.id)).toEqual(['a.md', 'notes/b.md'])
  })

  it('does not abort the whole index when a subdirectory is unreadable', async () => {
    const root = dirWith([
      unreadableDir('private'),
      { name: 'a.md', kind: 'file' },
    ])
    const index = await buildProjectIndex({
      kind: 'directory',
      dir: root,
    } as unknown as ProjectSource)

    expect(index.map((entry) => entry.id)).toEqual(['a.md'])
  })
})

describe('collectFileHandles', () => {
  it('survives an unreadable subdirectory', async () => {
    const root = dirWith([
      unreadableDir('private'),
      { name: 'a.md', kind: 'file' },
    ])
    const files = await collectFileHandles({
      kind: 'directory',
      dir: root,
    } as unknown as ProjectSource)

    expect(files.map((file) => file.id)).toEqual(['a.md'])
  })
})
