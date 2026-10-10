import { useMemo, useState } from 'react'

import { rankByFuzzy } from '@/lib/search/fuzzy'
import { useDocumentsStore } from '@/store/documents'
import { useUiStore } from '@/store/ui'
import { activeProject, useWorkspaceStore } from '@/store/workspace'
import { useProjectActions } from '@/hooks/useProjectActions'
import { FileTree } from '@/components/sidebar/FileTree'
import { FileSearchResults } from '@/components/sidebar/FileSearchResults'
import { ProjectSwitcher } from '@/components/sidebar/ProjectSwitcher'
import { CloseIcon, RefreshIcon, SearchIcon } from '@/components/ui/icons'

const MAX_RESULTS = 100

export function Sidebar() {
  const project = useWorkspaceStore(activeProject)
  const refresh = useWorkspaceStore((s) => s.refreshActive)
  const reloadProject = useDocumentsStore((s) => s.reloadProject)
  const pushToast = useUiStore((s) => s.pushToast)
  const { requestRemove } = useProjectActions()

  const [query, setQuery] = useState('')
  const trimmed = query.trim()

  const results = useMemo(
    () =>
      project && trimmed
        ? rankByFuzzy(
            trimmed,
            project.index,
            (entry) => [entry.title, entry.name, entry.id],
            MAX_RESULTS,
          )
        : [],
    [project, trimmed],
  )

  const searching = trimmed.length > 0
  const total = project?.index.length ?? 0

  const handleRefresh = async () => {
    if (!project) return
    await refresh()
    const { reloaded, skipped } = await reloadProject(project.id)
    if (skipped.length > 0) {
      pushToast(
        `${skipped.length} file${skipped.length === 1 ? '' : 's'} not reloaded — unsaved changes`,
        'info',
      )
    } else if (reloaded > 0) {
      pushToast(
        `Reloaded ${reloaded} file${reloaded === 1 ? '' : 's'} from disk`,
        'success',
      )
    }
  }

  return (
    <aside className="flex h-full w-[288px] shrink-0 flex-col border-r border-soft-fog bg-warm-canvas">
      <div className="flex items-center gap-4 border-b border-soft-fog px-8 py-8">
        <ProjectSwitcher />
        <button
          type="button"
          aria-label="Refresh"
          onClick={() => void handleRefresh()}
          className="flex size-32 shrink-0 items-center justify-center rounded-full text-steel transition-colors hover:bg-ash-mist hover:text-ink"
        >
          <RefreshIcon width={15} height={15} />
        </button>
        <button
          type="button"
          aria-label="Remove project"
          onClick={() => project && void requestRemove(project.id, project.name)}
          className="flex size-32 shrink-0 items-center justify-center rounded-full text-steel transition-colors hover:bg-ash-mist hover:text-ink"
        >
          <CloseIcon width={15} height={15} />
        </button>
      </div>

      <div className="border-b border-soft-fog px-12 py-8">
        <div className="flex items-center gap-8 rounded-lg bg-ash-mist px-8 py-4">
          <SearchIcon width={15} height={15} className="shrink-0 text-silver" />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') setQuery('')
            }}
            placeholder="Search files…"
            aria-label="Search files"
            className="min-w-0 flex-1 bg-transparent text-body leading-body text-ink outline-none placeholder:text-silver"
          />
          {searching ? (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setQuery('')}
              className="flex size-24 shrink-0 items-center justify-center rounded-full text-silver transition-colors hover:bg-soft-fog hover:text-ink"
            >
              <CloseIcon width={13} height={13} />
            </button>
          ) : null}
        </div>
      </div>

      <div className="scrollbar-thin flex-1 overflow-y-auto px-8 py-12">
        {project ? (
          searching ? (
            total === 0 ? (
              <p className="px-16 py-12 text-body leading-body text-steel">
                No files indexed in this project yet. If you just opened it, hit{' '}
                <span className="font-medium">Refresh</span>.
              </p>
            ) : (
              <FileSearchResults project={project} results={results} />
            )
          ) : (
            <FileTree project={project} />
          )
        ) : null}
      </div>

      <div className="border-t border-soft-fog px-16 py-12">
        <p className="text-caption leading-caption font-medium text-silver">
          {searching
            ? `${results.length}${results.length >= MAX_RESULTS ? '+' : ''} ${
                results.length === 1 ? 'match' : 'matches'
              }`
            : `${total} ${total === 1 ? 'file' : 'files'} .md`}
        </p>
      </div>
    </aside>
  )
}
