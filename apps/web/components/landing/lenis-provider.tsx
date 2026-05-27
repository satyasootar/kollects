"use client";

import { ReactLenis } from "lenis/react";
import type { LenisOptions } from "lenis";

export function LenisProvider({ children }: { children: React.ReactNode }) {
  const lenisOptions: LenisOptions = {
    lerp: 0.08,
    duration: 1.5,
    smoothWheel: true,
  };

  return (
    <ReactLenis root options={lenisOptions}>
      {children}
    </ReactLenis>
  );
}
