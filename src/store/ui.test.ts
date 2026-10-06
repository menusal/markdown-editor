import { afterEach, describe, expect, it, vi } from 'vitest'

import { useUiStore } from '@/store/ui'

afterEach(() => {
  useUiStore.setState({ confirmRequest: null })
})

describe('ui confirm', () => {
  it('exposes a pending request and resolves true', async () => {
    const promise = useUiStore.getState().confirm({ title: 'Remove "x"?' })

    expect(useUiStore.getState().confirmRequest?.title).toBe('Remove "x"?')

    useUiStore.getState().resolveConfirm(true)

    await expect(promise).resolves.toBe(true)
    expect(useUiStore.getState().confirmRequest).toBeNull()
  })

  it('resolves false when cancelled', async () => {
    const promise = useUiStore.getState().confirm({ title: 'Close "x"?' })

    useUiStore.getState().resolveConfirm(false)

    await expect(promise).resolves.toBe(false)
  })

  it('resolveConfirm is a no-op without a request', () => {
    const resolve = vi.fn()
    expect(() => useUiStore.getState().resolveConfirm(true)).not.toThrow()
    expect(resolve).not.toHaveBeenCalled()
  })
})
