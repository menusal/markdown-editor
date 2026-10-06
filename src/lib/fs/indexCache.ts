import { del, get, set } from 'idb-keyval'

import type { FileIndexEntry } from './index'

const key = (projectId: string) => `md-editor:index:${projectId}`

export async function saveIndex(
  projectId: string,
  entries: FileIndexEntry[],
): Promise<void> {
  await set(key(projectId), entries)
}

export async function loadIndex(
  projectId: string,
): Promise<FileIndexEntry[] | null> {
  const entries = await get<FileIndexEntry[]>(key(projectId))
  return entries ?? null
}

export async function clearIndex(projectId: string): Promise<void> {
  await del(key(projectId))
}
