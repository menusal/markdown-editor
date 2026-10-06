import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { StatusBar } from '@/components/layout/StatusBar'
import { useDocumentsStore } from '@/store/documents'

beforeEach(() => {
  useDocumentsStore.setState({ docs: {}, order: [], activePath: null })
})

describe('StatusBar', () => {
  it('credits the author and links to the GitHub repository', () => {
    render(<StatusBar />)

    const link = screen.getByRole('link', { name: /github/i })
    expect(link).toHaveAttribute(
      'href',
      'https://github.com/menusal/markdown-editor',
    )
    expect(link).toHaveAttribute('target', '_blank')
  })
})
