export interface TextMatch {
  /** 1-based line number. */
  line: number
  /** Trimmed line excerpt. */
  text: string
}

/**
 * Finds case-insensitive substring occurrences line by line. `needle` must be
 * already lower-cased. At most `maxPerFile` matches are returned per file.
 */
export function findMatches(
  content: string,
  needle: string,
  maxPerFile = 20,
): TextMatch[] {
  if (!needle) return []
  const lines = content.split('\n')
  const matches: TextMatch[] = []

  for (let i = 0; i < lines.length; i += 1) {
    if (lines[i].toLowerCase().includes(needle)) {
      matches.push({ line: i + 1, text: lines[i].trim().slice(0, 200) })
      if (matches.length >= maxPerFile) break
    }
  }

  return matches
}
