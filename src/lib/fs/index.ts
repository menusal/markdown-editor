import { IGNORED_NAMES, isMarkdownFile } from './directory'
import type { ProjectSource } from './types'

export interface FileIndexEntry {
  id: string
  name: string
  /** Display title (filename by default; refined from the first heading). */
  title: string
}

export function titleFromName(name: string): string {
  return name.replace(/\.(md|markdown)$/i, '')
}

export interface FileHandleEntry {
  id: string
  name: string
  handle: FileSystemFileHandle
}

/**
 * Collects the file handles of every markdown file in a project (walking
 * directories). Used by on-demand full-text search.
 */
export async function collectFileHandles(
  source: ProjectSource,
): Promise<FileHandleEntry[]> {
  if (source.kind === 'files') {
    return source.entries.map((entry) => ({
      id: entry.id,
      name: entry.name,
      handle: entry.handle,
    }))
  }

  const entries: FileHandleEntry[] = []
  async function walk(dir: FileSystemDirectoryHandle, base: string) {
    for await (const entry of dir.values()) {
      if (IGNORED_NAMES.has(entry.name)) continue
      const id = base ? `${base}/${entry.name}` : entry.name
      if (entry.kind === 'file') {
        if (isMarkdownFile(entry.name)) {
          entries.push({ id, name: entry.name, handle: entry })
        }
      } else {
        await walk(entry, id)
      }
    }
  }
  await walk(source.dir, '')
  return entries
}

/**
 * Builds a flat index of every markdown file in a project, by walking its
 * directories (names only, no file reads). Used for search and counting.
 */
export async function buildProjectIndex(
  source: ProjectSource,
): Promise<FileIndexEntry[]> {
  if (source.kind === 'files') {
    return source.entries.map((entry) => ({
      id: entry.id,
      name: entry.name,
      title: titleFromName(entry.name),
    }))
  }

  const entries: FileIndexEntry[] = []

  async function walk(dir: FileSystemDirectoryHandle, base: string) {
    for await (const entry of dir.values()) {
      if (IGNORED_NAMES.has(entry.name)) continue
      const id = base ? `${base}/${entry.name}` : entry.name
      if (entry.kind === 'file') {
        if (isMarkdownFile(entry.name)) {
          entries.push({ id, name: entry.name, title: titleFromName(entry.name) })
        }
      } else {
        await walk(entry, id)
      }
    }
  }

  await walk(source.dir, '')
  entries.sort((a, b) => a.id.localeCompare(b.id))
  return entries
}
