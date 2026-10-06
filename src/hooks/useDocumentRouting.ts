import { useEffect } from 'react'
import { useQueryState } from 'nuqs'

import { findNode } from '@/lib/fs/directory'
import { fileParam } from '@/lib/url'
import { useDocumentsStore } from '@/store/documents'
import { useUiStore } from '@/store/ui'
import { useWorkspaceStore } from '@/store/workspace'

/**
 * Opens the markdown referenced by the `?file=` query param.
 *
 * The URL is the single source of truth for *which* file should be open, so
 * this effect only reacts to changes of `file` / `tree` / `status`. It reads
 * the latest store state imperatively (instead of subscribing to `docs` and
 * `activePath`) to avoid a two-way sync that oscillated between the URL and
 * the store. Opening a file from the UI sets both the store and the URL.
 */
export function useDocumentRouting() {
  const [file] = useQueryState('file', fileParam)
  const status = useWorkspaceStore((s) => s.status)
  const tree = useWorkspaceStore((s) => s.tree)
  const pushToast = useUiStore((s) => s.pushToast)

  useEffect(() => {
    if (status !== 'ready' || !file) return

    const { docs, activePath, activate, open } = useDocumentsStore.getState()

    if (docs[file]) {
      if (activePath !== file) activate(file)
      return
    }

    const node = findNode(tree, file)
    if (node && node.kind === 'file') {
      open(node).catch(() => pushToast(`Could not open "${node.name}"`, 'error'))
    }
  }, [file, status, tree, pushToast])
}
