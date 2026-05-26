"use client";

import { useState, useEffect } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

/**
 * Returns `true` when the user prefers reduced motion.
 * Subscribes to OS-level changes and updates reactively.
 */
export function useReducedMotion(): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(QUERY).matches;
  });

  useEffect(() => {
    const mql = window.matchMedia(QUERY);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener("change", handler);
    // Sync in case SSR value differs from client
    setMatches(mql.matches);
    return () => mql.removeEventListener("change", handler);
  }, []);

  return matches;
}
