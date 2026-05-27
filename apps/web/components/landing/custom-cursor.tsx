"use client";

import * as React from "react";
import { motion, useMotionValue, useSpring } from "motion/react";

type CursorMode = "default" | "swatch" | "sparkle";

interface CustomCursorContextValue {
  setMode: (mode: CursorMode) => void;
  setSwatchColor: (color: string) => void;
}

const CustomCursorContext = React.createContext<CustomCursorContextValue>({
  setMode: () => {},
  setSwatchColor: () => {},
});

export function useCustomCursor() {
  return React.useContext(CustomCursorContext);
}

export function CustomCursorProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = React.useState<CursorMode>("default");
  const [swatchColor, setSwatchColor] = React.useState("#F59E0B");
  const [isTouch, setIsTouch] = React.useState(true); // default to touch to avoid flash

  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);
  const springX = useSpring(mouseX, { damping: 25, stiffness: 400 });
  const springY = useSpring(mouseY, { damping: 25, stiffness: 400 });

  // Trailing dot — slower spring
  const trailX = useSpring(mouseX, { damping: 40, stiffness: 200 });
  const trailY = useSpring(mouseY, { damping: 40, stiffness: 200 });

  React.useEffect(() => {
    const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;
    setIsTouch(isTouchDevice);

    if (isTouchDevice) return;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  if (isTouch) {
    return (
      <CustomCursorContext.Provider value={{ setMode, setSwatchColor }}>
        {children}
      </CustomCursorContext.Provider>
    );
  }

  return (
    <CustomCursorContext.Provider value={{ setMode, setSwatchColor }}>
      <div className="landing-cursor-scope">
        {children}

        {/* Main cursor */}
        <motion.div
          className="fixed top-0 left-0 pointer-events-none z-[9999]"
          style={{ x: springX, y: springY, willChange: "transform" }}
        >
          {mode === "default" && (
            <motion.div
              className="rounded-full bg-foreground"
              initial={{ width: 8, height: 8 }}
              animate={{ width: 8, height: 8, x: -4, y: -4 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          )}
          {mode === "swatch" && (
            <motion.div
              className="rounded-md border border-border"
              initial={{ width: 8, height: 8, x: -4, y: -4 }}
              animate={{ width: 24, height: 16, x: -12, y: -8 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              style={{ backgroundColor: swatchColor }}
            />
          )}
          {mode === "sparkle" && (
            <motion.div
              className="flex items-center justify-center"
              initial={{ width: 8, height: 8, x: -4, y: -4 }}
              animate={{ width: 20, height: 20, x: -10, y: -10 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            >
              <svg viewBox="0 0 20 20" className="size-5">
                <motion.path
                  d="M10 0 L12 7 L20 10 L12 13 L10 20 L8 13 L0 10 L8 7 Z"
                  fill="currentColor"
                  className="text-foreground"
                  animate={{ rotate: [0, 360] }}
                  transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                />
              </svg>
            </motion.div>
          )}
        </motion.div>

        {/* Trailing dot (only in default mode) */}
        {mode === "default" && (
          <motion.div
            className="fixed top-0 left-0 pointer-events-none z-[9998]"
            style={{ x: trailX, y: trailY, willChange: "transform" }}
          >
            <div className="w-1 h-1 -ml-0.5 -mt-0.5 rounded-full bg-foreground/40" />
          </motion.div>
        )}
      </div>
    </CustomCursorContext.Provider>
  );
}
