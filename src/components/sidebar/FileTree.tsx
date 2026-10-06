import { AnimatePresence, motion } from 'motion/react'
import { useQueryState } from 'nuqs'

import { cn } from '@/lib/cn'
import { fileParam } from '@/lib/url'
import { useDocumentsStore } from '@/store/documents'
import { useUiStore } from '@/store/ui'
import { useWorkspaceStore } from '@/store/workspace'
import type { TreeNode } from '@/lib/fs/types'
import { ChevronRightIcon, FileTextIcon, FolderIcon } from '@/components/ui/icons'

export function FileTree() {
  const tree = useWorkspaceStore((s) => s.tree)
  const expanded = useWorkspaceStore((s) => s.expanded)
  const toggleExpanded = useWorkspaceStore((s) => s.toggleExpanded)
  const open = useDocumentsStore((s) => s.open)
  const activePath = useDocumentsStore((s) => s.activePath)
  const pushToast = useUiStore((s) => s.pushToast)
  const [, setFile] = useQueryState('file', fileParam)

  const handleOpen = async (node: TreeNode) => {
    try {
      await open(node)
      void setFile(node.path)
    } catch {
      pushToast(`Could not open "${node.name}"`, 'error')
    }
  }

  if (tree.length === 0) {
    return (
      <p className="px-16 py-12 text-body leading-body text-steel">
        No <code className="font-mono">.md</code> files in this folder.
      </p>
    )
  }

  return (
    <ul className="space-y-4">
      {tree.map((node) => (
        <TreeItem
          key={node.path}
          node={node}
          depth={0}
          expanded={expanded}
          activePath={activePath}
          onToggle={toggleExpanded}
          onOpen={handleOpen}
        />
      ))}
    </ul>
  )
}

interface TreeItemProps {
  node: TreeNode
  depth: number
  expanded: Record<string, boolean>
  activePath: string | null
  onToggle: (path: string) => void
  onOpen: (node: TreeNode) => void
}

function TreeItem({ node, depth, expanded, activePath, onToggle, onOpen }: TreeItemProps) {
  const isOpen = expanded[node.path] ?? false

  if (node.kind === 'directory') {
    return (
      <li>
        <button
          type="button"
          onClick={() => onToggle(node.path)}
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
              {node.children.map((child) => (
                <TreeItem
                  key={child.path}
                  node={child}
                  depth={depth + 1}
                  expanded={expanded}
                  activePath={activePath}
                  onToggle={onToggle}
                  onOpen={onOpen}
                />
              ))}
            </motion.ul>
          ) : null}
        </AnimatePresence>
      </li>
    )
  }

  const active = activePath === node.path

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
