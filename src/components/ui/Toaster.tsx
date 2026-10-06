import { AnimatePresence, motion } from 'motion/react'

import { cn } from '@/lib/cn'
import { useUiStore, type ToastVariant } from '@/store/ui'

const dot: Record<ToastVariant, string> = {
  success: 'bg-resolve-green',
  error: 'bg-alert-red',
  info: 'bg-steel',
}

export function Toaster() {
  const toasts = useUiStore((s) => s.toasts)
  const dismiss = useUiStore((s) => s.dismissToast)

  return (
    <div className="pointer-events-none fixed bottom-24 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center gap-8">
      <AnimatePresence initial={false}>
        {toasts.map((toast) => (
          <motion.button
            key={toast.id}
            type="button"
            layout
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 500, damping: 32 }}
            onClick={() => dismiss(toast.id)}
            className={cn(
              'pointer-events-auto flex items-center gap-8 rounded-xl border border-soft-fog bg-pure-white',
              'px-16 py-12 text-body leading-body font-medium text-ink shadow-subtle-4',
            )}
          >
            <span className={cn('size-8 shrink-0 rounded-full', dot[toast.variant])} />
            {toast.message}
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  )
}
