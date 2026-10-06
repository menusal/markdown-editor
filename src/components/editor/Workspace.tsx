import { useDocumentsStore } from '@/store/documents'
import { DocumentView } from '@/components/editor/DocumentView'
import { TabBar } from '@/components/editor/TabBar'

export function Workspace() {
  const hasActive = useDocumentsStore((s) => Boolean(s.activeDocId))

  return (
    <div className="flex h-full min-h-0 flex-col">
      {hasActive ? <TabBar /> : null}
      <div className="min-h-0 flex-1">
        <DocumentView />
      </div>
    </div>
  )
}
