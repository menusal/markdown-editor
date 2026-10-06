import { useProjectActions } from '@/hooks/useProjectActions'
import {
  activeProject,
  useWorkspaceStore,
  type Project,
} from '@/store/workspace'
import { BrowserNotice } from '@/components/ui/BrowserNotice'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Workspace } from '@/components/editor/Workspace'
import {
  CloseIcon,
  FileTextIcon,
  FolderIcon,
  FolderOpenIcon,
  SpinnerIcon,
} from '@/components/ui/icons'

export function WorkspaceGate() {
  const status = useWorkspaceStore((s) => s.status)
  const error = useWorkspaceStore((s) => s.error)
  const supported = useWorkspaceStore((s) => s.supported)
  const projects = useWorkspaceStore((s) => s.projects)
  const project = useWorkspaceStore(activeProject)
  const resume = useWorkspaceStore((s) => s.resume)
  const { openFolder, openLooseFiles, selectProject, requestRemove } =
    useProjectActions()

  if (status === 'loading') {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-16 text-steel">
        <SpinnerIcon width={28} height={28} className="text-resolve-green" />
        <p className="text-body leading-body font-medium">Reading the project…</p>
      </div>
    )
  }

  if (status === 'needs-permission') {
    return (
      <EmptyState
        icon={<FolderIcon width={28} height={28} />}
        title={project ? `Reopen ${project.name}` : 'Reopen project'}
        description="The browser needs you to confirm access to this project again."
        action={
          <Button variant="primary" icon={<FolderIcon />} onClick={() => void resume()}>
            Resume access
          </Button>
        }
      />
    )
  }

  if (status === 'error') {
    return (
      <EmptyState
        icon={<FolderIcon width={28} height={28} />}
        title="Something went wrong"
        description={error ?? 'Could not access the project.'}
        action={
          <Button
            variant="primary"
            icon={<FolderOpenIcon />}
            onClick={() => void openFolder()}
          >
            Open folder
          </Button>
        }
      />
    )
  }

  if (status === 'ready') return <Workspace />

  return (
    <Home
      projects={projects}
      supported={supported}
      onOpenFolder={openFolder}
      onOpenFiles={openLooseFiles}
      onSelectProject={selectProject}
      onRemoveProject={requestRemove}
    />
  )
}

interface HomeProps {
  projects: Project[]
  supported: boolean
  onOpenFolder: () => Promise<void>
  onOpenFiles: () => Promise<void>
  onSelectProject: (id: string) => void
  onRemoveProject: (id: string, name: string) => Promise<void>
}

function Home({
  projects,
  supported,
  onOpenFolder,
  onOpenFiles,
  onSelectProject,
  onRemoveProject,
}: HomeProps) {
  return (
    <div className="scrollbar-thin h-full overflow-y-auto">
      <div className="mx-auto flex min-h-full max-w-[560px] flex-col items-center justify-center gap-24 px-32 py-48 text-center">
        <div className="flex size-64 items-center justify-center rounded-2xl bg-ash-mist text-ink">
          <FolderIcon width={28} height={28} />
        </div>

        <div className="space-y-8">
          <h2 className="text-heading leading-heading font-semibold tracking-heading text-ink">
            Review plans and SDD. Edit markdown locally.
          </h2>
          <p className="mx-auto max-w-[460px] text-body leading-body text-graphite">
            A local-first editor to read, review and edit your markdown — plans,
            specs and SDD docs. Open a folder or single files; everything stays on
            your machine, nothing is uploaded.
          </p>
        </div>

        {!supported ? <BrowserNotice /> : null}

        <div className="flex flex-wrap items-center justify-center gap-8">
          <Button
            variant="primary"
            icon={<FolderOpenIcon />}
            disabled={!supported}
            onClick={() => void onOpenFolder()}
            title={supported ? undefined : 'Use Chrome or Edge'}
          >
            Open folder
          </Button>
          <Button
            variant="secondary"
            icon={<FileTextIcon />}
            disabled={!supported}
            onClick={() => void onOpenFiles()}
          >
            Open files
          </Button>
        </div>

        {projects.length > 0 ? (
          <div className="w-full max-w-[420px] rounded-xl border border-soft-fog bg-pure-white p-8 text-left shadow-subtle-2">
            <p className="px-12 py-8 text-caption leading-caption font-medium tracking-body text-silver uppercase">
              Recent projects
            </p>
            {projects.map((project) => (
              <div
                key={project.id}
                className="group flex items-center gap-8 rounded-lg px-12 py-8 transition-colors hover:bg-ash-mist"
              >
                <button
                  type="button"
                  onClick={() => onSelectProject(project.id)}
                  className="flex min-w-0 flex-1 items-center gap-8 text-left text-body leading-body font-medium text-ink"
                >
                  {project.kind === 'files' ? (
                    <FileTextIcon width={16} height={16} className="text-steel" />
                  ) : (
                    <FolderIcon width={16} height={16} className="text-steel" />
                  )}
                  <span className="truncate">{project.name}</span>
                </button>
                <button
                  type="button"
                  aria-label={`Remove ${project.name}`}
                  onClick={() => void onRemoveProject(project.id, project.name)}
                  className="flex size-24 shrink-0 items-center justify-center rounded-full text-silver opacity-0 transition-opacity hover:bg-soft-fog hover:text-ink group-hover:opacity-100"
                >
                  <CloseIcon width={14} height={14} />
                </button>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}
