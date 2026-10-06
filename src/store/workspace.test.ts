import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/fs/directory', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/fs/directory')>()
  return {
    ...actual,
    buildTree: vi.fn(async () => [
      {
        id: 'a.md',
        name: 'a.md',
        kind: 'file',
        handle: { name: 'a.md', kind: 'file' },
        children: [],
      },
    ]),
  }
})

const { dirA, dirB, fileX, fileY } = vi.hoisted(() => {
  const make = (name: string, kind: 'directory' | 'file') => ({
    name,
    kind,
    isSameEntry(other: unknown) {
      return this === other
    },
  })
  return {
    dirA: make('Project A', 'directory'),
    dirB: make('Project B', 'directory'),
    fileX: make('x.md', 'file'),
    fileY: make('y.md', 'file'),
  }
})

vi.mock('@/lib/fs/picker', () => ({
  isFileSystemAccessSupported: () => true,
  pickDirectory: vi.fn(),
  pickFiles: vi.fn(),
  isAbortError: (error: unknown) =>
    error instanceof DOMException && error.name === 'AbortError',
}))

vi.mock('@/lib/fs/permissions', () => ({
  ensureSourcePermission: vi.fn(async () => true),
}))

vi.mock('@/lib/fs/persist', () => ({
  saveWorkspace: vi.fn(async () => {}),
  loadWorkspace: vi.fn(async () => null),
  migrateLegacyRoot: vi.fn(async () => null),
  clearWorkspace: vi.fn(async () => {}),
}))

import { pickDirectory, pickFiles } from '@/lib/fs/picker'
import { useDocumentsStore } from '@/store/documents'
import { LOOSE_PROJECT_ID, useWorkspaceStore } from '@/store/workspace'

function resetWorkspace() {
  useWorkspaceStore.setState({
    status: 'idle',
    error: null,
    projects: [],
    activeProjectId: null,
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  resetWorkspace()
  useDocumentsStore.setState({
    docs: {},
    order: [],
    activeDocId: null,
    lastActiveByProject: {},
  })
})

describe('workspace projects', () => {
  it('opens a folder as a project and activates it', async () => {
    vi.mocked(pickDirectory).mockResolvedValueOnce(dirA as never)

    await useWorkspaceStore.getState().openDirectory()

    const state = useWorkspaceStore.getState()
    expect(state.projects).toHaveLength(1)
    expect(state.activeProjectId).toBe(state.projects[0].id)
    expect(state.projects[0].name).toBe('Project A')
    expect(state.status).toBe('ready')
    expect(state.projects[0].tree).toHaveLength(1)
  })

  it('does not duplicate a folder that is already open', async () => {
    vi.mocked(pickDirectory).mockResolvedValue(dirA as never)

    await useWorkspaceStore.getState().openDirectory()
    await useWorkspaceStore.getState().openDirectory()

    expect(useWorkspaceStore.getState().projects).toHaveLength(1)
  })

  it('keeps multiple projects and switches between them', async () => {
    vi.mocked(pickDirectory)
      .mockResolvedValueOnce(dirA as never)
      .mockResolvedValueOnce(dirB as never)

    await useWorkspaceStore.getState().openDirectory()
    await useWorkspaceStore.getState().openDirectory()

    const { projects } = useWorkspaceStore.getState()
    expect(projects).toHaveLength(2)

    const first = projects.find((p) => p.name === 'Project A')!
    await useWorkspaceStore.getState().activateProject(first.id)
    expect(useWorkspaceStore.getState().activeProjectId).toBe(first.id)
  })

  it('accumulates loose files into a single project with dedupe', async () => {
    vi.mocked(pickFiles)
      .mockResolvedValueOnce([fileX, fileY] as never)
      .mockResolvedValueOnce([fileX] as never)

    await useWorkspaceStore.getState().openFiles()
    await useWorkspaceStore.getState().openFiles()

    const loose = useWorkspaceStore
      .getState()
      .projects.find((p) => p.id === LOOSE_PROJECT_ID)
    expect(useWorkspaceStore.getState().projects).toHaveLength(1)
    expect(loose?.source.kind).toBe('files')
    if (loose?.source.kind === 'files') {
      expect(loose.source.entries).toHaveLength(2)
    }
  })

  it('removes a project and falls back to another', async () => {
    vi.mocked(pickDirectory)
      .mockResolvedValueOnce(dirA as never)
      .mockResolvedValueOnce(dirB as never)

    await useWorkspaceStore.getState().openDirectory()
    await useWorkspaceStore.getState().openDirectory()
    const active = useWorkspaceStore.getState().activeProjectId!

    await useWorkspaceStore.getState().removeProject(active)

    const state = useWorkspaceStore.getState()
    expect(state.projects).toHaveLength(1)
    expect(state.activeProjectId).toBe(state.projects[0].id)
  })
})
