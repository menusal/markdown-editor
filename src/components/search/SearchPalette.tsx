import { useEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent, ReactNode } from 'react'

import { cn } from '@/lib/cn'
import { collectFileHandles } from '@/lib/fs/index'
import { rankByFuzzy } from '@/lib/search/fuzzy'
import type {
  SearchFileHandle,
  SearchGroup,
  SearchRequest,
  SearchResponse,
} from '@/lib/search/worker-types'
import { makeDocId, useDocumentsStore } from '@/store/documents'
import { useUiStore } from '@/store/ui'
import { activeProject, useWorkspaceStore } from '@/store/workspace'
import { useProjectActions } from '@/hooks/useProjectActions'
import { FolderIcon, SearchIcon } from '@/components/ui/icons'
import SearchWorker from '@/workers/search.worker?worker'

const MAX_FILE_SIZE = 1_000_000
const MAX_RESULTS = 300
const MAX_FILES = 100
const DEBOUNCE_MS = 250
const MIN_TEXT_QUERY = 2

/** Handles cache so repeated text searches don't re-walk the project. */
const handleCache = new Map<string, SearchFileHandle[]>()

interface FlatItem {
  key: string
  fileId: string
  title: string
  path: string
  line?: number
  excerpt?: string
}

export function SearchPalette() {
  const open = useUiStore((s) => s.searchOpen)
  if (!open) return null
  return <PaletteContent />
}

