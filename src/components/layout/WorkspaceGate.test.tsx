import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { WorkspaceGate } from '@/components/layout/WorkspaceGate'
import { useWorkspaceStore } from '@/store/workspace'

beforeEach(() => {
  useWorkspaceStore.setState({
    supported: false,
    status: 'idle',
    error: null,
    rootName: null,
    rootHandle: null,
    tree: [],
    expanded: {},
  })
})

describe('WorkspaceGate home', () => {
  it('shows a browser compatibility notice when unsupported', () => {
    render(<WorkspaceGate />)

    expect(screen.getByRole('alert')).toHaveTextContent(/browser isn't supported/i)
    expect(screen.getByRole('button', { name: /open folder/i })).toBeDisabled()
  })

  it('hides the notice on supported browsers', () => {
    useWorkspaceStore.setState({ supported: true })

    render(<WorkspaceGate />)

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /open folder/i })).toBeEnabled()
  })
})
