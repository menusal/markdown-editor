import { create } from 'zustand'

import { buildFileNodes, buildTree, collectDirectoryPaths } from '@/lib/fs/directory'
import {
  isAbortError,
  isFileSystemAccessSupported,
  pickDirectory,
  pickFiles,
} from '@/lib/fs/picker'
import { ensureSourcePermission } from '@/lib/fs/permissions'
import {
  loadWorkspace,
  migrateLegacyRoot,
  saveWorkspace,
  type PersistedProject,
  type PersistedWorkspace,
} from '@/lib/fs/persist'
import type { LooseFileEntry, ProjectSource, TreeNode } from '@/lib/fs/types'
import { useDocumentsStore } from '@/store/documents'

export type WorkspaceStatus =
  | 'idle'
  | 'loading'
  | 'ready'
  | 'needs-permission'
  | 'error'

export type ProjectKind = 'directory' | 'files'

export const LOOSE_PROJECT_ID = 'loose-files'
export const LOOSE_PROJECT_NAME = 'Opened files'

export interface Project {
  id: string
  name: string
  kind: ProjectKind
  source: ProjectSource
  tree: TreeNode[]
  expanded: Record<string, boolean>
}

interface ActivateOptions {
  /** Prompt for missing permissions (must be called from a user gesture). */
  request?: boolean
}

export interface WorkspaceState {
  supported: boolean
  status: WorkspaceStatus
  error: string | null
  projects: Project[]
  activeProjectId: string | null

  openDirectory: () => Promise<void>
  openFiles: () => Promise<void>
  activateProject: (id: string, options?: ActivateOptions) => Promise<void>
  removeProject: (id: string) => Promise<void>
  refreshActive: () => Promise<void>
  resume: () => Promise<void>
  restore: () => Promise<void>
  toggleExpanded: (nodeId: string) => void
}

export function activeProject(state: WorkspaceState): Project | null {
  return state.projects.find((p) => p.id === state.activeProjectId) ?? null
}

async function buildTreeForSource(
  source: ProjectSource,
): Promise<TreeNode[]> {
  return source.kind === 'directory'
    ? buildTree(source.dir)
    : buildFileNodes(source.entries)
}

function mergeExpanded(tree: TreeNode[], previous: Record<string, boolean>) {
  const expanded = { ...previous }
  for (const path of collectDirectoryPaths(tree)) {
    if (!(path in expanded)) expanded[path] = true
  }
  return expanded
}

function toPersisted(
  projects: Project[],
  activeProjectId: string | null,
): PersistedWorkspace {
  return {
    activeProjectId,
    projects: projects.map((project) =>
      project.source.kind === 'directory'
        ? {
            id: project.id,
            name: project.name,
            kind: 'directory',
            dirHandle: project.source.dir,
          }
        : {
            id: project.id,
            name: project.name,
            kind: 'files',
            entries: project.source.entries,
          },
    ),
  }
}

