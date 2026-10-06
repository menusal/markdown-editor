import { useEffect, useRef, useState } from 'react'

import { ScrollSync } from '@/lib/scroll-sync'
import { EditorPane } from '@/components/editor/EditorPane'
import { PreviewPane } from '@/components/editor/PreviewPane'
import { ScrollSyncContext } from '@/components/editor/scroll-sync-context'

const MIN_RATIO = 0.2
const MAX_RATIO = 0.8

export function SplitView() {
  const [ratio, setRatio] = useState(0.5)
  const [sync] = useState(() => new ScrollSync())
  const containerRef = useRef<HTMLDivElement>(null)
  const draggingRef = useRef(false)

  useEffect(() => () => sync.destroy(), [sync])

  useEffect(() => {
    const handleMove = (event: PointerEvent) => {
      if (!draggingRef.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const next = (event.clientX - rect.left) / rect.width
      setRatio(Math.min(MAX_RATIO, Math.max(MIN_RATIO, next)))
    }
    const handleUp = () => {
      draggingRef.current = false
      document.body.style.cursor = ''
    }
    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
    return () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
    }
  }, [])

  return (
    <ScrollSyncContext.Provider value={sync}>
      <div ref={containerRef} className="flex h-full min-h-0">
        <div style={{ width: `${ratio * 100}%` }} className="h-full min-w-0">
          <EditorPane />
        </div>

        <div
          role="separator"
          aria-orientation="vertical"
          onPointerDown={() => {
            draggingRef.current = true
            document.body.style.cursor = 'col-resize'
          }}
          className="group flex w-12 shrink-0 cursor-col-resize touch-none items-center justify-center"
        >
          <span className="h-full w-[1px] bg-soft-fog transition-colors group-hover:bg-resolve-green" />
        </div>

        <div className="h-full min-w-0 flex-1">
          <PreviewPane />
        </div>
      </div>
    </ScrollSyncContext.Provider>
  )
}
