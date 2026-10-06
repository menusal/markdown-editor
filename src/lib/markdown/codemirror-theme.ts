import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { EditorView } from '@codemirror/view'
import { tags as t } from '@lezer/highlight'

export const campsiteEditorTheme = EditorView.theme(
  {
    '&': {
      backgroundColor: 'var(--color-pure-white)',
      color: 'var(--color-ink)',
      fontFamily: 'var(--font-ui-monospace)',
      fontSize: '14px',
      height: '100%',
    },
    '.cm-scroller': {
      fontFamily: 'var(--font-ui-monospace)',
      lineHeight: '1.7',
    },
    '.cm-content': {
      padding: '16px 0',
      caretColor: 'var(--color-resolve-green)',
    },
    '.cm-gutters': {
      backgroundColor: 'var(--color-pure-white)',
      color: 'var(--color-silver)',
      border: 'none',
    },
    '.cm-activeLine': { backgroundColor: 'rgba(245, 245, 245, 0.7)' },
    '.cm-activeLineGutter': {
      backgroundColor: 'transparent',
      color: 'var(--color-graphite)',
    },
    '.cm-selectionBackground, ::selection': {
      backgroundColor: 'var(--color-highlight-wash) !important',
    },
    '&.cm-focused .cm-selectionBackground': {
      backgroundColor: 'var(--color-highlight-wash) !important',
    },
    '.cm-cursor': {
      borderLeftColor: 'var(--color-resolve-green)',
      borderLeftWidth: '2px',
    },
  },
  { dark: false },
)

const campsiteHighlight = HighlightStyle.define([
  { tag: t.heading, color: 'var(--color-ink)', fontWeight: '600' },
  { tag: t.strong, fontWeight: '600', color: 'var(--color-ink)' },
  { tag: t.emphasis, fontStyle: 'italic' },
  { tag: t.link, color: 'var(--color-resolve-green)' },
  { tag: t.url, color: 'var(--color-resolve-green)' },
  { tag: t.monospace, color: 'var(--color-sienna-brand)' },
  { tag: t.quote, color: 'var(--color-steel)', fontStyle: 'italic' },
  { tag: t.comment, color: 'var(--color-silver)' },
])

export const campsiteEditorExtensions = [
  campsiteEditorTheme,
  syntaxHighlighting(campsiteHighlight),
]
