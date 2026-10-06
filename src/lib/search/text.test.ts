import { describe, expect, it } from 'vitest'

import { findMatches } from '@/lib/search/text'

describe('findMatches', () => {
  const content = [
    '# Plan',
    '',
    'First task about the plan.',
    'Nothing here.',
    'Second PLAN mention.',
  ].join('\n')

  it('finds case-insensitive matches with 1-based line numbers', () => {
    expect(findMatches(content, 'plan')).toEqual([
      { line: 1, text: '# Plan' },
      { line: 3, text: 'First task about the plan.' },
      { line: 5, text: 'Second PLAN mention.' },
    ])
  })

  it('returns nothing for an empty needle', () => {
    expect(findMatches(content, '')).toEqual([])
  })

  it('caps matches per file', () => {
    const many = Array.from({ length: 10 }, () => 'hit').join('\n')
    expect(findMatches(many, 'hit', 3)).toHaveLength(3)
  })
})
