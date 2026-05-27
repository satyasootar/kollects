"use client";

import * as React from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { useCustomCursor } from "./custom-cursor";

interface Fragment {
  id: string;
  content: React.ReactNode;
  x: number;       // initial position offset from center (%)
  y: number;       // initial position offset from center (%)
  scatterX: number; // scatter target
  scatterY: number;
  amplitude: number;
  period: number;
  phase: number;
  accentColor?: string;
}

const FRAGMENTS: Fragment[] = [
  {
    id: "rating",
    content: (
      <div className="flex gap-0.5 bg-card border border-border rounded-xl px-3 py-2 shadow-sm">
        {[1, 2, 3, 4, 5].map((i) => (
          <span key={i} className={i <= 3 ? "text-amber-400" : "text-border"} style={{ fontSize: "14px" }}>★</span>
        ))}
      </div>
    ),
    x: -55, y: -25, scatterX: -120, scatterY: -80, amplitude: 10, period: 3.5, phase: 0,
    accentColor: "#F59E0B",
  },
  {
    id: "swatches",
    content: (
      <div className="flex gap-1.5 bg-card border border-border rounded-full px-3 py-2 shadow-sm">
        {["#F59E0B", "#7CFF59", "#FFE45C", "#e78a53"].map((c) => (
          <div key={c} className="w-3.5 h-3.5 rounded-full border border-black/10" style={{ backgroundColor: c }} />
        ))}
      </div>
    ),
    x: 55, y: -30, scatterX: 130, scatterY: -90, amplitude: 12, period: 4, phase: 1,
    accentColor: "#7CFF59",
  },
  {
    id: "submit-btn",
    content: (
      <div className="bg-foreground text-background rounded-full px-4 py-1.5 text-xs font-medium shadow-sm">
        Submit →
      </div>
    ),
    x: 60, y: 20, scatterX: 140, scatterY: 60, amplitude: 8, period: 3.2, phase: 2,
  },
  {
    id: "input-focused",
    content: (
      <div
        className="bg-card rounded-lg px-3 py-1.5 text-xs text-muted-foreground border-2 shadow-sm"
        style={{ borderColor: "#0d2e2a", boxShadow: "0 0 0 3px rgba(13,46,42,0.15)" }}
      >
        you@email.com
      </div>
    ),
    x: -58, y: 25, scatterX: -130, scatterY: 70, amplitude: 9, period: 3.8, phase: 0.5,
  },
  {
    id: "theme-card",
    content: (
      <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm w-16">
        <div className="h-2 bg-gradient-to-r from-amber-400 to-red-500" />
        <div className="p-1.5 space-y-1">
          <div className="h-1 w-10 bg-muted rounded-full" />
          <div className="h-1 w-6 bg-muted rounded-full" />
        </div>
      </div>
    ),
    x: -45, y: -55, scatterX: -100, scatterY: -130, amplitude: 11, period: 4.2, phase: 1.5,
    accentColor: "#FFE45C",
  },
  {
    id: "checkbox",
    content: (
      <div className="flex items-center gap-1.5 bg-card border border-border rounded-lg px-3 py-1.5 shadow-sm">
        <div className="w-3.5 h-3.5 rounded border-2 border-foreground flex items-center justify-center">
          <svg viewBox="0 0 12 12" className="size-2.5 text-foreground"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
        <span className="text-xs text-foreground font-medium">Required</span>
      </div>
    ),
    x: 50, y: -55, scatterX: 120, scatterY: -120, amplitude: 10, period: 3.6, phase: 2.5,
  },
  {
    id: "progress-bar",
    content: (
      <div className="bg-card border border-border rounded-full shadow-sm px-3 py-2 w-24">
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div className="h-full w-3/5 bg-foreground rounded-full" />
        </div>
      </div>
    ),
    x: -50, y: 55, scatterX: -110, scatterY: 120, amplitude: 13, period: 4.5, phase: 3,
  },
  {
    id: "dropdown",
    content: (
      <div className="flex items-center gap-1 bg-card border border-border rounded-lg px-3 py-1.5 shadow-sm">
        <span className="text-xs text-muted-foreground">Select a theme</span>
        <svg viewBox="0 0 12 12" className="size-3 text-muted-foreground"><path d="M3 5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" /></svg>
      </div>
    ),
    x: 45, y: 55, scatterX: 110, scatterY: 130, amplitude: 9, period: 3.3, phase: 0.8,
    accentColor: "#e78a53",
  },
];

function FragmentItem({
  fragment,
  scrollProgress,
}: {
  fragment: Fragment;
  scrollProgress: ReturnType<typeof useTransform<number, number>>;
}) {
  const { setMode, setSwatchColor } = useCustomCursor();

  const scatterX = useTransform(scrollProgress, [0, 0.3], [0, fragment.scatterX]);
  const scatterY = useTransform(scrollProgress, [0, 0.3], [0, fragment.scatterY]);
  const scatterOpacity = useTransform(scrollProgress, [0.15, 0.35], [1, 0]);

  return (
    <motion.div
      className="absolute"
      style={{
        left: `calc(50% + ${fragment.x}%)`,
        top: `calc(50% + ${fragment.y}%)`,
        x: scatterX,
        y: scatterY,
        opacity: scatterOpacity,
        willChange: "transform",
      }}
      animate={{
        translateY: [0, fragment.amplitude, 0],
      }}
      transition={{
        translateY: {
          repeat: Infinity,
          duration: fragment.period,
          ease: "easeInOut",
          delay: fragment.phase,
        },
      }}
      onMouseEnter={() => {
        if (fragment.accentColor) {
          setSwatchColor(fragment.accentColor);
          setMode("swatch");
        }
      }}
      onMouseLeave={() => setMode("default")}
    >
      {fragment.content}
    </motion.div>
  );
}

export function FloatingFragments({ containerRef }: { containerRef: React.RefObject<HTMLElement | null> }) {
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className="relative w-full h-full pointer-events-auto">
        {FRAGMENTS.map((fragment) => (
          <FragmentItem
            key={fragment.id}
            fragment={fragment}
            scrollProgress={scrollYProgress}
          />
        ))}
      </div>
    </div>
  );
}
