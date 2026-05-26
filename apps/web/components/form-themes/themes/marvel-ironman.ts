import type { ThemeConfig } from "../_types";

const config: ThemeConfig = {
  id: "marvel.ironman",
  name: "Mark IV",
  category: "marvel",
  colorScheme: "dark",
  colors: {
    background: "#0B1220",
    surface: "#0F1A2E",
    surfaceMuted: "#1a2540",
    border: "#F2C76A",
    foreground: "#F4F4F5",
    foregroundSoft: "#a0a0a0",
    accent: "#F2C76A",
    accentForeground: "#0B1220",
    success: "#10b981",
    danger: "#E84F3D",
  },
  fonts: {
    display: "Orbitron, sans-serif",
    body: "Rajdhani, sans-serif",
    mono: "Share Tech Mono, monospace",
    weights: { display: 800, body: 500 },
    scale: { hero: 2.5, question: 1.5, body: 1, helper: 0.875 },
    letterSpacing: { hero: "0.08em" },
    textTransform: "uppercase",
  },
  shape: {
    radius: 2,
    radiusLg: 4,
    border: { width: 1, style: "solid", color: "#F2C76A" },
    shadow: "0 0 24px -8px #F2C76A",
    shadowFocus: "0 0 16px #F2C76A",
  },
  motion: {
    questionEnter: "boot-up",
    transitionMs: 400,
    easing: "cubic-bezier(0.22, 1, 0.36, 1)",
    backgroundMotion: "drift",
  },
  stickers: { hero: "⚡", submitIcon: "⚡", successHero: "SYSTEM ONLINE" },
  chrome: {
    progressBar: "stepper",
    questionLayout: "left-aligned",
    submitButtonVariant: "metallic",
  },
};

export default config;
