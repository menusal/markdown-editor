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

function scroll(el: HTMLElement) {
  el.dispatchEvent(new Event('scroll'))
}

describe('ScrollSync', () => {
  it('mirrors the proportional ratio from editor to preview', () => {
    const sync = new ScrollSync()
    const editor = createScroller(1000, 200) // range 800
    const preview = createScroller(2000, 400) // range 1600
    sync.registerEditor(editor)
    sync.registerPreview(preview)

    editor.scrollTop = 400 // 50%
    scroll(editor)

    expect(preview.scrollTop).toBe(800)
  })

  it('mirrors the proportional ratio from preview to editor', () => {
    const sync = new ScrollSync()
    const editor = createScroller(1000, 200) // range 800
    const preview = createScroller(2000, 400) // range 1600
    sync.registerEditor(editor)
    sync.registerPreview(preview)

    preview.scrollTop = 1600 // 100%
    scroll(preview)

    expect(editor.scrollTop).toBe(800)
  })

  it('ignores the echoed scroll event of the programmatically scrolled pane', () => {
    const sync = new ScrollSync()
    const editor = createScroller(1000, 200)
    const preview = createScroller(2000, 400)
    sync.registerEditor(editor)
    sync.registerPreview(preview)

    editor.scrollTop = 400
    scroll(editor)
    expect(preview.scrollTop).toBe(800)

    // The browser emits this after we set preview.scrollTop above.
    scroll(preview)
    expect(editor.scrollTop).toBe(400)
  })

  it('does nothing when the source pane cannot scroll', () => {
    const sync = new ScrollSync()
    const editor = createScroller(200, 200) // no overflow
    const preview = createScroller(2000, 400)
    sync.registerEditor(editor)
    sync.registerPreview(preview)

    scroll(editor)

    expect(preview.scrollTop).toBe(0)
  })

  it('does nothing when the target pane cannot scroll', () => {
    const sync = new ScrollSync()
    const editor = createScroller(1000, 200)
    const preview = createScroller(400, 400) // no overflow
    sync.registerEditor(editor)
    sync.registerPreview(preview)

    editor.scrollTop = 400
    scroll(editor)

    expect(preview.scrollTop).toBe(0)
  })

  it('is a no-op before both panes are registered', () => {
    const sync = new ScrollSync()
    const editor = createScroller(1000, 200)
    sync.registerEditor(editor)

    expect(() => {
      editor.scrollTop = 400
      scroll(editor)
    }).not.toThrow()
  })

  it('stops syncing after destroy', () => {
    const sync = new ScrollSync()
    const editor = createScroller(1000, 200)
    const preview = createScroller(2000, 400)
    sync.registerEditor(editor)
    sync.registerPreview(preview)
    sync.destroy()

    editor.scrollTop = 400
    scroll(editor)

    expect(preview.scrollTop).toBe(0)
  })
})
