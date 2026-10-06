import { useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import { createMarkdownComponents } from '@/lib/markdown/components'
import { setTaskAtLine } from '@/lib/markdown/tasks'
import { useDocumentsStore } from '@/store/documents'

export function PreviewPane() {
  const activePath = useDocumentsStore((s) => s.activePath)
  const content = useDocumentsStore((s) =>
    s.activePath ? (s.docs[s.activePath]?.content ?? '') : '',
  )
  const updateContent = useDocumentsStore((s) => s.updateContent)

  const onToggleTask = useMemo(() => {
    if (!activePath) return undefined
    return (line: number, checked: boolean) => {
      const current = useDocumentsStore.getState().docs[activePath]?.content
      if (current == null) return
      updateContent(activePath, setTaskAtLine(current, line, checked))
    }
  }, [activePath, updateContent])

  const components = useMemo(
    () => createMarkdownComponents({ onToggleTask }),
    [onToggleTask],
  )

  if (!activePath) return null

  return (
    <div className="scrollbar-thin h-full overflow-y-auto bg-pure-white">
      <article className="mx-auto max-w-[760px] px-32 py-24">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
          {content}
        </ReactMarkdown>
      </article>
    </div>
  )
}
