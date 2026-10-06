import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState, type ReactNode } from 'react'

import { cn } from '@/lib/cn'
import { CheckIcon } from '@/components/ui/icons'

interface MenuProps {
  trigger: (state: { open: boolean; toggle: () => void }) => ReactNode
  children: (state: { close: () => void }) => ReactNode
  align?: 'left' | 'right'
  className?: string
}

export function Menu({ trigger, children, align = 'left', className }: MenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div ref={ref} className={cn('relative', className)}>
      {trigger({ open, toggle: () => setOpen((v) => !v) })}
      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
            className={cn(
              'absolute z-50 mt-8 min-w-[240px] rounded-xl border border-soft-fog bg-pure-white p-4 shadow-subtle-4',
              align === 'right' ? 'right-0' : 'left-0',
            )}
          >
            {children({ close: () => setOpen(false) })}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

interface MenuItemProps {
  children: ReactNode
  icon?: ReactNode
  onClick: () => void
  active?: boolean
  danger?: boolean
}

export function MenuItem({ children, icon, onClick, active, danger }: MenuItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-12 rounded-lg px-12 py-8 text-left text-body leading-body font-medium transition-colors',
        danger
          ? 'text-alert-red hover:bg-alert-red/10'
          : 'text-ink hover:bg-ash-mist',
      )}
    >
      {icon ? <span className="shrink-0 text-steel">{icon}</span> : null}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {active ? (
        <span className="shrink-0 text-resolve-green">
          <CheckIcon width={16} height={16} />
        </span>
      ) : null}
    </button>
  )
}
