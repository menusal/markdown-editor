/**
 * Lightweight fuzzy matcher. Returns a score (higher is better) or null when
 * the query is not a subsequence of the target.
 *
 * - contiguous matches and matches near the start score higher
 * - matching the basename (after the last `/`) gets a bonus
 */
export function fuzzyScore(query: string, target: string): number | null {
  if (!query) return 0
  const q = query.toLowerCase()
  const t = target.toLowerCase()

  let score = 0
  let ti = 0
  let lastMatch = -1

  for (let qi = 0; qi < q.length; qi += 1) {
    const ch = q[qi]
    let found = -1
    for (let i = ti; i < t.length; i += 1) {
      if (t[i] === ch) {
        found = i
        break
      }
    }
    if (found === -1) return null

    // Consecutive characters are rewarded; gaps penalised.
    if (found === lastMatch + 1) score += 8
    else score += 2
    // Early matches score higher.
    score -= Math.min(found, 12) * 0.1

    lastMatch = found
    ti = found + 1
  }

  // Exact / prefix / substring bonuses.
  if (t === q) score += 50
  else if (t.startsWith(q)) score += 25
  else if (t.includes(q)) score += 12

  const slash = t.lastIndexOf('/')
  if (slash >= 0) {
    const base = t.slice(slash + 1)
    if (base.includes(q) || q.split('').every((c) => base.includes(c))) score += 6
  }

  // Prefer shorter targets.
  score -= t.length * 0.02

  return score
}

export interface ScoredItem<T> {
  item: T
  score: number
}

export function rankByFuzzy<T>(
  query: string,
  items: T[],
  keys: (item: T) => string[],
  limit = 50,
): ScoredItem<T>[] {
  if (!query) {
    return items.slice(0, limit).map((item) => ({ item, score: 0 }))
  }

  const scored: ScoredItem<T>[] = []
  for (const item of items) {
    let best: number | null = null
    for (const key of keys(item)) {
      const score = fuzzyScore(query, key)
      if (score !== null && (best === null || score > best)) best = score
    }
    if (best !== null) scored.push({ item, score: best })
  }

  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, limit)
}
