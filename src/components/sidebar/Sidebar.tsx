import { useDocumentsStore } from '@/store/documents'
import { useUiStore } from '@/store/ui'
import { activeProject, useWorkspaceStore } from '@/store/workspace'
import { useProjectActions } from '@/hooks/useProjectActions'
import { FileTree } from '@/components/sidebar/FileTree'
import { ProjectSwitcher } from '@/components/sidebar/ProjectSwitcher'
import { CloseIcon, RefreshIcon } from '@/components/ui/icons'

export function Sidebar() {
  const project = useWorkspaceStore(activeProject)
  const refresh = useWorkspaceStore((s) => s.refreshActive)
  const reloadProject = useDocumentsStore((s) => s.reloadProject)
  const pushToast = useUiStore((s) => s.pushToast)
  const { requestRemove } = useProjectActions()

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

      <div className="scrollbar-thin flex-1 overflow-y-auto px-8 py-12">
        {project ? <FileTree project={project} /> : null}
      </div>

      <div className="border-t border-soft-fog px-16 py-12">
        <p className="text-caption leading-caption font-medium text-silver">
          {total} {total === 1 ? 'file' : 'files'} .md
        </p>
      </div>
    </aside>
  )
}
