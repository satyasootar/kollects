/**
 * Smoke test to verify the Vitest + RTL + jsdom setup works correctly.
 * This file validates Phase 0 requirements:
 * - Vitest globals available (describe, it, expect, vi)
 * - jsdom environment provides DOM APIs
 * - @testing-library/jest-dom matchers work
 * - matchMedia polyfill is functional
 * - ~/  path alias resolves
 */

import { cn } from "~/lib/utils";

describe("Phase 0 — Setup Smoke Test", () => {
  it("vitest globals are available without imports", () => {
    expect(true).toBe(true);
    expect(vi).toBeDefined();
  });

  it("jsdom provides document and window", () => {
    expect(document).toBeDefined();
    expect(window).toBeDefined();
    expect(document.createElement).toBeInstanceOf(Function);
  });

  it("jest-dom matchers work", () => {
    const div = document.createElement("div");
    document.body.appendChild(div);
    expect(div).toBeInTheDocument();
    document.body.removeChild(div);
  });

  it("matchMedia polyfill returns a MediaQueryList-compatible object", () => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    expect(mql).toBeDefined();
    expect(mql.matches).toBe(false);
    expect(mql.media).toBe("(prefers-reduced-motion: reduce)");
    expect(typeof mql.addEventListener).toBe("function");
    expect(typeof mql.removeEventListener).toBe("function");
  });

  it("~/ path alias resolves correctly", () => {
    // cn is imported from ~/lib/utils — if this resolves, the alias works
    expect(cn).toBeInstanceOf(Function);
    expect(cn("foo", "bar")).toBe("foo bar");
  });
});
