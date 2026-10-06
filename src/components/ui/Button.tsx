import type { ButtonHTMLAttributes, ReactNode } from 'react'

import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  icon?: ReactNode
}

const variants: Record<Variant, string> = {
  primary:
    'bg-resolve-green text-white shadow-subtle-2 hover:brightness-[0.97] active:brightness-95',
  secondary:
    'bg-pure-white text-ink shadow-subtle-2 hover:bg-ash-mist',
  ghost:
    'bg-transparent text-graphite hover:bg-ash-mist hover:text-ink',
}

export function Button({
  variant = 'primary',
  icon,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center justify-center gap-8 rounded-full px-16 py-8',
        'text-body leading-body font-medium tracking-body',
        'transition-[background-color,filter,color] duration-150',
        'disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none',
        variants[variant],
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  )
}
