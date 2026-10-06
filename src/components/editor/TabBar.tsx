import { motion } from 'motion/react'
import { useQueryState } from 'nuqs'

import { cn } from '@/lib/cn'
import { fileParam, projectParam } from '@/lib/url'
import { isDirty, projectDocIds, useDocumentsStore } from '@/store/documents'
import { useUiStore } from '@/store/ui'
import { useWorkspaceStore } from '@/store/workspace'
import { CloseIcon } from '@/components/ui/icons'

export function TabBar() {
  const activeProjectId = useWorkspaceStore((s) => s.activeProjectId)
  const docs = useDocumentsStore((s) => s.docs)
  const order = useDocumentsStore((s) => s.order)
  const activeDocId = useDocumentsStore((s) => s.activeDocId)
  const activate = useDocumentsStore((s) => s.activate)
  const close = useDocumentsStore((s) => s.close)
  const confirm = useUiStore((s) => s.confirm)
  const [, setProject] = useQueryState('project', projectParam)
  const [, setFile] = useQueryState('file', fileParam)

  const ids = activeProjectId ? projectDocIds(order, docs, activeProjectId) : []

  const handleActivate = (docId: string) => {
    const doc = docs[docId]
    activate(docId)
    if (doc) {
      void setProject(doc.projectId)
      void setFile(doc.nodeId)
    }
  }

  const handleClose = async (docId: string) => {
    const doc = docs[docId]
    if (doc && isDirty(doc)) {
      const confirmed = await confirm({
        title: `Close "${doc.name}"?`,
        description:
          'This file has unsaved changes. Closing it will discard them.',
        confirmLabel: 'Close without saving',
        cancelLabel: 'Keep editing',
        danger: true,
      })
      if (!confirmed) return
    }
    close(docId)
    const next = useDocumentsStore.getState().activeDocId
    const nextDoc = next ? useDocumentsStore.getState().docs[next] : null
    void setFile(nextDoc?.nodeId ?? null)
  }

  return (
    <div className="scrollbar-thin flex items-stretch gap-4 overflow-x-auto border-b border-soft-fog bg-ash-mist px-8 py-8">
      {ids.map((docId) => {
        const doc = docs[docId]
        if (!doc) return null
        const active = activeDocId === docId
        const dirty = isDirty(doc)
        return (
          <div
            key={docId}
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
              onClick={() => handleActivate(docId)}
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
              onClick={() => void handleClose(docId)}
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
