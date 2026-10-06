/**
 * Coordinates proportional scrolling between two elements (editor ↔ preview).
 *
 * The sync is proportional: the scroll ratio (0..1) of the source pane is
 * mirrored onto the target pane, so panes with different content heights stay
 * aligned.
 *
 * Two safeguards keep it well-behaved:
 * - A "programmatic" slot prevents the echoed scroll event of the target from
 *   bouncing back and creating a feedback loop.
 * - Only scrolls that follow real user input (wheel, pointer drag, touch,
 *   keyboard) are synced. Scrolling emitted by CodeMirror when its document is
 *   replaced externally (e.g. toggling a checkbox) is ignored, so it can't yank
 *   the other pane to the top.
 */
export class ScrollSync {
  private static readonly INTERACTION_WINDOW_MS = 500

  private editor: HTMLElement | null = null
  private preview: HTMLElement | null = null
  private programmatic: HTMLElement | null = null

  private editorInteractionAt = Number.NEGATIVE_INFINITY
  private previewInteractionAt = Number.NEGATIVE_INFINITY

  private disposeEditorInput: (() => void) | null = null
  private disposePreviewInput: (() => void) | null = null

  private readonly onEditorScroll = () =>
    this.handle('editor', this.editor, this.preview)
  private readonly onPreviewScroll = () =>
    this.handle('preview', this.preview, this.editor)

  registerEditor(element: HTMLElement | null): void {
    if (this.editor === element) return
    this.editor?.removeEventListener('scroll', this.onEditorScroll)
    this.disposeEditorInput?.()
    this.editor = element
    if (element) {
      element.addEventListener('scroll', this.onEditorScroll, { passive: true })
      this.disposeEditorInput = this.trackInput(element, 'editor')
    }
  }

  registerPreview(element: HTMLElement | null): void {
    if (this.preview === element) return
    this.preview?.removeEventListener('scroll', this.onPreviewScroll)
    this.disposePreviewInput?.()
    this.preview = element
    if (element) {
      element.addEventListener('scroll', this.onPreviewScroll, { passive: true })
      this.disposePreviewInput = this.trackInput(element, 'preview')
    }
  }

  destroy(): void {
    this.registerEditor(null)
    this.registerPreview(null)
  }

  private trackInput(
    element: HTMLElement,
    role: 'editor' | 'preview',
  ): () => void {
    const mark = () => this.markInteraction(role)
    const events = ['wheel', 'pointerdown', 'touchstart', 'keydown']
    for (const type of events) {
      element.addEventListener(type, mark, { passive: true })
    }
    return () => {
      for (const type of events) {
        element.removeEventListener(type, mark)
      }
    }
  }

  private markInteraction(role: 'editor' | 'preview'): void {
    if (role === 'editor') this.editorInteractionAt = now()
    else this.previewInteractionAt = now()
  }

  private isInteracting(role: 'editor' | 'preview'): boolean {
    const at = role === 'editor' ? this.editorInteractionAt : this.previewInteractionAt
    return now() - at <= ScrollSync.INTERACTION_WINDOW_MS
  }

  private handle(
    role: 'editor' | 'preview',
    source: HTMLElement | null,
    target: HTMLElement | null,
  ): void {
    if (!source || !target) return

    // Ignore the scroll event produced by our own programmatic scroll.
    if (this.programmatic === source) {
      this.programmatic = null
      return
    }

    // Ignore scrolls not driven by user input (e.g. CodeMirror resetting its
    // scroll position when its document is replaced).
    if (!this.isInteracting(role)) return

    // Keep the window alive while momentum/continuous scrolling is in flight.
    this.markInteraction(role)

    const sourceMax = source.scrollHeight - source.clientHeight
    const targetMax = target.scrollHeight - target.clientHeight
    if (sourceMax <= 0 || targetMax <= 0) return

    const ratio = source.scrollTop / sourceMax
    this.programmatic = target
    target.scrollTop = ratio * targetMax

    // If the target didn't move, no scroll event fires to clear the slot.
    requestAnimationFrame(() => {
      if (this.programmatic === target) this.programmatic = null
    })
  }
}

function now(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now()
}
