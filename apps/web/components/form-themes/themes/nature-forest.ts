import type { ThemeConfig } from "../_types";

const config: ThemeConfig = {
  id: "nature.forest",
  name: "Whispering Pines",
  category: "nature",
  colorScheme: "dark",
  colors: {
    background: "#0F1A14",
    surface: "#15241B",
    surfaceMuted: "#1a2e22",
    border: "#2a4a35",
    foreground: "#E8F0E2",
    foregroundSoft: "#a0c0a0",
    accent: "#82C272",
    accentForeground: "#0F1A14",
    success: "#82C272",
    danger: "#ef4444",
  },
  fonts: {
    display: "Cormorant Garamond, serif",
    body: "Manrope, sans-serif",
    weights: { display: 600, body: 500 },
    scale: { hero: 2.5, question: 1.5, body: 1, helper: 0.875 },
  },
  shape: {
    radius: 18,
    radiusLg: 24,
    border: { width: 1, style: "solid", color: "#2a4a35" },
    shadow: "0 8px 32px rgba(0,0,0,0.3)",
    shadowFocus: "0 0 0 3px rgba(130,194,114,0.3)",
  },
  motion: {
    questionEnter: "leaf-fall",
    transitionMs: 400,
    easing: "cubic-bezier(0.22, 1, 0.36, 1)",
    backgroundMotion: "leaves",
  },
  stickers: { hero: "🌲", successHero: "Thank you, traveller." },
  chrome: {
    progressBar: "dots",
    questionLayout: "split",
    submitButtonVariant: "leaf",
  },
};

export default config;
