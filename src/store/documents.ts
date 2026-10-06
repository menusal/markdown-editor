import { create } from 'zustand'

import { readFileText, writeFileText } from '@/lib/fs/file'
import type { TreeNode } from '@/lib/fs/types'

export interface EditorDocument {
  path: string
  name: string
  handle: FileSystemFileHandle
  content: string
  savedContent: string
}

interface DocumentsState {
  docs: Record<string, EditorDocument>
  order: string[]
  activePath: string | null

  open: (node: TreeNode) => Promise<void>
  activate: (path: string) => void
  close: (path: string) => void
  closeAll: () => void
  updateContent: (path: string, content: string) => void
  save: (path: string) => Promise<void>
  revert: (path: string) => void
}

export function isDirty(doc: EditorDocument): boolean {
  return doc.content !== doc.savedContent
}

export function hasUnsavedChanges(docs: Record<string, EditorDocument>): boolean {
  return Object.values(docs).some(isDirty)
}

export const useDocumentsStore = create<DocumentsState>((set, get) => ({
  docs: {},
  order: [],
  activePath: null,

  open: async (node) => {
    const existing = get().docs[node.path]
    if (existing) {
      set({ activePath: node.path })
      return
    }

    const handle = node.handle as FileSystemFileHandle
    const content = await readFileText(handle)
    set((state) => ({
      docs: {
        ...state.docs,
        [node.path]: {
          path: node.path,
          name: node.name,
          handle,
          content,
          savedContent: content,
        },
      },
      order: state.order.includes(node.path)
        ? state.order
        : [...state.order, node.path],
      activePath: node.path,
    }))
  },

  activate: (path) => {
    if (get().docs[path]) set({ activePath: path })
  },

  close: (path) =>
    set((state) => {
      const rest = { ...state.docs }
      delete rest[path]
      const order = state.order.filter((p) => p !== path)
      let activePath = state.activePath
      if (activePath === path) {
        const index = state.order.indexOf(path)
        activePath = order[index] ?? order[index - 1] ?? null
      }
      return { docs: rest, order, activePath }
    }),

  closeAll: () => set({ docs: {}, order: [], activePath: null }),

  updateContent: (path, content) =>
    set((state) => {
      const doc = state.docs[path]
      if (!doc) return state
      return { docs: { ...state.docs, [path]: { ...doc, content } } }
    }),

  save: async (path) => {
    const doc = get().docs[path]
    if (!doc) return
    await writeFileText(doc.handle, doc.content)
    set((state) => ({
      docs: {
        ...state.docs,
        [path]: { ...doc, savedContent: doc.content },
      },
    }))
  },

  revert: (path) =>
    set((state) => {
      const doc = state.docs[path]
      if (!doc) return state
      return { docs: { ...state.docs, [path]: { ...doc, content: doc.savedContent } } }
    }),
}))
