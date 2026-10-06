import { EditorView } from '@codemirror/view'
import { markdown, markdownLanguage } from '@codemirror/lang-markdown'
import { languages } from '@codemirror/language-data'
import CodeMirror from '@uiw/react-codemirror'
import { useMemo } from 'react'

import { campsiteEditorExtensions } from '@/lib/markdown/codemirror-theme'
import { useDocumentsStore } from '@/store/documents'

export function EditorPane() {
  const activePath = useDocumentsStore((s) => s.activePath)
  const content = useDocumentsStore((s) =>
    s.activePath ? (s.docs[s.activePath]?.content ?? '') : '',
  )
  const updateContent = useDocumentsStore((s) => s.updateContent)

  const extensions = useMemo(
    () => [
      markdown({ base: markdownLanguage, codeLanguages: languages }),
      EditorView.lineWrapping,
      ...campsiteEditorExtensions,
    ],
    [],
  )

  if (!activePath) return null

  return (
    <div className="h-full overflow-hidden">
      <CodeMirror
        value={content}
        height="100%"
        theme="none"
        extensions={extensions}
        basicSetup={{ foldGutter: false, highlightActiveLine: true }}
        onChange={(value) => updateContent(activePath, value)}
      />
    </div>
  )
}
