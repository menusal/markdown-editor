import { create } from 'zustand'

import { readFileText, writeFileText } from '@/lib/fs/file'
import type { TreeNode } from '@/lib/fs/types'

/** Consecutive edits within this window are coalesced into a single undo step. */
export const HISTORY_COALESCE_MS = 500
/** Maximum number of undo steps kept per document. */
export const HISTORY_LIMIT = 200

export interface EditorDocument {
  path: string
  name: string
  handle: FileSystemFileHandle
  content: string
  savedContent: string
  /** Undo stack: previous contents, oldest first. */
  past: string[]
  /** Redo stack: undone contents, next-to-redo first. */
  future: string[]
  /** Timestamp of the last edit, used to coalesce typing bursts. */
  lastEditAt: number
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
  undo: (path: string) => void
  redo: (path: string) => void
  reset: (path: string) => void
}

export function isDirty(doc: EditorDocument): boolean {
  return doc.content !== doc.savedContent
}

export function hasUnsavedChanges(docs: Record<string, EditorDocument>): boolean {
  return Object.values(docs).some(isDirty)
}

export function canUndo(doc: EditorDocument): boolean {
  return doc.past.length > 0
}

export function canRedo(doc: EditorDocument): boolean {
  return doc.future.length > 0
}

function trimHistory(entries: string[]): string[] {
  return entries.length > HISTORY_LIMIT
    ? entries.slice(entries.length - HISTORY_LIMIT)
    : entries
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
          past: [],
          future: [],
          lastEditAt: 0,
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
      if (!doc || doc.content === content) return state

      const now = Date.now()
      const startsNewStep = now - doc.lastEditAt > HISTORY_COALESCE_MS
      const past = startsNewStep ? trimHistory([...doc.past, doc.content]) : doc.past

      return {
        docs: {
          ...state.docs,
          [path]: { ...doc, content, past, future: [], lastEditAt: now },
        },
      }
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

  undo: (path) =>
    set((state) => {
      const doc = state.docs[path]
      if (!doc || doc.past.length === 0) return state

      const previous = doc.past[doc.past.length - 1]
      return {
        docs: {
          ...state.docs,
          [path]: {
            ...doc,
            content: previous,
            past: doc.past.slice(0, -1),
            future: [doc.content, ...doc.future],
            lastEditAt: 0,
          },
        },
      }
    }),

  redo: (path) =>
    set((state) => {
      const doc = state.docs[path]
      if (!doc || doc.future.length === 0) return state

      const next = doc.future[0]
      return {
        docs: {
          ...state.docs,
          [path]: {
            ...doc,
            content: next,
            past: trimHistory([...doc.past, doc.content]),
            future: doc.future.slice(1),
            lastEditAt: 0,
          },
        },
      }
    }),

  reset: (path) =>
    set((state) => {
      const doc = state.docs[path]
      if (!doc || doc.content === doc.savedContent) return state

      return {
        docs: {
          ...state.docs,
          [path]: {
            ...doc,
            content: doc.savedContent,
            past: trimHistory([...doc.past, doc.content]),
            future: [],
            lastEditAt: 0,
          },
        },
      }
    }),
}))
