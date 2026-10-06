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
