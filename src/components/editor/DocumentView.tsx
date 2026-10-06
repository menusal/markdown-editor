import { useQueryState } from 'nuqs'

import { viewParam } from '@/lib/url'
import { useDocumentsStore } from '@/store/documents'
import { EditorPane } from '@/components/editor/EditorPane'
import { EmptyState } from '@/components/ui/EmptyState'
import { PreviewPane } from '@/components/editor/PreviewPane'
import { SplitView } from '@/components/editor/SplitView'
import { CodeIcon } from '@/components/ui/icons'

export function DocumentView() {
  const [view] = useQueryState('view', viewParam)
  const hasActive = useDocumentsStore((s) => Boolean(s.activeDocId))

  if (!hasActive) {
    return (
      <EmptyState
        icon={<CodeIcon width={28} height={28} />}
        title="Select a file"
        description="Pick a markdown file from the left panel to view and edit it."
      />
    )
  }

  if (view === 'editor') return <EditorPane />
  if (view === 'preview') return <PreviewPane />
  return <SplitView />
}
