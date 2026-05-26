import type { ThemeConfig } from "../_types";

const config: ThemeConfig = {
  id: "dc.batman",
  name: "Gotham",
  category: "dc",
  colorScheme: "dark",
  colors: {
    background: "#0A0E14",
    surface: "#141821",
    surfaceMuted: "#1c2030",
    border: "#2a2e38",
    foreground: "#E5E7EB",
    foregroundSoft: "#9CA3AF",
    accent: "#FFE45C",
    accentForeground: "#0A0E14",
    success: "#10b981",
    danger: "#ef4444",
  },
  fonts: {
    display: "Bebas Neue, sans-serif",
    body: "Inter Tight, sans-serif",
    mono: "Space Mono, monospace",
    weights: { display: 400, body: 500 },
    scale: { hero: 3, question: 1.5, body: 1, helper: 0.875 },
  },
  shape: {
    radius: 0,
    radiusLg: 0,
    border: { width: 1, style: "solid", color: "#2a2e38" },
    shadow: "none",
    shadowFocus: "0 0 32px -10px #FFE45C",
  },
  motion: {
    questionEnter: "fade",
    transitionMs: 300,
    easing: "cubic-bezier(0.4, 0, 0.2, 1)",
    backgroundMotion: "rain",
  },
  stickers: { hero: "🦇", successHero: "JUSTICE SERVED" },
  chrome: {
    progressBar: "bar",
    questionLayout: "left-aligned",
    submitButtonVariant: "metallic",
  },
};

export default config;
