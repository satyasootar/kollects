import type { ThemeConfig } from "../_types";

const config: ThemeConfig = {
  id: "os.windowsxp",
  name: "Bliss",
  category: "os",
  colorScheme: "light",
  colors: {
    background: "#3A6EA5",
    surface: "#ECE9D8",
    surfaceMuted: "#d4d0c8",
    border: "#0054E3",
    foreground: "#000000",
    foregroundSoft: "#333333",
    accent: "#316AC5",
    accentForeground: "#ffffff",
    success: "#008000",
    danger: "#ff0000",
  },
  fonts: {
    display: "Trebuchet MS, sans-serif",
    body: "Tahoma, sans-serif",
    mono: "Lucida Console, monospace",
    weights: { display: 700, body: 400 },
    scale: { hero: 2, question: 1.25, body: 1, helper: 0.875 },
  },
  shape: {
    radius: 8,
    radiusLg: 8,
    border: { width: 2, style: "solid", color: "#0054E3" },
    shadow: "2px 2px 12px rgba(0,0,0,0.3)",
    shadowFocus: "0 0 0 2px #316AC5",
  },
  motion: {
    questionEnter: "slide-up",
    transitionMs: 200,
    easing: "cubic-bezier(0.4, 0, 0.2, 1)",
  },
  stickers: { hero: "🪟", successHero: "✓ OK" },
  chrome: {
    progressBar: "loading-bar-xp",
    questionLayout: "card-stack",
    submitButtonVariant: "metallic",
  },
};

export default config;
