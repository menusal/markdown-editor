import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { Sidebar } from '@/components/sidebar/Sidebar'
import { useDocumentsStore } from '@/store/documents'
import { useWorkspaceStore, type Project } from '@/store/workspace'
import { renderWithNuqs } from '@/test/render'

const project: Project = {
  id: 'p1',
  name: 'Docs',
  kind: 'files',
  source: { kind: 'files', entries: [] },
  tree: [],
  expanded: {},
  index: [
    { id: 'plan.md', name: 'plan.md', title: 'Plan' },
    { id: 'notes/ideas.md', name: 'ideas.md', title: 'Ideas' },
    { id: 'design/testplan.md', name: 'testplan.md', title: 'Test plan' },
  ],
}

beforeEach(() => {
  useWorkspaceStore.setState({
    projects: [project],
    activeProjectId: 'p1',
    status: 'ready',
  })
  useDocumentsStore.setState({
    docs: {},
    order: [],
    activeDocId: null,
    lastActiveByProject: {},
  })
})

describe('Sidebar file search', () => {
  it('shows the files whose name contains the query', () => {
    renderWithNuqs(<Sidebar />)

    fireEvent.change(screen.getByLabelText('Search files'), {
      target: { value: 'test' },
    })

    expect(
      screen.getByRole('button', { name: /testplan\.md/ }),
    ).toBeInTheDocument()
    expect(screen.queryByText(/ideas\.md/)).not.toBeInTheDocument()
    expect(screen.getByText('1 match')).toBeInTheDocument()
  })

  it('matches case-insensitively by partial name', () => {
    renderWithNuqs(<Sidebar />)

    fireEvent.change(screen.getByLabelText('Search files'), {
      target: { value: 'PLAN' },
    })

    expect(
      screen.getByRole('button', { name: 'plan.md' }),
    ).toBeInTheDocument()
    expect(screen.getByText('2 matches')).toBeInTheDocument()
  })

  it('restores the tree when the query is cleared', () => {
    renderWithNuqs(<Sidebar />)
    const input = screen.getByLabelText('Search files')

    fireEvent.change(input, { target: { value: 'test' } })
    fireEvent.click(screen.getByLabelText('Clear search'))

    expect(
      screen.queryByRole('button', { name: /testplan\.md/ }),
    ).not.toBeInTheDocument()
    expect(screen.getByText('3 files .md')).toBeInTheDocument()
  })
})
