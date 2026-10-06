import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useUiStore } from '@/store/ui'

function open(request: { title: string; resolve: (v: boolean) => void }) {
  useUiStore.setState({
    confirmRequest: {
      id: '1',
      title: request.title,
      description: 'Some consequences.',
      confirmLabel: 'Remove project',
      danger: true,
      resolve: request.resolve,
    },
  })
}

beforeEach(() => {
  useUiStore.setState({ confirmRequest: null })
})

describe('ConfirmDialog', () => {
  it('renders the request and resolves true on confirm', () => {
    const resolve = vi.fn()
    open({ title: 'Remove "docs"?', resolve })

    render(<ConfirmDialog />)

    expect(screen.getByRole('dialog')).toHaveTextContent('Remove "docs"?')
    fireEvent.click(screen.getByRole('button', { name: /remove project/i }))

    expect(resolve).toHaveBeenCalledWith(true)
    expect(useUiStore.getState().confirmRequest).toBeNull()
  })

  it('resolves false on cancel', () => {
    const resolve = vi.fn()
    open({ title: 'Close "a.md"?', resolve })

    render(<ConfirmDialog />)

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))

    expect(resolve).toHaveBeenCalledWith(false)
  })

  it('renders nothing without a request', () => {
    render(<ConfirmDialog />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
