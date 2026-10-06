import { projectDocIds, isDirty, useDocumentsStore } from '@/store/documents'
import { activeProject, useWorkspaceStore } from '@/store/workspace'
import { FolderIcon, GitHubIcon } from '@/components/ui/icons'

const REPO_URL = 'https://github.com/menusal/markdown-editor'

export function StatusBar() {
  const project = useWorkspaceStore(activeProject)
  const activeProjectId = useWorkspaceStore((s) => s.activeProjectId)
  const activeDoc = useDocumentsStore((s) =>
    s.activeDocId ? s.docs[s.activeDocId] : undefined,
  )
  const docs = useDocumentsStore((s) => s.docs)
  const order = useDocumentsStore((s) => s.order)
  const count = activeProjectId
    ? projectDocIds(order, docs, activeProjectId).length
    : 0

  const dirty = activeDoc ? isDirty(activeDoc) : false

  return (
    <footer className="flex items-center gap-16 border-t border-soft-fog bg-warm-canvas px-16 py-8 text-steel">
      <span className="flex min-w-0 items-center gap-8">
        <FolderIcon width={14} height={14} className="shrink-0 text-silver" />
        <span className="truncate text-caption leading-caption font-medium">
          {project?.name ?? 'No project'}
        </span>
        {activeDoc ? (
          <>
            <span className="text-silver" aria-hidden>
              /
            </span>
            <span className="truncate text-caption leading-caption">
              {activeDoc.name}
            </span>
          </>
        ) : null}
      </span>

      <span className="ml-auto whitespace-nowrap text-caption leading-caption">
        {count} {count === 1 ? 'tab' : 'tabs'}
      </span>

      {activeDoc ? (
        <span className="flex items-center gap-8 whitespace-nowrap text-caption leading-caption">
          <span
            className={dirty ? 'size-8 rounded-full bg-sienna-brand' : 'size-8 rounded-full bg-resolve-green'}
          />
          {dirty ? 'Unsaved' : 'Saved'}
        </span>
      ) : null}

      <span className="h-16 w-px shrink-0 bg-soft-fog" aria-hidden />

      <a
        href={REPO_URL}
        target="_blank"
        rel="noreferrer"
        aria-label="Built by menusal — view source on GitHub"
        className="flex shrink-0 items-center gap-8 whitespace-nowrap text-caption leading-caption transition-colors hover:text-ink"
      >
        <GitHubIcon width={14} height={14} />
        <span className="hidden sm:inline">menusal/markdown-editor</span>
      </a>
    </footer>
  )
}
