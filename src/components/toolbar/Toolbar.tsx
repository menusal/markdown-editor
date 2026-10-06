import { motion } from 'motion/react'
import { useQueryState } from 'nuqs'
import type { ReactNode } from 'react'

import { cn } from '@/lib/cn'
import type { ThemeMode } from '@/lib/theme'
import { VIEW_MODES, sidebarParam, viewParam, type ViewMode } from '@/lib/url'
import { useProjectActions } from '@/hooks/useProjectActions'
import { useSaveActive } from '@/hooks/useSaveActive'
import { useTheme } from '@/hooks/useTheme'
import { canRedo, canUndo, isDirty, useDocumentsStore } from '@/store/documents'
import { useUiStore } from '@/store/ui'
import { useWorkspaceStore } from '@/store/workspace'
import { Button } from '@/components/ui/Button'
import { Menu, MenuItem } from '@/components/ui/Menu'
import {
  ChevronDownIcon,
  CodeIcon,
  ColumnsIcon,
  EyeIcon,
  FileTextIcon,
  FolderIcon,
  FolderOpenIcon,
  MonitorIcon,
  MoonIcon,
  RedoIcon,
  ResetIcon,
  SaveIcon,
  SearchIcon,
  SidebarIcon,
  SunIcon,
  UndoIcon,
} from '@/components/ui/icons'

const viewMeta: Record<ViewMode, { label: string; icon: typeof ColumnsIcon }> = {
  split: { label: 'Split', icon: ColumnsIcon },
  editor: { label: 'Editor', icon: CodeIcon },
  preview: { label: 'Preview', icon: EyeIcon },
}

export function Toolbar() {
  const [view, setView] = useQueryState('view', viewParam)
  const [sidebarOpen, setSidebarOpen] = useQueryState('sidebar', sidebarParam)

  const supported = useWorkspaceStore((s) => s.supported)
  const { openFolder, openLooseFiles } = useProjectActions()
  const openSearch = useUiStore((s) => s.openSearch)

  const activeDoc = useDocumentsStore((s) =>
    s.activeDocId ? s.docs[s.activeDocId] : undefined,
  )
  const undo = useDocumentsStore((s) => s.undo)
  const redo = useDocumentsStore((s) => s.redo)
  const reset = useDocumentsStore((s) => s.reset)
  const canSave = Boolean(activeDoc && isDirty(activeDoc))
  const saveActive = useSaveActive()

  return (
    <header className="flex items-center gap-12 border-b border-soft-fog bg-warm-canvas px-16 py-12">
      <button
        type="button"
        aria-label={sidebarOpen ? 'Hide panel' : 'Show panel'}
        aria-pressed={sidebarOpen}
        onClick={() => setSidebarOpen((open) => !open)}
        className={cn(
          'flex size-32 shrink-0 items-center justify-center rounded-full transition-colors',
          sidebarOpen
            ? 'bg-ash-mist text-ink'
            : 'text-steel hover:bg-ash-mist hover:text-ink',
        )}
      >
        <SidebarIcon />
      </button>

      <div className="flex items-baseline gap-8">
        <span className="text-subheading leading-subheading font-semibold tracking-heading text-ink">
          markdown
        </span>
        <span className="text-caption leading-caption font-medium text-steel">
          editor
        </span>
      </div>

      <div className="ml-auto flex items-center gap-8">
        <ViewSwitcher view={view} onChange={(mode) => setView(mode)} />
        {view !== 'preview' && activeDoc ? (
          <div className="flex items-center gap-2">
            <ToolbarIconButton
              label="Undo (Ctrl/Cmd+Z)"
              disabled={!canUndo(activeDoc)}
              onClick={() => undo(activeDoc.id)}
            >
              <UndoIcon />
            </ToolbarIconButton>
            <ToolbarIconButton
              label="Redo (Ctrl/Cmd+Shift+Z)"
              disabled={!canRedo(activeDoc)}
              onClick={() => redo(activeDoc.id)}
            >
              <RedoIcon />
            </ToolbarIconButton>
            <ToolbarIconButton
              label="Reset to saved"
              disabled={!isDirty(activeDoc)}
              onClick={() => reset(activeDoc.id)}
            >
              <ResetIcon />
            </ToolbarIconButton>
          </div>
        ) : null}
        <ToolbarIconButton
          label="Search (Ctrl/Cmd+K)"
          onClick={() => openSearch('files')}
        >
          <SearchIcon />
        </ToolbarIconButton>
        <ThemeToggle />
        <Button
          variant="secondary"
          icon={<SaveIcon />}
          disabled={!canSave}
          onClick={() => void saveActive()}
        >
          Save
        </Button>
        <Menu
          align="right"
          trigger={({ toggle, open }) => (
            <Button
              variant="primary"
              icon={<FolderIcon />}
              disabled={!supported}
              onClick={toggle}
              aria-haspopup="menu"
              aria-expanded={open}
              title={supported ? undefined : 'Use Chrome or Edge'}
            >
              <span className="flex items-center gap-8">
                Open
                <ChevronDownIcon width={14} height={14} />
              </span>
            </Button>
          )}
        >
          {({ close }) => (
            <>
              <MenuItem
                icon={<FolderOpenIcon width={16} height={16} />}
                onClick={() => {
                  close()
                  void openFolder()
                }}
              >
                Open folder…
              </MenuItem>
              <MenuItem
                icon={<FileTextIcon width={16} height={16} />}
                onClick={() => {
                  close()
                  void openLooseFiles()
                }}
              >
                Open files…
              </MenuItem>
            </>
          )}
        </Menu>
      </div>
    </header>
  )
}

