import { afterEach, describe, expect, it, vi } from 'vitest'

import { isFileSystemAccessSupported } from '@/lib/fs/picker'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('isFileSystemAccessSupported', () => {
  it('is false without showDirectoryPicker (jsdom default)', () => {
    expect(isFileSystemAccessSupported()).toBe(false)
  })

  it('is false when the picker exists but writing is unavailable (e.g. Safari)', () => {
    vi.stubGlobal('showDirectoryPicker', vi.fn())

    expect(isFileSystemAccessSupported()).toBe(false)
  })

  it('is true when both the picker and writable file handles exist', () => {
    vi.stubGlobal('showDirectoryPicker', vi.fn())
    vi.stubGlobal(
      'FileSystemFileHandle',
      class {
        createWritable() {}
      },
    )

    expect(isFileSystemAccessSupported()).toBe(true)
  })
})
