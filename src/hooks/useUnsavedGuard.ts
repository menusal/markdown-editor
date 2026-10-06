import { useEffect } from 'react'

import { hasUnsavedChanges, useDocumentsStore } from '@/store/documents'

export function useUnsavedGuard() {
  const docs = useDocumentsStore((s) => s.docs)

  useEffect(() => {
    const dirty = hasUnsavedChanges(docs)
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirty) return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [docs])
}
