import { beforeEach, describe, expect, it } from 'vitest'

import {
  THEME_STORAGE_KEY,
  getStoredMode,
  isThemeMode,
  resolveTheme,
} from '@/lib/theme'

describe('theme', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('defaults to system when nothing is stored', () => {
    expect(getStoredMode()).toBe('system')
  })

  it('reads a valid stored mode', () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, 'dark')
    expect(getStoredMode()).toBe('dark')
  })

  it('ignores invalid stored values', () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, 'banana')
    expect(getStoredMode()).toBe('system')
  })

  it('validates theme modes', () => {
    expect(isThemeMode('system')).toBe(true)
    expect(isThemeMode('light')).toBe(true)
    expect(isThemeMode('dark')).toBe(true)
    expect(isThemeMode('sepia')).toBe(false)
    expect(isThemeMode(null)).toBe(false)
  })

  it('resolves explicit modes verbatim', () => {
    expect(resolveTheme('light')).toBe('light')
    expect(resolveTheme('dark')).toBe('dark')
  })

  it('resolves system from the OS preference (light in the test stub)', () => {
    expect(resolveTheme('system')).toBe('light')
  })
})
