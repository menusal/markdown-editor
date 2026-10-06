import { useProjectActions } from '@/hooks/useProjectActions'
import { useWorkspaceStore } from '@/store/workspace'
import { Menu, MenuItem } from '@/components/ui/Menu'
import {
  ChevronDownIcon,
  CloseIcon,
  FileTextIcon,
  FolderIcon,
  FolderOpenIcon,
} from '@/components/ui/icons'

export function ProjectSwitcher() {
  const projects = useWorkspaceStore((s) => s.projects)
  const activeProjectId = useWorkspaceStore((s) => s.activeProjectId)
  const active = projects.find((p) => p.id === activeProjectId) ?? null
  const { openFolder, openLooseFiles, selectProject, requestRemove } =
    useProjectActions()

  return (
    <Menu
      className="min-w-0 flex-1"
      trigger={({ toggle, open }) => (
        <button
          type="button"
          onClick={toggle}
          aria-haspopup="menu"
          aria-expanded={open}
          className="flex w-full items-center gap-8 rounded-lg px-8 py-6 text-left transition-colors hover:bg-ash-mist"
        >
          {active?.kind === 'files' ? (
            <FileTextIcon width={15} height={15} className="shrink-0 text-steel" />
          ) : (
            <FolderIcon width={15} height={15} className="shrink-0 text-steel" />
          )}
          <span className="truncate text-body leading-body font-medium text-ink">
            {active?.name ?? 'No project'}
          </span>
          <ChevronDownIcon
            width={15}
            height={15}
            className="ml-auto shrink-0 text-silver"
          />
        </button>
      )}
    >
      {({ close }) => (
        <>
          {projects.length > 0 ? (
            <p className="px-12 py-4 text-caption leading-caption font-medium tracking-body text-silver uppercase">
              Projects
            </p>
          ) : null}

          {projects.map((project) => (
            <MenuItem
              key={project.id}
              active={project.id === activeProjectId}
              icon={
                project.kind === 'files' ? (
                  <FileTextIcon width={16} height={16} />
                ) : (
                  <FolderIcon width={16} height={16} />
                )
              }
              onClick={() => {
                close()
                selectProject(project.id)
              }}
            >
              {project.name}
            </MenuItem>
          ))}

          <div className="my-4 h-px bg-soft-fog" />

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

          {active ? (
            <>
              <div className="my-4 h-px bg-soft-fog" />
              <MenuItem
                danger
                icon={<CloseIcon width={16} height={16} />}
                onClick={() => {
                  close()
                  void requestRemove(active.id, active.name)
                }}
              >
                Remove “{active.name}”
              </MenuItem>
            </>
          ) : null}
        </>
      )}
    </Menu>
  )
}
