"use client";

import * as React from "react";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValueEvent,
  AnimatePresence,
} from "motion/react";

// 8 actual Custom Presets from the codebase — curated for maximum visual variety
const SCROLL_THEMES = [
  {
    name: "Default Light",
    bg: "#ffffff", surface: "#ffffff", fg: "#0a0a0a", fgSoft: "#737373",
    accent: "#171717", accentFg: "#fafafa", border: "#e5e5e5",
    radius: 10, font: "system-ui, sans-serif",
  },
  {
    name: "Violet",
    bg: "#ffffff", surface: "#ffffff", fg: "#312e81", fgSoft: "#7c3aed",
    accent: "#8b5cf6", accentFg: "#ffffff", border: "#e0e7ff",
    radius: 10, font: "'Roboto', sans-serif",
  },
  {
    name: "Bubble Gum",
    bg: "#f6e6ee", surface: "#fdedc9", fg: "#5b5b5b", fgSoft: "#7a7a7a",
    accent: "#d04f99", accentFg: "#ffffff", border: "#d04f99",
    radius: 6, font: "'Poppins', sans-serif",
  },
  {
    name: "Claude",
    bg: "#faf9f5", surface: "#faf9f5", fg: "#3d3929", fgSoft: "#83827d",
    accent: "#c96442", accentFg: "#ffffff", border: "#dad9d4",
    radius: 8, font: "system-ui, sans-serif",
  },
  {
    name: "Catppuccin",
    bg: "#181825", surface: "#1e1e2e", fg: "#cdd6f4", fgSoft: "#a6adc8",
    accent: "#cba6f7", accentFg: "#1e1e2e", border: "#313244",
    radius: 6, font: "'Montserrat', sans-serif",
  },
  {
    name: "Cyberpunk",
    bg: "#0c0c1d", surface: "#1e1e3f", fg: "#eceff4", fgSoft: "#8085a6",
    accent: "#ff00c8", accentFg: "#ffffff", border: "#2e2e5e",
    radius: 8, font: "'Outfit', sans-serif",
  },
  {
    name: "Darkmater",
    bg: "#121113", surface: "#121212", fg: "#c1c1c1", fgSoft: "#888888",
    accent: "#e78a53", accentFg: "#121113", border: "#222222",
    radius: 12, font: "'Geist Mono', monospace",
  },
  {
    name: "Kodama Grove",
    bg: "#e4d7b0", surface: "#e7dbbf", fg: "#5c4b3e", fgSoft: "#85766a",
    accent: "#8d9d4f", accentFg: "#fdfbf6", border: "#b19681",
    radius: 6, font: "'Merriweather', serif",
  },
];

const GOOGLE_FONTS = [
  "Roboto:wght@400;500;700",
  "Poppins:wght@400;500;600;700",
  "Montserrat:wght@400;500;600;700",
  "Outfit:wght@400;500;600;700",
  "Merriweather:wght@400;700",
];

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function lerpColor(a: string, b: string, t: number) {
  const parse = (hex: string) => {
    const h = hex.replace("#", "");
    return [parseInt(h.substring(0, 2), 16), parseInt(h.substring(2, 4), 16), parseInt(h.substring(4, 6), 16)];
  };
  const [r1, g1, b1] = parse(a);
  const [r2, g2, b2] = parse(b);
  return `rgb(${Math.round(lerp(r1!, r2!, t))}, ${Math.round(lerp(g1!, g2!, t))}, ${Math.round(lerp(b1!, b2!, t))})`;
}

function ThemeForm({ style }: { style: Record<string, string> }) {
  const fields = [
    { label: "Full name", placeholder: "John Doe" },
    { label: "Email address", placeholder: "you@email.com" },
    { label: "How would you rate us?", type: "rating" },
  ];

  return (
    <div
      className="w-full max-w-md mx-auto p-8 border transition-all duration-150"
      style={{
        backgroundColor: style.surface,
        borderColor: style.border,
        borderRadius: `${style.radius}px`,
        fontFamily: style.font,
      }}
    >
      <h3
        className="text-xl font-bold mb-1"
        style={{ color: style.fg }}
      >
        Feedback Form
      </h3>
      <p className="text-sm mb-6" style={{ color: style.fgSoft }}>
        We&apos;d love to hear from you.
      </p>

      <div className="space-y-5">
        {fields.map((field) => (
          <div key={field.label}>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: style.fg }}
            >
              {field.label}
            </label>
            {field.type === "rating" ? (
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <span
                    key={i}
                    style={{ color: i <= 4 ? style.accent : style.border, fontSize: "22px" }}
                  >
                    ★
                  </span>
                ))}
              </div>
            ) : (
              <div
                className="h-11 px-4 flex items-center text-sm border"
                style={{
                  backgroundColor: style.bg,
                  borderColor: style.border,
                  color: style.fgSoft,
                  borderRadius: `${style.radius}px`,
                }}
              >
                {field.placeholder}
              </div>
            )}
          </div>
        ))}
      </div>

      <button
        className="mt-6 w-full h-11 text-sm font-semibold transition-all"
        style={{
          backgroundColor: style.accent,
          color: style.accentFg,
          borderRadius: `${style.radius}px`,
        }}
      >
        Submit
      </button>
    </div>
  );
}

