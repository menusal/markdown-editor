import { EditorView, keymap } from '@codemirror/view'
import { markdown, markdownLanguage } from '@codemirror/lang-markdown'
import { languages } from '@codemirror/language-data'
import CodeMirror from '@uiw/react-codemirror'
import { useEffect, useMemo, useState } from 'react'

import { campsiteEditorExtensions } from '@/lib/markdown/codemirror-theme'
import { useDocumentsStore } from '@/store/documents'
import { useScrollSync } from '@/components/editor/scroll-sync-context'

function runHistoryAction(action: 'undo' | 'redo') {
  const { activePath } = useDocumentsStore.getState()
  if (!activePath) return true
  useDocumentsStore.getState()[action](activePath)
  return true
}

const historyKeymap = keymap.of([
  { key: 'Mod-z', preventDefault: true, run: () => runHistoryAction('undo') },
  { key: 'Mod-Shift-z', preventDefault: true, run: () => runHistoryAction('redo') },
  { key: 'Mod-y', preventDefault: true, run: () => runHistoryAction('redo') },
])

export function EditorPane() {
  const activePath = useDocumentsStore((s) => s.activePath)
  const content = useDocumentsStore((s) =>
    s.activePath ? (s.docs[s.activePath]?.content ?? '') : '',
  )
  const updateContent = useDocumentsStore((s) => s.updateContent)

  const sync = useScrollSync()
  const [view, setView] = useState<EditorView | null>(null)

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

  if (!activePath) return null

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
        onChange={(value) => updateContent(activePath, value)}
      />
    </div>
  )
}
