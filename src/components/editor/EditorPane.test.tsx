import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Replace the real editor with a stub so we can assert the container props
// without mounting CodeMirror in jsdom.
vi.mock('@uiw/react-codemirror', () => ({
  default: ({ className }: { className?: string }) => (
    <div data-testid="codemirror" className={className} />
  ),
}))

import { EditorPane } from '@/components/editor/EditorPane'
import { makeDocId, useDocumentsStore } from '@/store/documents'

const PROJECT_ID = 'p1'
const NODE_ID = 'plan.md'
const DOC_ID = makeDocId(PROJECT_ID, NODE_ID)

describe('EditorPane', () => {
  beforeEach(() => {
    useDocumentsStore.setState({
      docs: {
        [DOC_ID]: {
          id: DOC_ID,
          projectId: PROJECT_ID,
          nodeId: NODE_ID,
          name: 'plan.md',
          handle: {} as FileSystemFileHandle,
          content: '# Plan',
          savedContent: '# Plan',
          past: [],
          future: [],
          lastEditAt: 0,
        },
      },
      order: [DOC_ID],
      activeDocId: DOC_ID,
      lastActiveByProject: { [PROJECT_ID]: DOC_ID },
    })
  })

  it('gives the CodeMirror container a definite height so it can scroll', () => {
    render(<EditorPane />)

    // Without a height on this wrapper the internal `.cm-editor` (height:100%)
    // collapses against an auto-height parent and the editor never scrolls.
    expect(screen.getByTestId('codemirror')).toHaveClass('h-full')
  })
})
