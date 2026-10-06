import { useQueryState } from 'nuqs'

import { fileParam } from '@/lib/url'
import type { TreeNode } from '@/lib/fs/types'
import { useDocumentsStore } from '@/store/documents'
import { useWorkspaceStore } from '@/store/workspace'
import { FileTree } from '@/components/sidebar/FileTree'
import { CloseIcon, FolderIcon, RefreshIcon } from '@/components/ui/icons'

function countMarkdown(nodes: TreeNode[]): number {
  return nodes.reduce(
    (total, node) =>
      node.kind === 'file' ? total + 1 : total + countMarkdown(node.children),
    0,
  )
}

export function Sidebar() {
  const rootName = useWorkspaceStore((s) => s.rootName)
  const tree = useWorkspaceStore((s) => s.tree)
  const refresh = useWorkspaceStore((s) => s.refresh)
  const closeWorkspace = useWorkspaceStore((s) => s.close)
  const closeAll = useDocumentsStore((s) => s.closeAll)
  const [, setFile] = useQueryState('file', fileParam)

  const total = countMarkdown(tree)

  const handleClose = async () => {
    closeAll()
    void setFile(null)
    await closeWorkspace()
  }

  return (
    <aside className="flex h-full w-[288px] shrink-0 flex-col border-r border-soft-fog bg-warm-canvas">
      <div className="flex items-center gap-8 border-b border-soft-fog px-16 py-12">
        <FolderIcon width={16} height={16} className="shrink-0 text-steel" />
        <span className="truncate text-body leading-body font-medium text-ink">
          {rootName}
        </span>
        <div className="ml-auto flex items-center gap-4">
          <button
            type="button"
            aria-label="Refresh"
            onClick={() => void refresh()}
            className="flex size-32 items-center justify-center rounded-full text-steel transition-colors hover:bg-ash-mist hover:text-ink"
          >
            <RefreshIcon width={15} height={15} />
          </button>
          <button
            type="button"
            aria-label="Close folder"
            onClick={() => void handleClose()}
            className="flex size-32 items-center justify-center rounded-full text-steel transition-colors hover:bg-ash-mist hover:text-ink"
          >
            <CloseIcon width={15} height={15} />
          </button>
        </div>
      </div>

      <div className="scrollbar-thin flex-1 overflow-y-auto px-8 py-12">
        <FileTree />
      </div>

      <div className="border-t border-soft-fog px-16 py-12">
        <p className="text-caption leading-caption font-medium text-silver">
          {total} {total === 1 ? 'file' : 'files'} .md
        </p>
      </div>
    </aside>
  )
}
