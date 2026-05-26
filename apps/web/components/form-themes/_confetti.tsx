"use client";

import * as React from "react";
import { useReducedMotion } from "~/hooks/use-reduced-motion";

export interface ConfettiConfig {
  particles: string[]; // SVG strings or emoji
  count: number;
  gravity: number;
  spread: number;
  duration: number;
}

interface ConfettiProps {
  config: ConfettiConfig | undefined;
  trigger: boolean;
}

export function Confetti({ config, trigger }: ConfettiProps) {
  const reducedMotion = useReducedMotion();

  if (!config || !trigger || reducedMotion) return null;

  return (
    <div
      className="fixed inset-0 pointer-events-none z-50 overflow-hidden"
      aria-hidden="true"
    >
      {Array.from({ length: config.count }).map((_, i) => (
        <span
          key={i}
          className="absolute animate-[confetti-fall_2s_ease-out_forwards]"
          style={{
            left: `${Math.random() * 100}%`,
            top: `-${Math.random() * 20}%`,
            animationDelay: `${Math.random() * 0.5}s`,
            fontSize: "1.5rem",
          }}
        >
          {config.particles[i % config.particles.length]}
        </span>
      ))}
    </div>
  );
}
