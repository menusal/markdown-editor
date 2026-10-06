import { useDocumentsStore, isDirty } from '@/store/documents'
import { activeProject, useWorkspaceStore } from '@/store/workspace'
import { useProjectActions } from '@/hooks/useProjectActions'
import type { TreeNode } from '@/lib/fs/types'
import { FileTree } from '@/components/sidebar/FileTree'
import { ProjectSwitcher } from '@/components/sidebar/ProjectSwitcher'
import { CloseIcon, RefreshIcon } from '@/components/ui/icons'

function countMarkdown(nodes: TreeNode[]): number {
  return nodes.reduce(
    (total, node) =>
      node.kind === 'file' ? total + 1 : total + countMarkdown(node.children),
    0,
  )
}

export function Sidebar() {
  const project = useWorkspaceStore(activeProject)
  const refresh = useWorkspaceStore((s) => s.refreshActive)
  const docs = useDocumentsStore((s) => s.docs)
  const { remove } = useProjectActions()

  const total = project ? countMarkdown(project.tree) : 0

  const handleRemove = () => {
    if (!project) return
    const dirty = Object.values(docs).some(
      (doc) => doc.projectId === project.id && isDirty(doc),
    )
    if (dirty) {
      const confirmed = window.confirm(
        `"${project.name}" has unsaved changes. Remove it anyway?`,
      )
      if (!confirmed) return
    }
    void remove(project.id)
  }

  return (
    <aside className="flex h-full w-[288px] shrink-0 flex-col border-r border-soft-fog bg-warm-canvas">
      <div className="flex items-center gap-4 border-b border-soft-fog px-8 py-8">
        <ProjectSwitcher />
        <button
          type="button"
          aria-label="Refresh"
          onClick={() => void refresh()}
          className="flex size-32 shrink-0 items-center justify-center rounded-full text-steel transition-colors hover:bg-ash-mist hover:text-ink"
        >
          <RefreshIcon width={15} height={15} />
        </button>
        <button
          type="button"
          aria-label="Remove project"
          onClick={handleRemove}
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
