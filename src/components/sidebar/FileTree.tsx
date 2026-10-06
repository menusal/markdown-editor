import { AnimatePresence, motion } from 'motion/react'
import { useEffect } from 'react'

import { cn } from '@/lib/cn'
import { useDocumentsStore } from '@/store/documents'
import { useUiStore } from '@/store/ui'
import { useWorkspaceStore, type Project } from '@/store/workspace'
import type { TreeNode } from '@/lib/fs/types'
import { useProjectActions } from '@/hooks/useProjectActions'
import { ChevronRightIcon, FileTextIcon, FolderIcon } from '@/components/ui/icons'

export function FileTree({ project }: { project: Project }) {
  const toggleExpanded = useWorkspaceStore((s) => s.toggleExpanded)
  const loadDirectory = useWorkspaceStore((s) => s.loadDirectory)
  const open = useDocumentsStore((s) => s.open)
  const activeDoc = useDocumentsStore((s) =>
    s.activeDocId ? s.docs[s.activeDocId] : undefined,
  )
  const pushToast = useUiStore((s) => s.pushToast)
  const { selectFile } = useProjectActions()

  const activeNodeId =
    activeDoc && activeDoc.projectId === project.id ? activeDoc.nodeId : null

  const handleOpen = async (node: TreeNode) => {
    try {
      await open(project.id, node)
      selectFile(project.id, node.id)
    } catch {
      pushToast(`Could not open "${node.name}"`, 'error')
    }
  }

  if (project.tree.length === 0) {
    return (
      <p className="px-16 py-12 text-body leading-body text-steel">
        {project.kind === 'files' ? (
          'No files opened yet.'
        ) : (
          <>
            No <code className="font-mono">.md</code> files in this folder.
          </>
        )}
      </p>
    )
  }

  return (
    <ul className="space-y-4">
      {project.tree.map((node) => (
        <TreeItem
          key={node.id}
          node={node}
          depth={0}
          expanded={project.expanded}
          activeNodeId={activeNodeId}
          onToggle={toggleExpanded}
          onOpen={handleOpen}
          loadDirectory={loadDirectory}
        />
      ))}
    </ul>
  )
}

interface TreeItemProps {
  node: TreeNode
  depth: number
  expanded: Record<string, boolean>
  activeNodeId: string | null
  onToggle: (nodeId: string) => void
  onOpen: (node: TreeNode) => void
  loadDirectory: (nodeId: string) => Promise<void>
}

function TreeItem({
  node,
  depth,
  expanded,
  activeNodeId,
  onToggle,
  onOpen,
  loadDirectory,
}: TreeItemProps) {
  const isOpen = expanded[node.id] ?? false
  const children = node.children

  useEffect(() => {
    if (node.kind === 'directory' && isOpen && children === undefined) {
      void loadDirectory(node.id)
    }
  }, [node.kind, node.id, isOpen, children, loadDirectory])

  if (node.kind === 'directory') {
    return (
      <li>
        <button
          type="button"
          onClick={() => onToggle(node.id)}
          aria-expanded={isOpen}
          style={{ paddingLeft: 8 + depth * 16 }}
          className="flex w-full items-center gap-8 rounded-lg py-4 pr-12 text-left text-body leading-body font-medium text-ink transition-colors hover:bg-ash-mist"
        >
          <motion.span
            animate={{ rotate: isOpen ? 90 : 0 }}
            transition={{ duration: 0.15 }}
            className="text-silver"
          >
            <ChevronRightIcon width={16} height={16} />
          </motion.span>
          <FolderIcon width={16} height={16} className="text-steel" />
          <span className="truncate">{node.name}</span>
        </button>

        <AnimatePresence initial={false}>
          {isOpen ? (
            <motion.ul
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="space-y-4 overflow-hidden"
            >
              {(children ?? []).map((child) => (
                <TreeItem
                  key={child.id}
                  node={child}
                  depth={depth + 1}
                  expanded={expanded}
                  activeNodeId={activeNodeId}
                  onToggle={onToggle}
                  onOpen={onOpen}
                  loadDirectory={loadDirectory}
                />
              ))}
            </motion.ul>
          ) : null}
        </AnimatePresence>
      </li>
    )
  }

  const active = activeNodeId === node.id

  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(node)}
        style={{ paddingLeft: 32 + depth * 16 }}
        className={cn(
          'flex w-full items-center gap-8 rounded-lg py-4 pr-12 text-left text-body leading-body transition-colors',
          active
            ? 'bg-resolve-green/10 font-medium text-ink'
            : 'text-graphite hover:bg-ash-mist hover:text-ink',
        )}
      >
        <FileTextIcon width={16} height={16} className="shrink-0 opacity-70" />
        <span className="truncate">{node.name}</span>
      </button>
    </li>
  )
}
