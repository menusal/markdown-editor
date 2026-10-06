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
import { useDocumentsStore } from '@/store/documents'

describe('EditorPane', () => {
  beforeEach(() => {
    useDocumentsStore.setState({
      docs: {
        'plan.md': {
          path: 'plan.md',
          name: 'plan.md',
          handle: {} as FileSystemFileHandle,
          content: '# Plan',
          savedContent: '# Plan',
        },
      },
      order: ['plan.md'],
      activePath: 'plan.md',
    })
  })

  it('gives the CodeMirror container a definite height so it can scroll', () => {
    render(<EditorPane />)

    // Without a height on this wrapper the internal `.cm-editor` (height:100%)
    // collapses against an auto-height parent and the editor never scrolls.
    expect(screen.getByTestId('codemirror')).toHaveClass('h-full')
  })
})
