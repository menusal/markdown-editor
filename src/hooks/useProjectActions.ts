import { useCallback } from 'react'
import { useQueryState } from 'nuqs'

import { findNode, resolveFileHandle } from '@/lib/fs/directory'
import { fileParam, projectParam } from '@/lib/url'
import { isDirty, useDocumentsStore } from '@/store/documents'
import { useUiStore } from '@/store/ui'
import { useWorkspaceStore } from '@/store/workspace'

/**
 * Project-level actions that keep the `?project=` / `?file=` URL params in sync
 * with the workspace store.
 */
export function useProjectActions() {
  const openDirectory = useWorkspaceStore((s) => s.openDirectory)
  const openFiles = useWorkspaceStore((s) => s.openFiles)
  const activateProject = useWorkspaceStore((s) => s.activateProject)
  const removeProject = useWorkspaceStore((s) => s.removeProject)
  const [, setProject] = useQueryState('project', projectParam)
  const [, setFile] = useQueryState('file', fileParam)

  const openFolder = useCallback(async () => {
    // Clear the URL params first: while the picker is open the old `?project`
    // would otherwise make the routing effect re-activate the previous project.
    void setFile(null)
    void setProject(null)
    await openDirectory()
    const id = useWorkspaceStore.getState().activeProjectId
    void setProject(id ?? null)
  }, [openDirectory, setProject, setFile])

  const openLooseFiles = useCallback(async () => {
    void setFile(null)
    void setProject(null)
    await openFiles()
    const id = useWorkspaceStore.getState().activeProjectId
    void setProject(id ?? null)
  }, [openFiles, setProject, setFile])

  const selectProject = useCallback(
    (id: string) => {
      void setProject(id)
      void setFile(null)
      void activateProject(id, { request: true })
    },
    [activateProject, setProject, setFile],
  )

  const remove = useCallback(
    async (id: string) => {
      await removeProject(id)
      const next = useWorkspaceStore.getState().activeProjectId
      void setProject(next)
      void setFile(null)
    },
    [removeProject, setProject, setFile],
  )

  const docs = useDocumentsStore((s) => s.docs)
  const confirm = useUiStore((s) => s.confirm)

  /** Removes a project, asking for confirmation when it has unsaved changes. */
  const requestRemove = useCallback(
    async (id: string, name: string) => {
      const dirty = Object.values(docs).some(
        (doc) => doc.projectId === id && isDirty(doc),
      )
      if (dirty) {
        const confirmed = await confirm({
          title: `Remove "${name}"?`,
          description:
            'This project has unsaved changes. Removing it will discard them.',
          confirmLabel: 'Remove project',
          cancelLabel: 'Cancel',
          danger: true,
        })
        if (!confirmed) return
      }
      await remove(id)
    },
    [docs, confirm, remove],
  )

  const selectFile = useCallback(
    (projectId: string, nodeId: string) => {
      void setProject(projectId)
      void setFile(nodeId)
    },
    [setProject, setFile],
  )

  /**
   * Opens a file by its project-relative path, resolving the handle lazily when
   * the node is not in the loaded tree (lazy tree / deep-links / search).
   */
  const openPath = useCallback(
    async (projectId: string, path: string) => {
      const project = useWorkspaceStore
        .getState()
        .projects.find((p) => p.id === projectId)
      if (!project) return

      let node = findNode(project.tree, path)
      if (!node) {
        if (project.source.kind === 'directory') {
          const handle = await resolveFileHandle(project.source.dir, path)
          if (!handle) return
          node = {
            id: path,
            name: path.split('/').pop() ?? path,
            kind: 'file',
            handle,
          }
        } else {
          const entry = project.source.entries.find((e) => e.id === path)
          if (!entry) return
          node = { id: entry.id, name: entry.name, kind: 'file', handle: entry.handle }
        }
      }

      await useDocumentsStore.getState().open(projectId, node)
      void setProject(projectId)
      void setFile(node.id)
    },
    [setProject, setFile],
  )

  return {
    openFolder,
    openLooseFiles,
    selectProject,
    remove,
    requestRemove,
    selectFile,
    openPath,
  }
}
