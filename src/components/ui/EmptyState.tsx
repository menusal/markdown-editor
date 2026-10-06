import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-24 px-32 text-center">
      {icon ? (
        <div className="flex size-64 items-center justify-center rounded-2xl bg-ash-mist text-ink">
          {icon}
        </div>
      ) : null}
      <div className="space-y-8">
        <h2 className="text-heading leading-heading font-semibold tracking-heading text-ink">
          {title}
        </h2>
        {description ? (
          <p className="mx-auto max-w-[420px] text-body leading-body text-graphite">
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  )
}
