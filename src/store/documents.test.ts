import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/fs/file', () => ({
  readFileText: vi.fn(),
  writeFileText: vi.fn().mockResolvedValue(undefined),
}))

import {
  HISTORY_COALESCE_MS,
  canRedo,
  canUndo,
  useDocumentsStore,
  type EditorDocument,
} from '@/store/documents'

const PATH = 'plan.md'

function seedDoc(content = 'A', savedContent = 'A') {
  const doc: EditorDocument = {
    path: PATH,
    name: 'plan.md',
    handle: {} as FileSystemFileHandle,
    content,
    savedContent,
    past: [],
    future: [],
    lastEditAt: 0,
  }
  useDocumentsStore.setState({ docs: { [PATH]: doc }, order: [PATH], activePath: PATH })
}

function doc(): EditorDocument {
  return useDocumentsStore.getState().docs[PATH]
}

let now = 1000

beforeEach(() => {
  now = 1000
  vi.spyOn(Date, 'now').mockImplementation(() => now)
  useDocumentsStore.setState({ docs: {}, order: [], activePath: null })
  seedDoc()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('documents history', () => {
  it('push a history step and undoes/redoes an edit', () => {
    const store = useDocumentsStore.getState()
    store.updateContent(PATH, 'AB')

    expect(doc().past).toEqual(['A'])
    expect(doc().content).toBe('AB')

    store.undo(PATH)
    expect(doc().content).toBe('A')

    store.redo(PATH)
    expect(doc().content).toBe('AB')
  })

  it('coalesces rapid edits into a single undo step', () => {
    const store = useDocumentsStore.getState()
    store.updateContent(PATH, 'AB')
    now += HISTORY_COALESCE_MS - 100
    store.updateContent(PATH, 'ABC')

    expect(doc().past).toEqual(['A'])

    store.undo(PATH)
    expect(doc().content).toBe('A')
  })

  it('starts a new undo step after the coalesce window', () => {
    const store = useDocumentsStore.getState()
    store.updateContent(PATH, 'AB')
    now += HISTORY_COALESCE_MS + 100
    store.updateContent(PATH, 'ABC')

    expect(doc().past).toEqual(['A', 'AB'])

    store.undo(PATH)
    expect(doc().content).toBe('AB')
    store.undo(PATH)
    expect(doc().content).toBe('A')
  })

  it('clears the redo stack when editing after an undo', () => {
    const store = useDocumentsStore.getState()
    store.updateContent(PATH, 'AB')
    now += HISTORY_COALESCE_MS + 1
    store.updateContent(PATH, 'ABC')
    store.undo(PATH)

    expect(doc().future).toEqual(['ABC'])
    now += HISTORY_COALESCE_MS + 1
    store.updateContent(PATH, 'ABD')

    expect(doc().future).toEqual([])
    expect(canRedo(doc())).toBe(false)
  })

  it('ignores no-op edits', () => {
    const store = useDocumentsStore.getState()
    store.updateContent(PATH, 'A') // same as current
    expect(doc().past).toEqual([])
    expect(canUndo(doc())).toBe(false)
  })

  it('resets to the saved content and can undo the reset', () => {
    const store = useDocumentsStore.getState()
    store.updateContent(PATH, 'AB')
    now += HISTORY_COALESCE_MS + 1
    store.reset(PATH)

    expect(doc().content).toBe('A')
    expect(doc().content).toBe(doc().savedContent)

    store.undo(PATH)
    expect(doc().content).toBe('AB')
  })

  it('keeps history across a save and updates the saved baseline', async () => {
    const store = useDocumentsStore.getState()
    store.updateContent(PATH, 'AB')
    await store.save(PATH)

    expect(doc().savedContent).toBe('AB')
    expect(doc().past).toEqual(['A'])
    expect(canUndo(doc())).toBe(true)
  })

  it('tracks history independently per document', () => {
    const store = useDocumentsStore.getState()
    useDocumentsStore.setState((state) => ({
      docs: {
        ...state.docs,
        'other.md': {
          ...state.docs[PATH],
          path: 'other.md',
          name: 'other.md',
          content: 'X',
          savedContent: 'X',
        },
      },
      order: [PATH, 'other.md'],
    }))

    store.updateContent(PATH, 'AB')

    expect(useDocumentsStore.getState().docs[PATH].past).toEqual(['A'])
    expect(useDocumentsStore.getState().docs['other.md'].past).toEqual([])
  })
})
