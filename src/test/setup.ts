import '@testing-library/jest-dom/vitest'

// jsdom has no layout engine, so requestAnimationFrame is stubbed to a no-op.
// The ScrollSync tests dispatch scroll events explicitly instead of relying on
// the frame-based safety reset.
globalThis.requestAnimationFrame = () => 0
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
