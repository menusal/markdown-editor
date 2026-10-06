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

    /* Search panel (Cmd/Ctrl+F) — themed with tokens so it follows light/dark. */
    '.cm-panels': {
      backgroundColor: 'var(--color-pure-white)',
      color: 'var(--color-ink)',
      fontFamily: 'var(--font-inter)',
    },
    '.cm-panels.cm-panels-top': {
      borderBottom: '1px solid var(--color-soft-fog)',
    },
    '.cm-panels.cm-panels-bottom': {
      borderTop: '1px solid var(--color-soft-fog)',
    },
    '.cm-panel.cm-search': {
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: '6px',
      padding: '8px 12px',
      fontSize: '13px',
      backgroundColor: 'var(--color-pure-white)',
      color: 'var(--color-ink)',
    },
    '.cm-panel.cm-search label': {
      color: 'var(--color-graphite)',
      fontSize: '13px',
    },
    '.cm-panel.cm-search input.cm-textfield': {
      backgroundColor: 'var(--color-warm-canvas)',
      color: 'var(--color-ink)',
      border: '1px solid var(--color-soft-fog)',
      borderRadius: '8px',
      padding: '4px 8px',
      fontSize: '13px',
      outline: 'none',
    },
    '.cm-panel.cm-search input.cm-textfield:focus': {
      borderColor: 'var(--color-resolve-green)',
    },
    '.cm-panel.cm-search input[type=checkbox]': {
      accentColor: 'var(--color-resolve-green)',
    },
    '.cm-panel.cm-search button, .cm-panel.cm-search .cm-button': {
      backgroundImage: 'none',
      backgroundColor: 'var(--color-ash-mist)',
      color: 'var(--color-ink)',
      border: '1px solid var(--color-soft-fog)',
      borderRadius: '8px',
      padding: '4px 10px',
      fontSize: '12px',
      fontWeight: '500',
      cursor: 'pointer',
    },
    '.cm-panel.cm-search button:hover, .cm-panel.cm-search .cm-button:hover': {
      backgroundColor: 'var(--color-soft-fog)',
    },
    '.cm-panel.cm-search button[name=close]': {
      marginLeft: 'auto',
      backgroundColor: 'transparent',
      border: 'none',
      color: 'var(--color-steel)',
      fontSize: '16px',
      lineHeight: '1',
    },
    '.cm-panel.cm-search button[name=close]:hover': {
      backgroundColor: 'transparent',
      color: 'var(--color-ink)',
    },
    '.cm-searchMatch': {
      backgroundColor: 'var(--color-highlight-wash)',
      outline: '1px solid var(--color-sienna-brand)',
      borderRadius: '2px',
    },
    '.cm-searchMatch.cm-searchMatch-selected': {
      backgroundColor: 'var(--color-resolve-green)',
      color: '#ffffff',
      outline: '1px solid var(--color-resolve-green)',
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
