const TASK_MARKER = /^(\s*(?:[-*+]|\d+[.)])\s+\[)( |x|X)(\])/

/**
 * Flips the checkbox on a specific source line of a markdown document.
 * `line` is 1-based, matching the `position.start.line` reported by remark.
 * Returns the original content when the line does not contain a task marker.
 */
export function setTaskAtLine(
  content: string,
  line: number,
  checked: boolean,
): string {
  const lines = content.split('\n')
  const index = line - 1
  if (index < 0 || index >= lines.length) return content

  const match = lines[index].match(TASK_MARKER)
  if (!match) return content

  const marker = checked ? 'x' : ' '
  lines[index] = lines[index].replace(TASK_MARKER, `$1${marker}$3`)
  return lines.join('\n')
}
