import { useCallback } from 'react'
import { useQueryState } from 'nuqs'

import { fileParam, projectParam } from '@/lib/url'
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
    void setFile(null)
    await openDirectory()
    const id = useWorkspaceStore.getState().activeProjectId
    void setProject(id ?? null)
  }, [openDirectory, setProject, setFile])

  const openLooseFiles = useCallback(async () => {
    void setFile(null)
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

  const selectFile = useCallback(
    (projectId: string, nodeId: string) => {
      void setProject(projectId)
      void setFile(nodeId)
    },
    [setProject, setFile],
  )

  return { openFolder, openLooseFiles, selectProject, remove, selectFile }
}
