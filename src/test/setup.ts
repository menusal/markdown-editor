import '@testing-library/jest-dom/vitest'

// jsdom has no layout engine. Run animation frames synchronously so the
// ScrollSync "programmatic" reset is deterministic in tests.
globalThis.requestAnimationFrame = (callback: FrameRequestCallback) => {
  callback(0)
  return 0
}
globalThis.cancelAnimationFrame = () => {}

// jsdom does not implement matchMedia; provide a light stub (light theme).
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }),
})
