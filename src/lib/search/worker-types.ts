export interface SearchFileHandle {
  id: string
  name: string
  handle: FileSystemFileHandle
}

export interface SearchRequest {
  requestId: number
  query: string
  files: SearchFileHandle[]
  maxFileSize: number
  maxResults: number
  maxFiles: number
}

export interface SearchMatch {
  line: number
  text: string
}

export interface SearchGroup {
  id: string
  name: string
  matches: SearchMatch[]
}

export interface SearchResponse {
  requestId: number
  groups: SearchGroup[]
  totalMatches: number
  scanned: number
  truncated: boolean
}
