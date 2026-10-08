import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/fs/file', () => ({
  readFileText: vi.fn().mockResolvedValue('remote'),
  writeFileText: vi.fn().mockResolvedValue(undefined),
}))

import { readFileText } from '@/lib/fs/file'
import {
  HISTORY_COALESCE_MS,
  canRedo,
  canUndo,
  makeDocId,
  projectDocIds,
  useDocumentsStore,
  type EditorDocument,
} from '@/store/documents'

const P1 = 'p1'
const P2 = 'p2'
const NODE = 'plan.md'
const ID = makeDocId(P1, NODE)

function seedDoc(
  projectId = P1,
  nodeId = NODE,
  content = 'A',
  savedContent = 'A',
) {
  const id = makeDocId(projectId, nodeId)
  const doc: EditorDocument = {
    id,
    projectId,
    nodeId,
    name: nodeId,
    handle: {} as FileSystemFileHandle,
    content,
    savedContent,
    past: [],
    future: [],
    lastEditAt: 0,
  }
  useDocumentsStore.setState({
    docs: { [id]: doc },
    order: [id],
    activeDocId: id,
    lastActiveByProject: { [projectId]: id },
  })
  return id
}

function doc(id = ID): EditorDocument {
  return useDocumentsStore.getState().docs[id]
}

let now = 1000

