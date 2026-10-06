import { AnimatePresence, motion } from 'motion/react'
import { useQueryState } from 'nuqs'

import { sidebarParam } from '@/lib/url'
import { useWorkspaceStore } from '@/store/workspace'
import { Sidebar } from '@/components/sidebar/Sidebar'
import { SearchPalette } from '@/components/search/SearchPalette'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { StatusBar } from '@/components/layout/StatusBar'
import { Toolbar } from '@/components/toolbar/Toolbar'
import { Toaster } from '@/components/ui/Toaster'
import { WorkspaceGate } from '@/components/layout/WorkspaceGate'

export function AppShell() {
  const [sidebarOpen] = useQueryState('sidebar', sidebarParam)
  const status = useWorkspaceStore((s) => s.status)
  const showSidebar = sidebarOpen && status === 'ready'

  return (
    <div className="flex h-full flex-col bg-warm-canvas">
      <Toolbar />

      <div className="flex min-h-0 flex-1">
        <AnimatePresence initial={false}>
          {showSidebar ? (
            <motion.div
              key="sidebar"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 288, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <Sidebar />
            </motion.div>
          ) : null}
        </AnimatePresence>

        <main className="min-w-0 flex-1">
          <WorkspaceGate />
        </main>
      </div>

      <StatusBar />
      <SearchPalette />
      <ConfirmDialog />
      <Toaster />
    </div>
  )
}
