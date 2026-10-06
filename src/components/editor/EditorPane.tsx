import { EditorView, keymap } from '@codemirror/view'
import { markdown, markdownLanguage } from '@codemirror/lang-markdown'
import { languages } from '@codemirror/language-data'
import CodeMirror from '@uiw/react-codemirror'
import { useEffect, useMemo, useState } from 'react'

import { campsiteEditorExtensions } from '@/lib/markdown/codemirror-theme'
import { useDocumentsStore } from '@/store/documents'
import { useScrollSync } from '@/components/editor/scroll-sync-context'

function runHistoryAction(action: 'undo' | 'redo') {
  const { activeDocId } = useDocumentsStore.getState()
  if (!activeDocId) return true
  useDocumentsStore.getState()[action](activeDocId)
  return true
}

const historyKeymap = keymap.of([
  { key: 'Mod-z', preventDefault: true, run: () => runHistoryAction('undo') },
  { key: 'Mod-Shift-z', preventDefault: true, run: () => runHistoryAction('redo') },
  { key: 'Mod-y', preventDefault: true, run: () => runHistoryAction('redo') },
])

export function EditorPane() {
  const activeDocId = useDocumentsStore((s) => s.activeDocId)
  const content = useDocumentsStore((s) =>
    s.activeDocId ? (s.docs[s.activeDocId]?.content ?? '') : '',
  )
  const updateContent = useDocumentsStore((s) => s.updateContent)

  const sync = useScrollSync()
  const [view, setView] = useState<EditorView | null>(null)
  const pendingReveal = useDocumentsStore((s) => s.pendingReveal)

  const extensions = useMemo(
    () => [
      markdown({ base: markdownLanguage, codeLanguages: languages }),
      EditorView.lineWrapping,
      historyKeymap,
      ...campsiteEditorExtensions,
    ],
    [],
  )

  useEffect(() => {
    if (!sync || !view) return
    sync.registerEditor(view.scrollDOM)
    return () => sync.registerEditor(null)
  }, [sync, view])

  useEffect(() => {
    if (!pendingReveal || !view || pendingReveal.docId !== activeDocId) return
    const lineNo = Math.min(Math.max(pendingReveal.line, 1), view.state.doc.lines)
    const line = view.state.doc.line(lineNo)
    view.dispatch({
      selection: { anchor: line.from },
      effects: EditorView.scrollIntoView(line.from, { y: 'center' }),
    })
    view.focus()
    useDocumentsStore.getState().clearReveal()
  }, [pendingReveal, view, activeDocId])

  if (!activeDocId) return null

  return (
    <div className="h-full overflow-hidden">
      <CodeMirror
        className="h-full"
        value={content}
        height="100%"
        theme="none"
        extensions={extensions}
        basicSetup={{
          foldGutter: false,
          highlightActiveLine: true,
          history: false,
          historyKeymap: false,
        }}
        onCreateEditor={(editorView) => setView(editorView)}
        onChange={(value) => updateContent(activeDocId, value)}
      />
    </div>
  )
}
