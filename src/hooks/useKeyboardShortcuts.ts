import { useEffect } from 'react'
import { useQueryState } from 'nuqs'

import { sidebarParam } from '@/lib/url'
import { useProjectActions } from '@/hooks/useProjectActions'
import { useSaveActive } from '@/hooks/useSaveActive'

export function useKeyboardShortcuts() {
  const saveActive = useSaveActive()
  const { openFolder, openLooseFiles } = useProjectActions()
  const [, setSidebarOpen] = useQueryState('sidebar', sidebarParam)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const mod = event.metaKey || event.ctrlKey
      if (!mod) return

      const key = event.key.toLowerCase()
      if (key === 's') {
        event.preventDefault()
        void saveActive()
      } else if (key === 'b') {
        event.preventDefault()
        void setSidebarOpen((open) => !open)
      } else if (key === 'o') {
        event.preventDefault()
        if (event.shiftKey) void openLooseFiles()
        else void openFolder()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [saveActive, setSidebarOpen, openFolder, openLooseFiles])
}
