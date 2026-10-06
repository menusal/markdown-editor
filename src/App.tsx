import { useEffect } from 'react'

import { useDocumentRouting } from '@/hooks/useDocumentRouting'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useUnsavedGuard } from '@/hooks/useUnsavedGuard'
import { AppShell } from '@/components/layout/AppShell'
import { useWorkspaceStore } from '@/store/workspace'

export default function App() {
  const restore = useWorkspaceStore((s) => s.restore)

  useEffect(() => {
    void restore()
  }, [restore])

  useDocumentRouting()
  useKeyboardShortcuts()
  useUnsavedGuard()

  return <AppShell />
}
