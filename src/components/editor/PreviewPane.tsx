import { useEffect, useMemo, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import { createMarkdownComponents } from '@/lib/markdown/components'
import { setTaskAtLine } from '@/lib/markdown/tasks'
import { useDocumentsStore } from '@/store/documents'
import { useScrollSync } from '@/components/editor/scroll-sync-context'

export function PreviewPane() {
  const activeDocId = useDocumentsStore((s) => s.activeDocId)
  const content = useDocumentsStore((s) =>
    s.activeDocId ? (s.docs[s.activeDocId]?.content ?? '') : '',
  )
  const updateContent = useDocumentsStore((s) => s.updateContent)

  const sync = useScrollSync()
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!sync) return
    sync.registerPreview(scrollRef.current)
    return () => sync.registerPreview(null)
  }, [sync])

  const onToggleTask = useMemo(() => {
    if (!activeDocId) return undefined
    return (line: number, checked: boolean) => {
      const current = useDocumentsStore.getState().docs[activeDocId]?.content
      if (current == null) return
      updateContent(activeDocId, setTaskAtLine(current, line, checked))
    }
  }, [activeDocId, updateContent])

  const components = useMemo(
    () => createMarkdownComponents({ onToggleTask }),
    [onToggleTask],
  )

  if (!activeDocId) return null

  return (
    <div ref={scrollRef} className="scrollbar-thin h-full overflow-y-auto bg-pure-white">
      <article className="mx-auto max-w-[760px] px-32 py-24">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
          {content}
        </ReactMarkdown>
      </article>
    </div>
  )
}
