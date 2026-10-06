import { createContext, useContext } from 'react'

import type { ScrollSync } from '@/lib/scroll-sync'

export const ScrollSyncContext = createContext<ScrollSync | null>(null)

export function useScrollSync(): ScrollSync | null {
  return useContext(ScrollSyncContext)
}
