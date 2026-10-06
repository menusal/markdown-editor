import { fireEvent, render, screen } from '@testing-library/react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { describe, expect, it, vi } from 'vitest'

import { createMarkdownComponents } from '@/lib/markdown/components'

const MARKDOWN = '# Tasks\n\n- [ ] first\n- [x] second\n'

function renderTasks(onToggleTask?: (line: number, checked: boolean) => void) {
  const components = createMarkdownComponents({ onToggleTask })
  return render(
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {MARKDOWN}
    </ReactMarkdown>,
  )
}

describe('createMarkdownComponents task lists', () => {
  it('renders enabled (interactive) checkboxes', () => {
    renderTasks(vi.fn())

    const checkboxes = screen.getAllByRole('checkbox')
    expect(checkboxes).toHaveLength(2)
    expect(checkboxes[0]).not.toBeDisabled()
    expect(checkboxes[1]).not.toBeDisabled()
  })

  it('reports the source line and new state when toggled', () => {
    const onToggleTask = vi.fn()
    renderTasks(onToggleTask)

    const [first, second] = screen.getAllByRole('checkbox')

    fireEvent.click(first)
    expect(onToggleTask).toHaveBeenLastCalledWith(3, true)

    fireEvent.click(second)
    expect(onToggleTask).toHaveBeenLastCalledWith(4, false)
  })

  it('falls back to a disabled checkbox when no handler is provided', () => {
    renderTasks(undefined)

    for (const checkbox of screen.getAllByRole('checkbox')) {
      expect(checkbox).toBeDisabled()
    }
  })
})
