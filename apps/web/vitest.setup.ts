import "@testing-library/jest-dom";

// Polyfill window.matchMedia for jsdom (it doesn't implement it)
// This allows tests to query prefers-reduced-motion and other media queries
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});
