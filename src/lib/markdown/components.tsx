import { createContext, useContext, type ComponentProps } from 'react'
import type { Components } from 'react-markdown'

import { cn } from '@/lib/cn'

const TaskLineContext = createContext<number | null>(null)

interface WithNode {
  node?: {
    position?: { start?: { line?: number } }
  }
}

export interface MarkdownComponentsOptions {
  onToggleTask?: (line: number, checked: boolean) => void
}

export function createMarkdownComponents({
  onToggleTask,
}: MarkdownComponentsOptions): Components {
  function TaskInput(props: ComponentProps<'input'> & WithNode) {
    const { node, className, ...rest } = props
    void node
    const line = useContext(TaskLineContext)

    if (rest.type !== 'checkbox') {
      return <input {...rest} className={className} />
    }

    const checkboxClass = cn(
      'mr-8 size-16 align-[-2px] accent-resolve-green',
      className,
    )
    const checked = Boolean(rest.checked)

    if (line == null || !onToggleTask) {
      return <input {...rest} className={checkboxClass} checked={checked} readOnly disabled />
    }

    return (
      <input
        {...rest}
        className={checkboxClass}
        checked={checked}
        onChange={(event) => onToggleTask(line, event.target.checked)}
      />
    )
  }

  function TaskListItem(props: ComponentProps<'li'> & WithNode) {
    const { node, className, children, ...rest } = props
    const isTask =
      typeof className === 'string' && className.includes('task-list-item')
    const line = node?.position?.start?.line ?? null

    const element = (
      <li
        {...rest}
        className={cn(
          'text-body-lg leading-body-lg text-graphite',
          isTask && 'list-none',
          className,
        )}
      >
        {children}
      </li>
    )

    return isTask ? (
      <TaskLineContext.Provider value={line}>{element}</TaskLineContext.Provider>
    ) : (
      element
    )
  }

  return {
    h1: ({ children }) => (
      <h1 className="text-heading leading-heading font-semibold tracking-heading text-ink mt-32 mb-16">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-subheading leading-subheading font-semibold text-ink mt-32 mb-12">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-body-lg leading-body-lg font-semibold text-ink mt-24 mb-8">
        {children}
      </h3>
    ),
    h4: ({ children }) => (
      <h4 className="text-body leading-body font-semibold text-ink mt-16 mb-8">
        {children}
      </h4>
    ),
    h5: ({ children }) => (
      <h5 className="text-caption leading-caption font-semibold text-graphite mt-16 mb-8">
        {children}
      </h5>
    ),
    h6: ({ children }) => (
      <h6 className="text-caption leading-caption font-semibold text-steel mt-16 mb-8">
        {children}
      </h6>
    ),
    p: ({ children }) => (
      <p className="text-body-lg leading-body-lg text-graphite my-12">{children}</p>
    ),
    a: ({ children, href }) => (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="text-resolve-green font-medium underline-offset-2 hover:underline"
      >
        {children}
      </a>
    ),
    strong: ({ children }) => (
      <strong className="font-semibold text-ink">{children}</strong>
    ),
    em: ({ children }) => <em className="italic">{children}</em>,
    ul: ({ className, children, ...props }) => (
      <ul
        {...props}
        className={cn(
          'my-12 pl-24 text-graphite space-y-4',
          className?.includes('contains-task-list') ? 'list-none pl-0' : 'list-disc',
          className,
        )}
      >
        {children}
      </ul>
    ),
    ol: ({ children, ...props }) => (
      <ol
        {...props}
        className="my-12 list-decimal pl-24 text-graphite space-y-4"
      >
        {children}
      </ol>
    ),
    li: TaskListItem,
    input: TaskInput,
    blockquote: ({ children }) => (
      <blockquote className="my-16 rounded-lg bg-highlight-wash px-16 py-12 text-body-lg leading-body-lg text-ink">
        {children}
      </blockquote>
    ),
    pre: ({ children }) => (
      <pre className="my-16 overflow-x-auto rounded-lg bg-charcoal-card p-16 font-mono text-[13px] leading-[1.6] text-pure-white">
        {children}
      </pre>
    ),
    code: ({ className, children, ...props }) => {
      const isBlock = typeof className === 'string' && className.startsWith('language-')
      if (isBlock) {
        return (
          <code {...props} className={cn('font-mono', className)}>
            {children}
          </code>
        )
      }
      return (
        <code
          {...props}
          className="font-mono text-[0.9em] rounded-md bg-soft-fog px-4 py-1 text-ink"
        >
          {children}
        </code>
      )
    },
    hr: () => <hr className="my-24 border-0 border-t border-soft-fog" />,
    img: ({ src, alt }) => (
      <img src={src} alt={alt ?? ''} className="my-16 max-w-full rounded-lg" />
    ),
    table: ({ children }) => (
      <div className="my-16 overflow-x-auto rounded-xl border border-soft-fog shadow-subtle-2">
        <table className="w-full border-collapse">{children}</table>
      </div>
    ),
    th: ({ children, ...props }) => (
      <th
        {...props}
        className="border-b border-soft-fog bg-ash-mist px-12 py-8 text-left text-body leading-body font-semibold text-ink"
      >
        {children}
      </th>
    ),
    td: ({ children, ...props }) => (
      <td
        {...props}
        className="border-b border-soft-fog px-12 py-8 text-body leading-body text-graphite"
      >
        {children}
      </td>
    ),
  }
}