export function ThemeShowcase() {
  const sectionRef = React.useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = React.useState(0);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  const themeProgress = useTransform(scrollYProgress, [0, 0.9], [0, SCROLL_THEMES.length - 1]);

  useMotionValueEvent(themeProgress, "change", (latest) => {
    const idx = Math.round(latest);
    if (idx !== activeIndex && idx >= 0 && idx < SCROLL_THEMES.length) {
      setActiveIndex(idx);
    }
  });

  // Interpolation for smooth color blending
  const [fraction, setFraction] = React.useState(0);
  useMotionValueEvent(themeProgress, "change", (latest) => setFraction(latest));

  const floorIdx = Math.max(0, Math.min(SCROLL_THEMES.length - 2, Math.floor(fraction)));
  const t = fraction - floorIdx;
  const from = SCROLL_THEMES[floorIdx]!;
  const to = SCROLL_THEMES[Math.min(floorIdx + 1, SCROLL_THEMES.length - 1)]!;

  const interpolated = {
    bg: lerpColor(from.bg, to.bg, t),
    surface: lerpColor(from.surface, to.surface, t),
    fg: lerpColor(from.fg, to.fg, t),
    fgSoft: lerpColor(from.fgSoft, to.fgSoft, t),
    accent: lerpColor(from.accent, to.accent, t),
    accentFg: lerpColor(from.accentFg, to.accentFg, t),
    border: lerpColor(from.border, to.border, t),
    radius: `${Math.round(lerp(from.radius, to.radius, t))}`,
    font: SCROLL_THEMES[activeIndex]!.font,
  };

  const current = SCROLL_THEMES[activeIndex]!;

  // Scroll progress indicator
  const progressWidth = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <>
      {GOOGLE_FONTS.map((f) => (
        <link
          key={f}
          href={`https://fonts.googleapis.com/css2?family=${f}&display=swap`}
          rel="stylesheet"
        />
      ))}

      <section ref={sectionRef} className="relative" style={{ height: `${SCROLL_THEMES.length * 60}vh` }}>
        {/* Sticky viewport */}
        <div className="sticky top-0 h-screen flex flex-col items-center justify-center overflow-hidden">
          {/* Full-screen background that morphs */}
          <div
            className="absolute inset-0 transition-colors duration-150"
            style={{ backgroundColor: interpolated.bg }}
          />

          {/* Content */}
          <div className="relative z-10 w-full max-w-5xl mx-auto px-6">
            {/* Section label */}
            <motion.p
              className="text-xs font-semibold uppercase tracking-[0.2em] text-center mb-4"
              style={{ color: interpolated.fgSoft }}
            >
              Theme Showcase
            </motion.p>

            {/* Theme name */}
            <div className="h-12 mb-8 flex items-center justify-center overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.h2
                  key={current.name}
                  className="text-display-md text-center"
                  style={{ color: interpolated.fg }}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -24 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                >
                  {current.name}
                </motion.h2>
              </AnimatePresence>
            </div>

            {/* Form preview */}
            <ThemeForm style={interpolated} />

            {/* Progress dots */}
            <div className="flex items-center justify-center gap-2 mt-8">
              {SCROLL_THEMES.map((theme, i) => (
                <div
                  key={theme.name}
                  className="w-2 h-2 rounded-full transition-all duration-300"
                  style={{
                    backgroundColor: i === activeIndex ? interpolated.accent : interpolated.border,
                    transform: i === activeIndex ? "scale(1.4)" : "scale(1)",
                  }}
                />
              ))}
            </div>

            {/* Scroll hint */}
            <motion.p
              className="text-center mt-4 text-xs"
              style={{ color: interpolated.fgSoft }}
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
            >
              ↓ Keep scrolling to explore themes
            </motion.p>
          </div>

          {/* Progress bar at bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-1">
            <motion.div
              className="h-full"
              style={{ width: progressWidth, backgroundColor: interpolated.accent }}
            />
          </div>
        </div>
      </section>
    </>
  );
}
