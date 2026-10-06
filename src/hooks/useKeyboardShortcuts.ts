import { useEffect } from 'react'
import { useQueryState } from 'nuqs'

import { sidebarParam } from '@/lib/url'
import { useSaveActive } from '@/hooks/useSaveActive'
import { useWorkspaceStore } from '@/store/workspace'

export function useKeyboardShortcuts() {
  const saveActive = useSaveActive()
  const [, setSidebarOpen] = useQueryState('sidebar', sidebarParam)
  const openDirectory = useWorkspaceStore((s) => s.openDirectory)

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
        void openDirectory()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [saveActive, setSidebarOpen, openDirectory])
}
