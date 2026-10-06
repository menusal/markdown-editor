import { create } from 'zustand'

export type ToastVariant = 'success' | 'error' | 'info'

export interface Toast {
  id: string
  message: string
  variant: ToastVariant
}

export interface ConfirmOptions {
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
}

interface ConfirmRequest extends ConfirmOptions {
  id: string
  resolve: (confirmed: boolean) => void
}

interface UiState {
  toasts: Toast[]
  searchOpen: boolean
  searchMode: 'files' | 'text'
  confirmRequest: ConfirmRequest | null
  pushToast: (message: string, variant?: ToastVariant) => void
  dismissToast: (id: string) => void
  openSearch: (mode?: 'files' | 'text') => void
  closeSearch: () => void
  setSearchMode: (mode: 'files' | 'text') => void
  confirm: (options: ConfirmOptions) => Promise<boolean>
  resolveConfirm: (confirmed: boolean) => void
}

export const useUiStore = create<UiState>((set, get) => ({
  toasts: [],
  searchOpen: false,
  searchMode: 'files',
  confirmRequest: null,
  pushToast: (message, variant = 'info') => {
    const id = crypto.randomUUID()
    set((state) => ({ toasts: [...state.toasts, { id, message, variant }] }))
    window.setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
    }, 3200)
  },
  dismissToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
  openSearch: (mode) =>
    set((state) => ({ searchOpen: true, searchMode: mode ?? state.searchMode })),
  closeSearch: () => set({ searchOpen: false }),
  setSearchMode: (mode) => set({ searchMode: mode }),
  confirm: (options) =>
    new Promise<boolean>((resolve) => {
      set({ confirmRequest: { id: crypto.randomUUID(), resolve, ...options } })
    }),
  resolveConfirm: (confirmed) => {
    const request = get().confirmRequest
    set({ confirmRequest: null })
    request?.resolve(confirmed)
  },
}))
