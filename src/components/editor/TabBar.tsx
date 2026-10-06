import { motion } from 'motion/react'
import { useQueryState } from 'nuqs'

import { cn } from '@/lib/cn'
import { fileParam } from '@/lib/url'
import { isDirty, useDocumentsStore } from '@/store/documents'
import { CloseIcon } from '@/components/ui/icons'

export function TabBar() {
  const order = useDocumentsStore((s) => s.order)
  const docs = useDocumentsStore((s) => s.docs)
  const activePath = useDocumentsStore((s) => s.activePath)
  const activate = useDocumentsStore((s) => s.activate)
  const close = useDocumentsStore((s) => s.close)
  const [file, setFile] = useQueryState('file', fileParam)

  const handleActivate = (path: string) => {
    activate(path)
    void setFile(path)
  }

  const handleClose = (path: string) => {
    const doc = useDocumentsStore.getState().docs[path]
    if (doc && isDirty(doc)) {
      const confirmed = window.confirm(
        `"${doc.name}" has unsaved changes. Close anyway?`,
      )
      if (!confirmed) return
    }
    close(path)
    const next = useDocumentsStore.getState().activePath
    void setFile(next)
  }

  return (
    <div className="scrollbar-thin flex items-stretch gap-4 overflow-x-auto border-b border-soft-fog bg-ash-mist px-8 py-8">
      {order.map((path) => {
        const doc = docs[path]
        if (!doc) return null
        const active = activePath === path || file === path
        const dirty = isDirty(doc)
        return (
          <div
            key={path}
            className={cn(
              'group relative flex shrink-0 items-center gap-8 rounded-lg py-4 pr-4 pl-12 transition-colors',
              active
                ? 'text-ink'
                : 'text-steel hover:bg-soft-fog hover:text-graphite',
            )}
          >
            {active ? (
              <motion.span
                layoutId="tab-active"
                className="pointer-events-none absolute inset-0 rounded-lg bg-pure-white shadow-subtle-2"
                transition={{ type: 'spring', stiffness: 500, damping: 36 }}
              />
            ) : null}
            <button
              type="button"
              onClick={() => handleActivate(path)}
              className="relative flex items-center gap-8 text-body leading-body font-medium"
            >
              {dirty ? (
                <span
                  className="size-8 rounded-full bg-resolve-green"
                  aria-label="Unsaved changes"
                />
              ) : null}
              <span className="max-w-[180px] truncate">{doc.name}</span>
            </button>
            <button
              type="button"
              aria-label={`Close ${doc.name}`}
              onClick={() => handleClose(path)}
              className="relative flex size-24 items-center justify-center rounded-full text-silver opacity-0 transition-opacity hover:bg-soft-fog hover:text-ink group-hover:opacity-100"
            >
              <CloseIcon width={14} height={14} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