function fromPersisted(project: PersistedProject): Project {
  if (project.kind === 'directory' && project.dirHandle) {
    return {
      id: project.id,
      name: project.name,
      kind: 'directory',
      source: { kind: 'directory', dir: project.dirHandle },
      tree: [],
      expanded: {},
    }
  }
  return {
    id: project.id,
    name: project.name,
    kind: 'files',
    source: { kind: 'files', entries: project.entries ?? [] },
    tree: [],
    expanded: {},
  }
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => {
  const persist = () =>
    saveWorkspace(toPersisted(get().projects, get().activeProjectId))

  const replaceProject = (id: string, patch: Partial<Project>) =>
    set((state) => ({
      projects: state.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    }))

  return {
    supported: isFileSystemAccessSupported(),
    status: 'idle',
    error: null,
    projects: [],
    activeProjectId: null,

    openDirectory: async () => {
      if (!get().supported) {
        set({
          status: 'error',
          error:
            'Your browser does not support the File System Access API. Use Chrome or Edge.',
        })
        return
      }

      set({ status: 'loading', error: null })
      try {
        const dir = await pickDirectory()

        let project = get().projects.find(
          (p) => p.source.kind === 'directory' && p.source.dir === dir,
        )
        if (!project) {
          for (const candidate of get().projects) {
            if (candidate.source.kind !== 'directory') continue
            if (await candidate.source.dir.isSameEntry(dir)) {
              project = candidate
              break
            }
          }
        }

        if (!project) {
          project = {
            id: crypto.randomUUID(),
            name: dir.name,
            kind: 'directory',
            source: { kind: 'directory', dir },
            tree: [],
            expanded: {},
          }
          set((state) => ({ projects: [...state.projects, project as Project] }))
        }

        await persist()
        await get().activateProject(project.id, { request: true })
      } catch (error) {
        if (isAbortError(error)) {
          set({ status: get().activeProjectId ? 'ready' : 'idle' })
          return
        }
        set({ status: 'error', error: 'Could not open the folder.' })
      }
    },

    openFiles: async () => {
      if (!get().supported) {
        set({
          status: 'error',
          error:
            'Your browser does not support the File System Access API. Use Chrome or Edge.',
        })
        return
      }

      set({ status: 'loading', error: null })
      try {
        const handles = await pickFiles()

        const loose = get().projects.find((p) => p.id === LOOSE_PROJECT_ID)
        const existing: LooseFileEntry[] =
          loose && loose.source.kind === 'files' ? [...loose.source.entries] : []

        for (const handle of handles) {
          let duplicate = false
          for (const entry of existing) {
            if (await entry.handle.isSameEntry(handle)) {
              duplicate = true
              break
            }
          }
          if (!duplicate) {
            existing.push({
              id: crypto.randomUUID(),
              name: handle.name,
              handle,
            })
          }
        }

        const project: Project = {
          id: LOOSE_PROJECT_ID,
          name: LOOSE_PROJECT_NAME,
          kind: 'files',
          source: { kind: 'files', entries: existing },
          tree: buildFileNodes(existing),
          expanded: {},
        }

        set((state) => ({
          projects: loose
            ? state.projects.map((p) =>
                p.id === LOOSE_PROJECT_ID ? project : p,
              )
            : [...state.projects, project],
        }))

        await persist()
        await get().activateProject(LOOSE_PROJECT_ID, { request: true })
      } catch (error) {
        if (isAbortError(error)) {
          set({ status: get().activeProjectId ? 'ready' : 'idle' })
          return
        }
        set({ status: 'error', error: 'Could not open the files.' })
      }
    },

    activateProject: async (id, options) => {
      const project = get().projects.find((p) => p.id === id)
      if (!project) return

      set({ activeProjectId: id, status: 'loading', error: null })

      const granted = await ensureSourcePermission(
        project.source,
        options?.request ?? false,
      )
      if (!granted) {
        set({ status: 'needs-permission' })
        useDocumentsStore.getState().setActiveProject(id)
        return
      }

      try {
        const tree = await buildTreeForSource(project.source)
        replaceProject(id, {
          tree,
          expanded: mergeExpanded(tree, project.expanded),
        })
        set({ status: 'ready' })
        await persist()
        useDocumentsStore.getState().setActiveProject(id)
      } catch {
        set({ status: 'error', error: 'Could not read the project.' })
        useDocumentsStore.getState().setActiveProject(id)
      }
    },

    removeProject: async (id) => {
      useDocumentsStore.getState().closeProject(id)
      const projects = get().projects.filter((p) => p.id !== id)
      set({ projects })

      if (get().activeProjectId !== id) {
        await persist()
        return
      }

      const next = projects[0]?.id ?? null
      if (next) {
        await persist()
        await get().activateProject(next)
      } else {
        await persist()
        set({ activeProjectId: null, status: 'idle', error: null })
        useDocumentsStore.getState().setActiveProject(null)
      }
    },

    refreshActive: async () => {
      const project = activeProject(get())
      if (!project) return

      const granted = await ensureSourcePermission(project.source, false)
      if (!granted) {
        set({ status: 'needs-permission' })
        return
      }

      set({ status: 'loading' })
      try {
        const tree = await buildTreeForSource(project.source)
        replaceProject(project.id, {
          tree,
          expanded: mergeExpanded(tree, project.expanded),
        })
        set({ status: 'ready' })
      } catch {
        set({ status: 'error', error: 'Could not refresh the project.' })
      }
    },

    resume: async () => {
      const project = activeProject(get())
      if (!project) {
        await get().openDirectory()
        return
      }

      set({ status: 'loading', error: null })
      const granted = await ensureSourcePermission(project.source, true)
      if (!granted) {
        set({
          status: 'needs-permission',
          error: 'Permission denied. Try again to access the project.',
        })
        return
      }

      try {
        const tree = await buildTreeForSource(project.source)
        replaceProject(project.id, {
          tree,
          expanded: mergeExpanded(tree, project.expanded),
        })
        set({ status: 'ready', error: null })
        useDocumentsStore.getState().setActiveProject(project.id)
      } catch {
        set({ status: 'error', error: 'Could not read the project.' })
      }
    },

    restore: async () => {
      if (!get().supported) {
        set({ status: 'idle' })
        return
      }

      let data = await loadWorkspace()
      if (!data) data = await migrateLegacyRoot()
      if (!data || data.projects.length === 0) {
        set({ status: 'idle', projects: [], activeProjectId: null })
        return
      }

      const projects = data.projects.map(fromPersisted)
      const activeId =
        data.activeProjectId && projects.some((p) => p.id === data.activeProjectId)
          ? data.activeProjectId
          : projects[0].id

      set({ projects, activeProjectId: activeId })
      await get().activateProject(activeId)
    },

    toggleExpanded: (nodeId) =>
      set((state) => ({
        projects: state.projects.map((project) =>
          project.id === state.activeProjectId
            ? {
                ...project,
                expanded: {
                  ...project.expanded,
                  [nodeId]: !project.expanded[nodeId],
                },
              }
            : project,
        ),
      })),
  }
})
