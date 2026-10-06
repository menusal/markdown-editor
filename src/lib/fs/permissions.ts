import type { ProjectSource } from './types'
import { sourceHandles } from './types'

export type FsPermissionMode = 'read' | 'readwrite'

export async function hasPermission(
  handle: FileSystemHandle,
  mode: FsPermissionMode = 'readwrite',
): Promise<boolean> {
  return (await handle.queryPermission({ mode })) === 'granted'
}

export async function requestPermission(
  handle: FileSystemHandle,
  mode: FsPermissionMode = 'readwrite',
): Promise<boolean> {
  if (await hasPermission(handle, mode)) return true
  return (await handle.requestPermission({ mode })) === 'granted'
}

/**
 * Checks permission for every handle a source depends on. When `request` is
 * true (must be called from a user gesture) it prompts for any missing grant.
 */
export async function ensureSourcePermission(
  source: ProjectSource,
  request: boolean,
  mode: FsPermissionMode = 'readwrite',
): Promise<boolean> {
  const handles = sourceHandles(source)
  for (const handle of handles) {
    const granted = request
      ? await requestPermission(handle, mode)
      : await hasPermission(handle, mode)
    if (!granted) return false
  }
  return handles.length > 0
}
