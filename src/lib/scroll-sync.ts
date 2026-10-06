/**
 * Coordinates proportional scrolling between two elements (editor ↔ preview).
 *
 * The sync is proportional: the scroll ratio (0..1) of the source pane is
 * mirrored onto the target pane, so panes with different content heights stay
 * aligned. A single "programmatic" slot prevents the echoed scroll event of the
 * target from bouncing back and creating a feedback loop.
 */
export class ScrollSync {
  private editor: HTMLElement | null = null
  private preview: HTMLElement | null = null
  private programmatic: HTMLElement | null = null

  private readonly onEditorScroll = () => this.sync(this.editor, this.preview)
  private readonly onPreviewScroll = () => this.sync(this.preview, this.editor)

  registerEditor(element: HTMLElement | null): void {
    if (this.editor === element) return
    this.editor?.removeEventListener('scroll', this.onEditorScroll)
    this.editor = element
    this.editor?.addEventListener('scroll', this.onEditorScroll, { passive: true })
  }

  registerPreview(element: HTMLElement | null): void {
    if (this.preview === element) return
    this.preview?.removeEventListener('scroll', this.onPreviewScroll)
    this.preview = element
    this.preview?.addEventListener('scroll', this.onPreviewScroll, { passive: true })
  }

  destroy(): void {
    this.registerEditor(null)
    this.registerPreview(null)
  }

  private sync(source: HTMLElement | null, target: HTMLElement | null): void {
    if (!source || !target) return

    // Ignore the scroll event produced by our own programmatic scroll.
    if (this.programmatic === source) {
      this.programmatic = null
      return
    }

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
