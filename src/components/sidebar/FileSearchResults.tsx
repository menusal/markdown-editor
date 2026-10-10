import { cn } from '@/lib/cn'
import type { FileIndexEntry } from '@/lib/fs/index'
import type { ScoredItem } from '@/lib/search/fuzzy'
import { useDocumentsStore } from '@/store/documents'
import { useUiStore } from '@/store/ui'
import type { Project } from '@/store/workspace'
import { useProjectActions } from '@/hooks/useProjectActions'
import { FileTextIcon } from '@/components/ui/icons'

interface FileSearchResultsProps {
  project: Project
  results: ScoredItem<FileIndexEntry>[]
}

export function FileSearchResults({ project, results }: FileSearchResultsProps) {
  const { openPath } = useProjectActions()
  const pushToast = useUiStore((s) => s.pushToast)
  const activeDoc = useDocumentsStore((s) =>
    s.activeDocId ? s.docs[s.activeDocId] : undefined,
  )

  const activeNodeId =
    activeDoc && activeDoc.projectId === project.id ? activeDoc.nodeId : null

  if (results.length === 0) {
    return (
      <p className="px-16 py-12 text-body leading-body text-steel">
        No files match that name.
      </p>
    )
  }

  return (
    <ul className="space-y-4">
      {results.map(({ item }) => {
        const active = item.id === activeNodeId
        return (
          <li key={item.id}>
            <button
              type="button"
              onClick={() =>
                void openPath(project.id, item.id).catch(() =>
                  pushToast(`Could not open "${item.name}"`, 'error'),
                )
              }
              title={item.id}
              className={cn(
                'flex w-full items-center gap-8 rounded-lg py-4 pr-12 pl-8 text-left text-body leading-body transition-colors',
                active
                  ? 'bg-resolve-green/10 font-medium text-ink'
                  : 'text-graphite hover:bg-ash-mist hover:text-ink',
              )}
            >
              <FileTextIcon
                width={16}
                height={16}
                className="shrink-0 opacity-70"
              />
              <span className="truncate">{item.name}</span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
