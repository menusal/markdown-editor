import { findMatches } from '@/lib/search/text'
import type {
  SearchGroup,
  SearchRequest,
  SearchResponse,
} from '@/lib/search/worker-types'

const ctx = self as unknown as {
  onmessage: ((event: MessageEvent<SearchRequest>) => void) | null
  postMessage: (message: SearchResponse) => void
}

ctx.onmessage = async (event) => {
  const { requestId, query, files, maxFileSize, maxResults, maxFiles } =
    event.data

  const needle = query.trim().toLowerCase()
  const groups: SearchGroup[] = []
  let totalMatches = 0
  let scanned = 0
  let truncated = false

  if (needle) {
    for (const file of files) {
      if (totalMatches >= maxResults || groups.length >= maxFiles) {
        truncated = true
        break
      }
      try {
        const blob = await file.handle.getFile()
        if (blob.size > maxFileSize) continue
        const text = await blob.text()
        scanned += 1
        const matches = findMatches(text, needle)
        if (matches.length > 0) {
          groups.push({ id: file.id, name: file.name, matches })
          totalMatches += matches.length
        }
      } catch {
        // Ignore files that can't be read.
      }
    }
  }

  ctx.postMessage({ requestId, groups, totalMatches, scanned, truncated })
}
