import { del, get, set } from 'idb-keyval'

export const ROOT_HANDLE_KEY = 'md-editor:root'

export async function saveRootHandle(
  handle: FileSystemDirectoryHandle,
): Promise<void> {
  await set(ROOT_HANDLE_KEY, handle)
}

export async function loadRootHandle(): Promise<FileSystemDirectoryHandle | null> {
  const handle = await get<FileSystemDirectoryHandle>(ROOT_HANDLE_KEY)
  return handle ?? null
}

export async function clearRootHandle(): Promise<void> {
  await del(ROOT_HANDLE_KEY)
}
