import { del, get, set } from 'idb-keyval'

import type { LooseFileEntry } from './types'

const WORKSPACE_KEY = 'md-editor:workspace'
const LEGACY_ROOT_KEY = 'md-editor:root'

export interface PersistedProject {
  id: string
  name: string
  kind: 'directory' | 'files'
  dirHandle?: FileSystemDirectoryHandle
  entries?: LooseFileEntry[]
}

export interface PersistedWorkspace {
  projects: PersistedProject[]
  activeProjectId: string | null
}

export async function saveWorkspace(data: PersistedWorkspace): Promise<void> {
  await set(WORKSPACE_KEY, data)
}

export async function loadWorkspace(): Promise<PersistedWorkspace | null> {
  const data = await get<PersistedWorkspace>(WORKSPACE_KEY)
  return data ?? null
}

export async function clearWorkspace(): Promise<void> {
  await del(WORKSPACE_KEY)
}

/**
 * Migrates the pre-multi-project single-root handle (if any) into the new
 * workspace shape. Returns the workspace, or null when there is nothing to
 * migrate.
 */
export async function migrateLegacyRoot(): Promise<PersistedWorkspace | null> {
  const handle = await get<FileSystemDirectoryHandle>(LEGACY_ROOT_KEY)
  if (!handle) return null

  const project: PersistedProject = {
    id: crypto.randomUUID(),
    name: handle.name,
    kind: 'directory',
    dirHandle: handle,
  }
  const workspace: PersistedWorkspace = {
    projects: [project],
    activeProjectId: project.id,
  }
  await saveWorkspace(workspace)
  await del(LEGACY_ROOT_KEY)
  return workspace
}
