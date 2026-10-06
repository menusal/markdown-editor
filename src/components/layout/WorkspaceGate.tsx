import { useWorkspaceStore } from '@/store/workspace'
import { Workspace } from '@/components/editor/Workspace'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { FolderIcon, SpinnerIcon } from '@/components/ui/icons'

export function WorkspaceGate() {
  const status = useWorkspaceStore((s) => s.status)
  const error = useWorkspaceStore((s) => s.error)
  const supported = useWorkspaceStore((s) => s.supported)
  const rootName = useWorkspaceStore((s) => s.rootName)
  const openDirectory = useWorkspaceStore((s) => s.openDirectory)
  const resume = useWorkspaceStore((s) => s.resume)

  if (status === 'loading') {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-16 text-steel">
        <SpinnerIcon width={28} height={28} className="text-resolve-green" />
        <p className="text-body leading-body font-medium">Reading folder…</p>
      </div>
    )
  }

  if (status === 'needs-permission') {
    return (
      <EmptyState
        icon={<FolderIcon width={28} height={28} />}
        title={rootName ? `Reopen ${rootName}` : 'Reopen folder'}
        description="The browser needs you to confirm access to this folder again."
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
        description={error ?? 'Could not access the folder.'}
        action={
          <Button
            variant="primary"
            icon={<FolderIcon />}
            onClick={() => void openDirectory()}
          >
            Open folder
          </Button>
        }
      />
    )
  }

  if (status === 'ready') return <Workspace />

  return (
    <EmptyState
      icon={<FolderIcon width={28} height={28} />}
      title="Review plans and SDD. Edit markdown locally."
      description="A local-first editor to read, review and edit your markdown — plans, specs and SDD docs. Open a folder to browse its .md files; everything stays on your machine, nothing is uploaded."
      action={
        <Button
          variant="primary"
          icon={<FolderIcon />}
          disabled={!supported}
          onClick={() => void openDirectory()}
          title={supported ? undefined : 'Use Chrome or Edge'}
        >
          Open folder
        </Button>
      }
    />
  )
}
