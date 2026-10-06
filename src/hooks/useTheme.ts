import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'

import {
  THEME_STORAGE_KEY,
  applyMode,
  getStoredMode,
  systemPrefersDark,
  type ResolvedTheme,
  type ThemeMode,
} from '@/lib/theme'

const MODE_CYCLE: ThemeMode[] = ['system', 'light', 'dark']

function subscribeSystemTheme(callback: () => void) {
  const media = window.matchMedia('(prefers-color-scheme: dark)')
  media.addEventListener('change', callback)
  return () => media.removeEventListener('change', callback)
}

export function useTheme() {
  const [mode, setModeState] = useState<ThemeMode>(() => getStoredMode())
  const systemDark = useSyncExternalStore(
    subscribeSystemTheme,
    systemPrefersDark,
    () => false,
  )

  const resolved: ResolvedTheme =
    mode === 'system' ? (systemDark ? 'dark' : 'light') : mode

  useEffect(() => {
    applyMode(mode)
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, mode)
    } catch {
      // Ignore storage failures (private mode, etc.)
    }
  }, [mode, systemDark])

  const setMode = useCallback((next: ThemeMode) => setModeState(next), [])

  const cycle = useCallback(() => {
    setModeState((current) => {
      const index = MODE_CYCLE.indexOf(current)
      return MODE_CYCLE[(index + 1) % MODE_CYCLE.length]
    })
  }, [])

  return { mode, resolved, setMode, cycle }
}
