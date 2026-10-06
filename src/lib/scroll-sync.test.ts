import { describe, expect, it } from 'vitest'

import { ScrollSync } from '@/lib/scroll-sync'

/** A fake scrollable element: jsdom has no layout, so metrics are stubbed. */
function createScroller(scrollHeight: number, clientHeight: number) {
  const el = document.createElement('div')
  let scrollTop = 0

  Object.defineProperty(el, 'scrollHeight', {
    configurable: true,
    get: () => scrollHeight,
  })
  Object.defineProperty(el, 'clientHeight', {
    configurable: true,
    get: () => clientHeight,
  })
  Object.defineProperty(el, 'scrollTop', {
    configurable: true,
    get: () => scrollTop,
    set: (value: number) => {
      scrollTop = value
    },
  })

  return el
}

/** A raw scroll event, e.g. one emitted by the editor without user input. */
function scroll(el: HTMLElement) {
  el.dispatchEvent(new Event('scroll'))
}

/** Simulates a user-driven scroll (wheel first, then the scroll event). */
function userScroll(el: HTMLElement, top: number) {
  el.dispatchEvent(new Event('wheel'))
  el.scrollTop = top
  el.dispatchEvent(new Event('scroll'))
}

describe('ScrollSync', () => {
  it('mirrors the proportional ratio from editor to preview', () => {
    const sync = new ScrollSync()
    const editor = createScroller(1000, 200) // range 800
    const preview = createScroller(2000, 400) // range 1600
    sync.registerEditor(editor)
    sync.registerPreview(preview)

    userScroll(editor, 400) // 50%

    expect(preview.scrollTop).toBe(800)
  })

  it('mirrors the proportional ratio from preview to editor', () => {
    const sync = new ScrollSync()
    const editor = createScroller(1000, 200) // range 800
    const preview = createScroller(2000, 400) // range 1600
    sync.registerEditor(editor)
    sync.registerPreview(preview)

    userScroll(preview, 1600) // 100%

    expect(editor.scrollTop).toBe(800)
  })

  it('ignores the echoed scroll event of the programmatically scrolled pane', () => {
    const sync = new ScrollSync()
    const editor = createScroller(1000, 200)
    const preview = createScroller(2000, 400)
    sync.registerEditor(editor)
    sync.registerPreview(preview)

    userScroll(editor, 400)
    expect(preview.scrollTop).toBe(800)

    // The browser emits this after we set preview.scrollTop above.
    scroll(preview)
    expect(editor.scrollTop).toBe(400)
  })

  it('ignores scroll events that did not follow user input', () => {
    const sync = new ScrollSync()
    const editor = createScroller(1000, 200)
    const preview = createScroller(2000, 400)
    sync.registerEditor(editor)
    sync.registerPreview(preview)

    // User scrolled the preview earlier...
    userScroll(preview, 1200)
    expect(editor.scrollTop).toBe(600)

    // ...then toggling a checkbox makes the editor emit an uninteracted scroll
    // (CodeMirror resetting its position). It must not yank the preview.
    scroll(editor)
    expect(preview.scrollTop).toBe(1200)
  })

  it('does nothing when the source pane cannot scroll', () => {
    const sync = new ScrollSync()
    const editor = createScroller(200, 200) // no overflow
    const preview = createScroller(2000, 400)
    sync.registerEditor(editor)
    sync.registerPreview(preview)

    userScroll(editor, 0)

    expect(preview.scrollTop).toBe(0)
  })

  it('does nothing when the target pane cannot scroll', () => {
    const sync = new ScrollSync()
    const editor = createScroller(1000, 200)
    const preview = createScroller(400, 400) // no overflow
    sync.registerEditor(editor)
    sync.registerPreview(preview)

    userScroll(editor, 400)

    expect(preview.scrollTop).toBe(0)
  })

  it('is a no-op before both panes are registered', () => {
    const sync = new ScrollSync()
    const editor = createScroller(1000, 200)
    sync.registerEditor(editor)

    expect(() => userScroll(editor, 400)).not.toThrow()
  })

  it('stops syncing after destroy', () => {
    const sync = new ScrollSync()
    const editor = createScroller(1000, 200)
    const preview = createScroller(2000, 400)
    sync.registerEditor(editor)
    sync.registerPreview(preview)
    sync.destroy()

    userScroll(editor, 400)

    expect(preview.scrollTop).toBe(0)
  })
})
