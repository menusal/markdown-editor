import { describe, expect, it } from 'vitest'

import { extractTitle } from '@/lib/markdown/title'

describe('extractTitle', () => {
  it('uses the first level-1 heading', () => {
    expect(extractTitle('# Roadmap\n\ntext', 'roadmap.md')).toBe('Roadmap')
  })

  it('ignores headings after the first block when none is level 1', () => {
    expect(extractTitle('## Section\n# Real Title', 'file.md')).toBe('Real Title')
  })

  it('falls back to the given name', () => {
    expect(extractTitle('no heading here', 'file.md')).toBe('file.md')
  })
})
