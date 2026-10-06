import { useEffect } from 'react'
import { useQueryState } from 'nuqs'

import { findNode } from '@/lib/fs/directory'
import { fileParam, projectParam } from '@/lib/url'
import { makeDocId, useDocumentsStore } from '@/store/documents'
import { useUiStore } from '@/store/ui'
import { useWorkspaceStore } from '@/store/workspace'
import type { TreeNode } from '@/lib/fs/types'

const EMPTY_TREE: TreeNode[] = []

/**
 * Keeps the `?project=` / `?file=` query params in sync with the stores:
 * - activates the project referenced by the URL (initial load / back-forward)
 * - opens the file referenced by the URL once its project is ready
 *
 * The URL is the single source of truth for *what* to open, so this hook only
 * reacts to URL changes (UI actions write to both the stores and the URL) to
 * avoid a two-way sync that oscillates.
 */
export function useDocumentRouting() {
  const [project] = useQueryState('project', projectParam)
  const [file] = useQueryState('file', fileParam)
  const status = useWorkspaceStore((s) => s.status)
  const activeProjectId = useWorkspaceStore((s) => s.activeProjectId)
  const tree = useWorkspaceStore(
    (s) => s.projects.find((p) => p.id === s.activeProjectId)?.tree ?? EMPTY_TREE,
  )
  const activateProject = useWorkspaceStore((s) => s.activateProject)
  const pushToast = useUiStore((s) => s.pushToast)

  useEffect(() => {
    if (!project || project === activeProjectId) return
    const exists = useWorkspaceStore.getState().projects.some((p) => p.id === project)
    if (exists) void activateProject(project)
  }, [project, activeProjectId, activateProject])

  useEffect(() => {
    if (status !== 'ready' || !file || !activeProjectId) return

    const { docs, activeDocId, activate, open } = useDocumentsStore.getState()
    const docId = makeDocId(activeProjectId, file)

    if (docs[docId]) {
      if (activeDocId !== docId) activate(docId)
      return
    }

    const node = findNode(tree, file)
    if (node && node.kind === 'file') {
      open(activeProjectId, node).catch(() =>
        pushToast(`Could not open "${node.name}"`, 'error'),
      )
    }
  }, [file, status, activeProjectId, tree, pushToast])
}
