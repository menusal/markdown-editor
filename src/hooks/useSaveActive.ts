import { useCallback } from 'react'

import { useDocumentsStore } from '@/store/documents'
import { useUiStore } from '@/store/ui'

export function useSaveActive() {
  const save = useDocumentsStore((s) => s.save)
  const pushToast = useUiStore((s) => s.pushToast)

  return useCallback(async () => {
    const { activeDocId, docs } = useDocumentsStore.getState()
    if (!activeDocId) return
    const doc = docs[activeDocId]
    if (!doc || doc.content === doc.savedContent) return

    try {
      await save(activeDocId)
      pushToast(`Saved "${doc.name}"`, 'success')
    } catch {
      pushToast('Could not save the file', 'error')
    }
  }, [save, pushToast])
}