function PaletteContent() {
  const mode = useUiStore((s) => s.searchMode)
  const setMode = useUiStore((s) => s.setSearchMode)
  const close = useUiStore((s) => s.closeSearch)
  const project = useWorkspaceStore(activeProject)
  const revealLine = useDocumentsStore((s) => s.revealLine)
  const { openPath } = useProjectActions()

  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  const [groups, setGroups] = useState<SearchGroup[]>([])
  const [searching, setSearching] = useState(false)

  const workerRef = useRef<Worker | null>(null)
  const requestIdRef = useRef(0)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => () => workerRef.current?.terminate(), [])

  const fileItems = useMemo<FlatItem[]>(() => {
    if (!project) return []
    return rankByFuzzy(
      query,
      project.index,
      (entry) => [entry.title, entry.name, entry.id],
      50,
    ).map(({ item }) => ({
      key: item.id,
      fileId: item.id,
      title: item.title,
      path: item.id,
    }))
  }, [project, query])

  const textItems = useMemo<FlatItem[]>(
    () =>
      groups.flatMap((group) =>
        group.matches.map((match) => ({
          key: `${group.id}:${match.line}`,
          fileId: group.id,
          title: group.name,
          path: group.id,
          line: match.line,
          excerpt: match.text,
        })),
      ),
    [groups],
  )

  const items = mode === 'files' ? fileItems : textItems
  const selectedIndex = items.length ? Math.min(selected, items.length - 1) : 0

  // Debounced full-text search. setState only happens asynchronously (timer /
  // worker message) to keep the effect free of synchronous state updates.
  useEffect(() => {
    if (mode !== 'text' || !project) return
    const trimmed = query.trim()
    if (trimmed.length < MIN_TEXT_QUERY) return

    const timer = window.setTimeout(async () => {
      setSearching(true)
      if (!handleCache.has(project.id)) {
        handleCache.set(project.id, await collectFileHandles(project.source))
      }
      const files = handleCache.get(project.id) ?? []

      if (!workerRef.current) workerRef.current = new SearchWorker()
      const worker = workerRef.current
      const requestId = (requestIdRef.current += 1)

      worker.onmessage = (event: MessageEvent<SearchResponse>) => {
        if (event.data.requestId !== requestIdRef.current) return
        setGroups(event.data.groups)
        setSearching(false)
      }

      const request: SearchRequest = {
        requestId,
        query: trimmed,
        files,
        maxFileSize: MAX_FILE_SIZE,
        maxResults: MAX_RESULTS,
        maxFiles: MAX_FILES,
      }
      worker.postMessage(request)
    }, DEBOUNCE_MS)

    return () => window.clearTimeout(timer)
  }, [query, mode, project])

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(
      `[data-index="${selectedIndex}"]`,
    )
    el?.scrollIntoView({ block: 'nearest' })
  }, [selectedIndex])

  const handleQueryChange = (value: string) => {
    setQuery(value)
    setSelected(0)
    if (value.trim().length < MIN_TEXT_QUERY) {
      setGroups([])
      setSearching(false)
    }
  }

  const handleSwitchMode = (next: 'files' | 'text') => {
    setMode(next)
    setSelected(0)
    if (next === 'text' && query.trim().length < MIN_TEXT_QUERY) setGroups([])
  }

  const handleChoose = (item: FlatItem) => {
    if (!project) return
    void openPath(project.id, item.fileId).then(() => {
      if (item.line) revealLine(makeDocId(project.id, item.fileId), item.line)
    })
    close()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      close()
    } else if (event.key === 'ArrowDown') {
      event.preventDefault()
      setSelected((s) => Math.min(s + 1, items.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setSelected((s) => Math.max(s - 1, 0))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      const item = items[selectedIndex]
      if (item) handleChoose(item)
    } else if (event.key === 'Tab') {
      event.preventDefault()
      handleSwitchMode(mode === 'files' ? 'text' : 'files')
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex justify-center bg-ink/40 px-16 pt-[10vh]"
      onMouseDown={close}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        className="flex max-h-[70vh] w-full max-w-[640px] flex-col overflow-hidden rounded-2xl border border-soft-fog bg-pure-white shadow-subtle-4"
        onMouseDown={(event) => event.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center gap-8 border-b border-soft-fog px-16 py-12">
          <SearchIcon width={16} height={16} className="shrink-0 text-silver" />
          <input
            autoFocus
            value={query}
            onChange={(event) => handleQueryChange(event.target.value)}
            placeholder={
              mode === 'files'
                ? 'Search files by name or title…'
                : 'Search text across markdown files…'
            }
            className="min-w-0 flex-1 bg-transparent text-body leading-body text-ink outline-none placeholder:text-silver"
          />
          <ModeTab active={mode === 'files'} onClick={() => handleSwitchMode('files')}>
            Files
          </ModeTab>
          <ModeTab active={mode === 'text'} onClick={() => handleSwitchMode('text')}>
            Text
          </ModeTab>
        </div>

        <div ref={listRef} className="scrollbar-thin min-h-0 flex-1 overflow-y-auto p-8">
          {!project ? (
            <Hint>Open a project to search.</Hint>
          ) : searching ? (
            <Hint>Searching…</Hint>
          ) : items.length === 0 ? (
            <Hint>
              {query
                ? 'No results.'
                : mode === 'files'
                  ? 'Type to search files.'
                  : 'Type at least 2 characters.'}
            </Hint>
          ) : (
            items.map((item, index) => (
              <button
                key={item.key}
                type="button"
                data-index={index}
                onMouseEnter={() => setSelected(index)}
                onClick={() => handleChoose(item)}
                className={cn(
                  'flex w-full flex-col gap-2 rounded-lg px-12 py-8 text-left transition-colors',
                  index === selectedIndex ? 'bg-ash-mist' : 'hover:bg-ash-mist/60',
                )}
              >
                <span className="flex items-center gap-8">
                  <FolderIcon width={14} height={14} className="shrink-0 text-silver" />
                  <span className="min-w-0 flex-1 truncate text-body leading-body font-medium text-ink">
                    {item.title}
                  </span>
                  {item.line ? (
                    <span className="shrink-0 text-caption leading-caption text-silver">
                      L{item.line}
                    </span>
                  ) : null}
                </span>
                <span className="truncate pl-24 text-caption leading-caption text-steel">
                  {item.excerpt ?? item.path}
                </span>
              </button>
            ))
          )}
        </div>

        <div className="flex items-center gap-12 border-t border-soft-fog px-16 py-8 text-caption leading-caption text-silver">
          <span>↑↓ navigate</span>
          <span>↵ open</span>
          <span>Tab switch</span>
          <span>esc close</span>
        </div>
      </div>
    </div>
  )
}

function ModeTab({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'shrink-0 rounded-full px-12 py-4 text-caption leading-caption font-medium transition-colors',
        active ? 'bg-resolve-green/15 text-ink' : 'text-steel hover:bg-ash-mist',
      )}
    >
      {children}
    </button>
  )
}

function Hint({ children }: { children: ReactNode }) {
  return (
    <p className="px-12 py-16 text-center text-body leading-body text-steel">
      {children}
    </p>
  )
}
