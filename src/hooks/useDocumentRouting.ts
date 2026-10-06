import { useEffect } from 'react'
import { useQueryState } from 'nuqs'

import { fileParam, projectParam } from '@/lib/url'
import { useProjectActions } from '@/hooks/useProjectActions'
import { makeDocId, useDocumentsStore } from '@/store/documents'
import { useUiStore } from '@/store/ui'
import { useWorkspaceStore } from '@/store/workspace'

/**
 * Keeps the `?project=` / `?file=` query params in sync with the stores:
 * - activates the project referenced by the URL (initial load / back-forward)
 * - opens the file referenced by the URL once its project is ready
 *
 * The URL is the single source of truth for *what* to open, so this hook only
 * reacts to URL changes. Opening a file resolves its handle lazily (the tree is
 * only partially loaded), so no tree dependency is needed.
 */
export function useDocumentRouting() {
  const [project] = useQueryState('project', projectParam)
  const [file] = useQueryState('file', fileParam)
  const status = useWorkspaceStore((s) => s.status)
  const activeProjectId = useWorkspaceStore((s) => s.activeProjectId)
  const activateProject = useWorkspaceStore((s) => s.activateProject)
  const pushToast = useUiStore((s) => s.pushToast)
  const { openPath } = useProjectActions()

  useEffect(() => {
    if (status === 'loading') return
    if (!project || project === activeProjectId) return
    const exists = useWorkspaceStore.getState().projects.some((p) => p.id === project)
    if (exists) void activateProject(project)
  }, [project, activeProjectId, status, activateProject])

  useEffect(() => {
    if (status !== 'ready' || !file || !activeProjectId) return

    const { docs, activeDocId, activate } = useDocumentsStore.getState()
    const docId = makeDocId(activeProjectId, file)

    if (docs[docId]) {
      if (activeDocId !== docId) activate(docId)
      return
    }

    openPath(activeProjectId, file).catch(() =>
      pushToast(`Could not open "${file}"`, 'error'),
    )
  }, [file, status, activeProjectId, openPath, pushToast])
}
