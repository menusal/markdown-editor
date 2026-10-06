import { isDirty, useDocumentsStore } from '@/store/documents'
import { GitHubIcon } from '@/components/ui/icons'

const REPO_URL = 'https://github.com/menusal/markdown-editor'

export function StatusBar() {
  const activePath = useDocumentsStore((s) => s.activePath)
  const activeDoc = useDocumentsStore((s) =>
    s.activePath ? s.docs[s.activePath] : undefined,
  )
  const openCount = useDocumentsStore((s) => s.order.length)

  const dirty = activeDoc ? isDirty(activeDoc) : false

  return (
    <footer className="flex items-center gap-16 border-t border-soft-fog bg-warm-canvas px-16 py-8 text-steel">
      <span className="truncate font-mono text-caption leading-caption">
        {activePath ?? 'No file open'}
      </span>

      <span className="ml-auto whitespace-nowrap text-caption leading-caption">
        {openCount} {openCount === 1 ? 'tab' : 'tabs'}
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
