import { create } from 'zustand'

import { buildTree, collectDirectoryPaths } from '@/lib/fs/directory'
import { isAbortError, isFileSystemAccessSupported, pickDirectory } from '@/lib/fs/picker'
import { requestPermission } from '@/lib/fs/permissions'
import { clearRootHandle, loadRootHandle, saveRootHandle } from '@/lib/fs/persist'
import type { TreeNode } from '@/lib/fs/types'

export type WorkspaceStatus =
  | 'idle'
  | 'loading'
  | 'ready'
  | 'needs-permission'
  | 'error'

interface WorkspaceState {
  supported: boolean
  status: WorkspaceStatus
  error: string | null
  rootHandle: FileSystemDirectoryHandle | null
  rootName: string | null
  tree: TreeNode[]
  expanded: Record<string, boolean>

  openDirectory: () => Promise<void>
  restore: () => Promise<void>
  resume: () => Promise<void>
  refresh: () => Promise<void>
  close: () => Promise<void>
  toggleExpanded: (path: string) => void
}

async function loadTree(
  handle: FileSystemDirectoryHandle,
): Promise<{ tree: TreeNode[]; expanded: Record<string, boolean> }> {
  const tree = await buildTree(handle)
  const expanded: Record<string, boolean> = {}
  for (const path of collectDirectoryPaths(tree)) expanded[path] = true
  return { tree, expanded }
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  supported: isFileSystemAccessSupported(),
  status: 'idle',
  error: null,
  rootHandle: null,
  rootName: null,
  tree: [],
  expanded: {},

  openDirectory: async () => {
    if (!get().supported) {
      set({
        status: 'error',
        error: 'Your browser does not support the File System Access API. Use Chrome or Edge.',
      })
      return
    }

    set({ status: 'loading', error: null })
    try {
      const handle = await pickDirectory()
      await saveRootHandle(handle)
      const { tree, expanded } = await loadTree(handle)
      set({
        status: 'ready',
        rootHandle: handle,
        rootName: handle.name,
        tree,
        expanded,
      })
    } catch (error) {
      if (isAbortError(error)) {
        set({ status: get().rootHandle ? 'ready' : 'idle' })
        return
      }
      set({ status: 'error', error: 'Could not open the folder.' })
    }
  },

  restore: async () => {
    if (!get().supported) {
      set({ status: 'idle' })
      return
    }
    const handle = await loadRootHandle()
    if (!handle) {
      set({ status: 'idle' })
      return
    }

    set({ rootHandle: handle, rootName: handle.name })

    const permission = await handle.queryPermission({ mode: 'readwrite' })
    if (permission !== 'granted') {
      set({ status: 'needs-permission' })
      return
    }

    set({ status: 'loading' })
    try {
      const { tree, expanded } = await loadTree(handle)
      set({ status: 'ready', tree, expanded })
    } catch {
      set({ status: 'needs-permission' })
    }
  },

  resume: async () => {
    const handle = get().rootHandle
    if (!handle) {
      await get().openDirectory()
      return
    }

    set({ status: 'loading', error: null })
    const granted = await requestPermission(handle, 'readwrite')
    if (!granted) {
      set({
        status: 'needs-permission',
        error: 'Permission denied. Try again to access the folder.',
      })
      return
    }

    try {
      const { tree, expanded } = await loadTree(handle)
      set({ status: 'ready', tree, expanded, error: null })
    } catch {
      set({ status: 'error', error: 'Could not read the folder.' })
    }
  },

  refresh: async () => {
    const handle = get().rootHandle
    if (!handle) return
    const granted = await requestPermission(handle, 'readwrite')
    if (!granted) {
      set({ status: 'needs-permission' })
      return
    }
    set({ status: 'loading' })
    try {
      const { tree } = await loadTree(handle)
      const expanded = get().expanded
      const nextExpanded = { ...expanded }
      for (const path of collectDirectoryPaths(tree)) {
        if (!(path in nextExpanded)) nextExpanded[path] = true
      }
      set({ status: 'ready', tree, expanded: nextExpanded })
    } catch {
      set({ status: 'error', error: 'Could not refresh the folder.' })
    }
  },

  close: async () => {
    await clearRootHandle()
    set({
      status: 'idle',
      rootHandle: null,
      rootName: null,
      tree: [],
      expanded: {},
      error: null,
    })
  },

  toggleExpanded: (path) =>
    set((state) => ({
      expanded: { ...state.expanded, [path]: !state.expanded[path] },
    })),
}))
