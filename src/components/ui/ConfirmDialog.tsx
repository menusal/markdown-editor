import { useEffect, useRef } from 'react'
import type { KeyboardEvent } from 'react'

import { useUiStore } from '@/store/ui'
import { Button } from '@/components/ui/Button'

export function ConfirmDialog() {
  const request = useUiStore((s) => s.confirmRequest)
  const resolve = useUiStore((s) => s.resolveConfirm)
  const confirmRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (request) confirmRef.current?.focus()
  }, [request])

  if (!request) return null

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      resolve(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/40 px-16"
      onMouseDown={() => resolve(false)}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        onMouseDown={(event) => event.stopPropagation()}
        onKeyDown={handleKeyDown}
        className="w-full max-w-[420px] rounded-2xl border border-soft-fog bg-pure-white p-24 shadow-subtle-4"
      >
        <h2
          id="confirm-title"
          className="text-subheading leading-subheading font-semibold tracking-heading text-ink"
        >
          {request.title}
        </h2>
        {request.description ? (
          <p className="mt-8 text-body leading-body text-graphite">
            {request.description}
          </p>
        ) : null}

        <div className="mt-24 flex justify-end gap-8">
          <Button variant="secondary" onClick={() => resolve(false)}>
            {request.cancelLabel ?? 'Cancel'}
          </Button>
          <Button
            ref={confirmRef}
            variant={request.danger ? 'danger' : 'primary'}
            onClick={() => resolve(true)}
          >
            {request.confirmLabel ?? 'Confirm'}
          </Button>
        </div>
      </div>
    </div>
  )
}
