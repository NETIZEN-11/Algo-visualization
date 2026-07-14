import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Make sure each test starts with a clean DOM and unmounted components.
afterEach(() => {
  cleanup()
})

// Stub matchMedia (jsdom doesn't implement it; some hooks call it).
if (!window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })
}

// jsdom doesn't implement ResizeObserver; pages with framer-motion sometimes
// touch it.
class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.ResizeObserver = MockResizeObserver
window.IntersectionObserver = MockResizeObserver

// framer-motion will try to use scrollIntoView when an element gets focused.
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = function () {}
}