beforeEach(() => {
  now = 1000
  vi.spyOn(Date, 'now').mockImplementation(() => now)
  vi.mocked(readFileText).mockReset()
  vi.mocked(readFileText).mockResolvedValue('remote')
  useDocumentsStore.setState({
    docs: {},
    order: [],
    activeDocId: null,
    lastActiveByProject: {},
  })
  seedDoc()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('documents history', () => {
  it('pushes a history step and undoes/redoes an edit', () => {
    const store = useDocumentsStore.getState()
    store.updateContent(ID, 'AB')

    expect(doc().past).toEqual(['A'])

    store.undo(ID)
    expect(doc().content).toBe('A')

    store.redo(ID)
    expect(doc().content).toBe('AB')
  })

  it('coalesces rapid edits into a single undo step', () => {
    const store = useDocumentsStore.getState()
    store.updateContent(ID, 'AB')
    now += HISTORY_COALESCE_MS - 100
    store.updateContent(ID, 'ABC')

    expect(doc().past).toEqual(['A'])

    store.undo(ID)
    expect(doc().content).toBe('A')
  })

  it('starts a new undo step after the coalesce window', () => {
    const store = useDocumentsStore.getState()
    store.updateContent(ID, 'AB')
    now += HISTORY_COALESCE_MS + 100
    store.updateContent(ID, 'ABC')

    expect(doc().past).toEqual(['A', 'AB'])
  })

  it('clears the redo stack when editing after an undo', () => {
    const store = useDocumentsStore.getState()
    store.updateContent(ID, 'AB')
    now += HISTORY_COALESCE_MS + 1
    store.updateContent(ID, 'ABC')
    store.undo(ID)

    expect(doc().future).toEqual(['ABC'])
    now += HISTORY_COALESCE_MS + 1
    store.updateContent(ID, 'ABD')

    expect(canRedo(doc())).toBe(false)
  })

  it('ignores no-op edits', () => {
    useDocumentsStore.getState().updateContent(ID, 'A')
    expect(doc().past).toEqual([])
    expect(canUndo(doc())).toBe(false)
  })

  it('resets to the saved content and can undo the reset', () => {
    const store = useDocumentsStore.getState()
    store.updateContent(ID, 'AB')
    now += HISTORY_COALESCE_MS + 1
    store.reset(ID)

    expect(doc().content).toBe('A')
    store.undo(ID)
    expect(doc().content).toBe('AB')
  })

  it('keeps history across a save', async () => {
    const store = useDocumentsStore.getState()
    store.updateContent(ID, 'AB')
    await store.save(ID)

    expect(doc().savedContent).toBe('AB')
    expect(doc().past).toEqual(['A'])
  })
})

describe('documents across projects', () => {
  it('namespaces documents by project', async () => {
    const node = { id: NODE, name: NODE, kind: 'file' as const, handle: {} as FileSystemFileHandle, children: [] }
    const store = useDocumentsStore.getState()

    await store.open(P1, node)
    await store.open(P2, node)

    const state = useDocumentsStore.getState()
    expect(Object.keys(state.docs).sort()).toEqual([
      makeDocId(P1, NODE),
      makeDocId(P2, NODE),
    ])
  })

  it('lists only the documents of a project', () => {
    seedDoc(P1, NODE)
    const id2 = makeDocId(P2, 'other.md')
    useDocumentsStore.setState((state) => ({
      docs: {
        ...state.docs,
        [id2]: {
          ...state.docs[ID],
          id: id2,
          projectId: P2,
          nodeId: 'other.md',
          name: 'other.md',
        },
      },
      order: [ID, id2],
    }))

    const state = useDocumentsStore.getState()
    expect(projectDocIds(state.order, state.docs, P1)).toEqual([ID])
    expect(projectDocIds(state.order, state.docs, P2)).toEqual([id2])
  })

  it('restores the remembered document when switching projects', () => {
    seedDoc(P1, NODE)
    const p2Id = makeDocId(P2, 'notes.md')
    useDocumentsStore.setState((state) => ({
      docs: {
        ...state.docs,
        [p2Id]: {
          ...state.docs[ID],
          id: p2Id,
          projectId: P2,
          nodeId: 'notes.md',
          name: 'notes.md',
        },
      },
      order: [ID, p2Id],
      lastActiveByProject: { [P1]: ID, [P2]: p2Id },
    }))

    useDocumentsStore.getState().setActiveProject(P2)
    expect(useDocumentsStore.getState().activeDocId).toBe(p2Id)

    useDocumentsStore.getState().setActiveProject(P1)
    expect(useDocumentsStore.getState().activeDocId).toBe(ID)
  })

  it('closes every document of a project', () => {
    seedDoc(P1, NODE)
    useDocumentsStore.getState().closeProject(P1)

    const state = useDocumentsStore.getState()
    expect(state.docs).toEqual({})
    expect(state.order).toEqual([])
    expect(state.activeDocId).toBeNull()
  })
})

describe('reloadProject', () => {
  it('re-reads clean documents from disk', async () => {
    vi.mocked(readFileText).mockResolvedValueOnce('from disk')

    const result = await useDocumentsStore.getState().reloadProject(P1)

    expect(result.reloaded).toBe(1)
    expect(doc().content).toBe('from disk')
    expect(doc().savedContent).toBe('from disk')
    expect(doc().past).toEqual([])
  })

  it('skips documents with unsaved changes', async () => {
    useDocumentsStore.getState().updateContent(ID, 'local edit')
    vi.mocked(readFileText).mockResolvedValueOnce('from disk')

    const result = await useDocumentsStore.getState().reloadProject(P1)

    expect(result.skipped).toEqual([NODE])
    expect(doc().content).toBe('local edit')
  })

  it('does nothing when the on-disk content is unchanged', async () => {
    vi.mocked(readFileText).mockResolvedValueOnce('A')

    const result = await useDocumentsStore.getState().reloadProject(P1)

    expect(result.reloaded).toBe(0)
  })

  it('only touches the given project', async () => {
    const p2Id = makeDocId(P2, 'other.md')
    useDocumentsStore.setState((state) => ({
      docs: {
        ...state.docs,
        [p2Id]: {
          ...state.docs[ID],
          id: p2Id,
          projectId: P2,
          nodeId: 'other.md',
          name: 'other.md',
          content: 'A',
          savedContent: 'A',
        },
      },
      order: [ID, p2Id],
    }))
    vi.mocked(readFileText).mockResolvedValue('from disk')

    const result = await useDocumentsStore.getState().reloadProject(P2)

    expect(result.reloaded).toBe(1)
    expect(useDocumentsStore.getState().docs[p2Id].content).toBe('from disk')
    expect(doc(ID).content).toBe('A') // P1 untouched
  })
})
