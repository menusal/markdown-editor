import { useCallback } from 'react'

import { useDocumentsStore } from '@/store/documents'
import { useUiStore } from '@/store/ui'

export function useSaveActive() {
  const save = useDocumentsStore((s) => s.save)
  const pushToast = useUiStore((s) => s.pushToast)

  return useCallback(async () => {
    const { activePath, docs } = useDocumentsStore.getState()
    if (!activePath) return
    const doc = docs[activePath]
    if (!doc || doc.content === doc.savedContent) return

    try {
      await save(activePath)
      pushToast(`Saved "${doc.name}"`, 'success')
    } catch {
      pushToast('Could not save the file', 'error')
    }
  }, [save, pushToast])
}
