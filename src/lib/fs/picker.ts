const MARKDOWN_TYPES = [
  {
    description: 'Markdown',
    accept: { 'text/markdown': ['.md', '.markdown'] },
  },
]

export function isFileSystemAccessSupported(): boolean {
  if (typeof window === 'undefined' || !('showDirectoryPicker' in window)) {
    return false
  }
  // Safari exposes the picker but cannot write files (no createWritable), so
  // requiring it keeps the "unsupported browser" notice honest.
  return (
    typeof FileSystemFileHandle !== 'undefined' &&
    typeof FileSystemFileHandle.prototype.createWritable === 'function'
  )
}

export async function pickDirectory(): Promise<FileSystemDirectoryHandle> {
  return window.showDirectoryPicker({
    id: 'md-editor',
    mode: 'readwrite',
  })
}

export async function pickFiles(): Promise<FileSystemFileHandle[]> {
  return window.showOpenFilePicker({
    id: 'md-editor-files',
    multiple: true,
    types: MARKDOWN_TYPES,
  })
}

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}
