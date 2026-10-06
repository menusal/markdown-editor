import { create } from 'zustand'

import { readFileText, writeFileText } from '@/lib/fs/file'
import { extractTitle } from '@/lib/markdown/title'
import type { TreeNode } from '@/lib/fs/types'
import { useWorkspaceStore } from '@/store/workspace'

/** Consecutive edits within this window are coalesced into a single undo step. */
export const HISTORY_COALESCE_MS = 500
/** Maximum number of undo steps kept per document. */
export const HISTORY_LIMIT = 200

export function makeDocId(projectId: string, nodeId: string): string {
  return `${projectId}:${nodeId}`
}

export interface EditorDocument {
  /** Globally unique id: `${projectId}:${nodeId}`. */
  id: string
  projectId: string
  /** Node id within the project (relative path or loose-file id). */
  nodeId: string
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
  /** Open document ids, in tab order (across all projects). */
  order: string[]
  activeDocId: string | null
  /** Last active document per project, to restore it when switching back. */
  lastActiveByProject: Record<string, string | null>
  /** A line to reveal in the editor once the document is active. */
  pendingReveal: { docId: string; line: number } | null

  open: (projectId: string, node: TreeNode) => Promise<void>
  activate: (docId: string) => void
  close: (docId: string) => void
  closeProject: (projectId: string) => void
  closeAll: () => void
  setActiveProject: (projectId: string | null) => void
  updateContent: (docId: string, content: string) => void
  save: (docId: string) => Promise<void>
  undo: (docId: string) => void
  redo: (docId: string) => void
  reset: (docId: string) => void
  revealLine: (docId: string, line: number) => void
  clearReveal: () => void
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

/** Ids of the documents belonging to a project, in tab order. */
export function projectDocIds(
  order: string[],
  docs: Record<string, EditorDocument>,
  projectId: string,
): string[] {
  return order.filter((id) => docs[id]?.projectId === projectId)
}

function trimHistory(entries: string[]): string[] {
  return entries.length > HISTORY_LIMIT
    ? entries.slice(entries.length - HISTORY_LIMIT)
    : entries
}

export const useDocumentsStore = create<DocumentsState>((set, get) => ({
  docs: {},
  order: [],
  activeDocId: null,
  lastActiveByProject: {},
  pendingReveal: null,

  open: async (projectId, node) => {
    const docId = makeDocId(projectId, node.id)
    const existing = get().docs[docId]
    if (existing) {
      get().activate(docId)
      return
    }

    const handle = node.handle as FileSystemFileHandle
    const content = await readFileText(handle)
    useWorkspaceStore
      .getState()
      .setFileTitle(projectId, node.id, extractTitle(content, node.name))
    set((state) => ({
      docs: {
        ...state.docs,
        [docId]: {
          id: docId,
          projectId,
          nodeId: node.id,
          name: node.name,
          handle,
          content,
          savedContent: content,
          past: [],
          future: [],
          lastEditAt: 0,
        },
      },
      order: state.order.includes(docId) ? state.order : [...state.order, docId],
      activeDocId: docId,
      lastActiveByProject: { ...state.lastActiveByProject, [projectId]: docId },
    }))
  },

  activate: (docId) =>
    set((state) => {
      const doc = state.docs[docId]
      if (!doc) return state
      return {
        activeDocId: docId,
        lastActiveByProject: {
          ...state.lastActiveByProject,
          [doc.projectId]: docId,
        },
      }
    }),

  close: (docId) =>
    set((state) => {
      const doc = state.docs[docId]
      if (!doc) return state

      const rest = { ...state.docs }
      delete rest[docId]
      const order = state.order.filter((id) => id !== docId)

      if (state.activeDocId !== docId) {
        return { docs: rest, order }
      }

      const siblings = state.order
        .filter((id) => state.docs[id]?.projectId === doc.projectId)
        .filter((id) => id !== docId)
      const index = state.order
        .filter((id) => state.docs[id]?.projectId === doc.projectId)
        .indexOf(docId)
      const next = siblings[index] ?? siblings[index - 1] ?? null

      return {
        docs: rest,
        order,
        activeDocId: next,
        lastActiveByProject: {
          ...state.lastActiveByProject,
          [doc.projectId]: next,
        },
      }
    }),

  closeProject: (projectId) =>
    set((state) => {
      const rest: Record<string, EditorDocument> = {}
      for (const [id, doc] of Object.entries(state.docs)) {
        if (doc.projectId !== projectId) rest[id] = doc
      }
      const order = state.order.filter((id) => rest[id])
      const lastActive = { ...state.lastActiveByProject }
      delete lastActive[projectId]
      const activeDocId =
        state.activeDocId && rest[state.activeDocId] ? state.activeDocId : null
      return { docs: rest, order, activeDocId, lastActiveByProject: lastActive }
    }),

  closeAll: () =>
    set({
      docs: {},
      order: [],
      activeDocId: null,
      lastActiveByProject: {},
      pendingReveal: null,
    }),

  setActiveProject: (projectId) =>
    set((state) => {
      if (!projectId) {
        const current = state.activeDocId
        if (current && state.docs[current]) return state
        return { activeDocId: null }
      }

      const current = state.activeDocId ? state.docs[state.activeDocId] : null
      if (current && current.projectId === projectId) return state

      const remembered = state.lastActiveByProject[projectId]
      const ids = projectDocIds(state.order, state.docs, projectId)
      const activeDocId =
        remembered && state.docs[remembered] ? remembered : (ids[0] ?? null)

      return { activeDocId }
    }),

  updateContent: (docId, content) =>
    set((state) => {
      const doc = state.docs[docId]
      if (!doc || doc.content === content) return state

      const now = Date.now()
      const startsNewStep = now - doc.lastEditAt > HISTORY_COALESCE_MS
      const past = startsNewStep ? trimHistory([...doc.past, doc.content]) : doc.past

      return {
        docs: {
          ...state.docs,
          [docId]: { ...doc, content, past, future: [], lastEditAt: now },
        },
      }
    }),

  save: async (docId) => {
    const doc = get().docs[docId]
    if (!doc) return
    await writeFileText(doc.handle, doc.content)
    set((state) => ({
      docs: {
        ...state.docs,
        [docId]: { ...doc, savedContent: doc.content },
      },
    }))
  },

  undo: (docId) =>
    set((state) => {
      const doc = state.docs[docId]
      if (!doc || doc.past.length === 0) return state

      const previous = doc.past[doc.past.length - 1]
      return {
        docs: {
          ...state.docs,
          [docId]: {
            ...doc,
            content: previous,
            past: doc.past.slice(0, -1),
            future: [doc.content, ...doc.future],
            lastEditAt: 0,
          },
        },
      }
    }),

  redo: (docId) =>
    set((state) => {
      const doc = state.docs[docId]
      if (!doc || doc.future.length === 0) return state

      const next = doc.future[0]
      return {
        docs: {
          ...state.docs,
          [docId]: {
            ...doc,
            content: next,
            past: trimHistory([...doc.past, doc.content]),
            future: doc.future.slice(1),
            lastEditAt: 0,
          },
        },
      }
    }),

  reset: (docId) =>
    set((state) => {
      const doc = state.docs[docId]
      if (!doc || doc.content === doc.savedContent) return state

      return {
        docs: {
          ...state.docs,
          [docId]: {
            ...doc,
            content: doc.savedContent,
            past: trimHistory([...doc.past, doc.content]),
            future: [],
            lastEditAt: 0,
          },
        },
      }
    }),

  revealLine: (docId, line) => set({ pendingReveal: { docId, line } }),

  clearReveal: () => set({ pendingReveal: null }),
}))
