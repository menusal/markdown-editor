import { describe, expect, it } from 'vitest'

import { fuzzyScore, rankByFuzzy } from '@/lib/search/fuzzy'

describe('fuzzyScore', () => {
  it('returns null when the query is not a subsequence', () => {
    expect(fuzzyScore('xyz', 'plan.md')).toBeNull()
  })

  it('matches subsequences and ranks exact/prefix/substring higher', () => {
    const exact = fuzzyScore('plan', 'plan')
    const prefix = fuzzyScore('plan', 'plan-2026')
    const substring = fuzzyScore('plan', 'my-plan')
    const subsequence = fuzzyScore('pln', 'plan')

    expect(exact).not.toBeNull()
    expect(prefix).not.toBeNull()
    expect(substring).not.toBeNull()
    expect(subsequence).not.toBeNull()

    expect(exact!).toBeGreaterThan(prefix!)
    expect(prefix!).toBeGreaterThan(substring!)
    expect(substring!).toBeGreaterThan(subsequence!)
  })

  it('returns 0 for an empty query', () => {
    expect(fuzzyScore('', 'anything')).toBe(0)
  })
})

describe('rankByFuzzy', () => {
  const items = [
    { title: 'Roadmap', path: 'plans/roadmap.md' },
    { title: 'Notes', path: 'notes/meeting.md' },
    { title: 'Plan', path: 'plan.md' },
  ]

  it('returns all items (capped) for an empty query', () => {
    expect(rankByFuzzy('', items, (i) => [i.title])).toHaveLength(3)
  })

  it('filters out non-matches and orders by score', () => {
    const result = rankByFuzzy('plan', items, (i) => [i.title, i.path])
    expect(result.map((r) => r.item.title)).toEqual(['Plan', 'Roadmap'])
  })

  it('respects the limit', () => {
    expect(rankByFuzzy('', items, (i) => [i.title], 2)).toHaveLength(2)
  })
})