const themeMeta: Record<ThemeMode, { label: string; icon: typeof SunIcon }> = {
  system: { label: 'Theme: system', icon: MonitorIcon },
  light: { label: 'Theme: light', icon: SunIcon },
  dark: { label: 'Theme: dark', icon: MoonIcon },
}

interface ToolbarIconButtonProps {
  label: string
  disabled?: boolean
  onClick: () => void
  children: ReactNode
}

function ToolbarIconButton({
  label,
  disabled,
  onClick,
  children,
}: ToolbarIconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="flex size-32 shrink-0 items-center justify-center rounded-full text-steel transition-colors enabled:hover:bg-ash-mist enabled:hover:text-ink disabled:cursor-not-allowed disabled:opacity-30"
    >
      {children}
    </button>
  )
}

function ThemeToggle() {
  const { mode, cycle } = useTheme()
  const { label, icon: Icon } = themeMeta[mode]

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={`${label}. Click to change.`}
      title={label}
      className="flex size-32 shrink-0 items-center justify-center rounded-full text-steel transition-colors hover:bg-ash-mist hover:text-ink"
    >
      <Icon />
    </button>
  )
}

interface ViewSwitcherProps {
  view: ViewMode
  onChange: (mode: ViewMode) => void
}

function ViewSwitcher({ view, onChange }: ViewSwitcherProps) {
  return (
    <div className="flex items-center gap-4 rounded-full bg-ash-mist p-4">
      {VIEW_MODES.map((mode) => {
        const { label, icon: Icon } = viewMeta[mode]
        const active = view === mode
        return (
          <button
            key={mode}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(mode)}
            className={cn(
              'relative flex items-center gap-8 rounded-full px-12 py-4',
              'text-body leading-body font-medium transition-colors',
              active ? 'text-ink' : 'text-steel hover:text-graphite',
            )}
          >
            {active ? (
              <motion.span
                layoutId="view-pill"
                className="absolute inset-0 rounded-full bg-pure-white shadow-subtle-2"
                transition={{ type: 'spring', stiffness: 520, damping: 34 }}
              />
            ) : null}
            <span className="relative flex items-center gap-8">
              <Icon width={15} height={15} />
              {label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
