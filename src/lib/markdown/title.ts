/** Extracts the first level-1 heading as a title, or falls back. */
export function extractTitle(content: string, fallback: string): string {
  const match = content.match(/^\s*#\s+(.+?)\s*$/m)
  return match ? match[1].trim() : fallback
}
