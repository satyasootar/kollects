import type { ThemeConfig } from "../_types";

const config: ThemeConfig = {
  id: "city.osaka",
  name: "Dōtonbori",
  category: "city",
  colorScheme: "dark",
  colors: {
    background: "#0A0A1A",
    surface: "#13132A",
    surfaceMuted: "#1a1a3a",
    border: "#FF2D6F",
    foreground: "#FFFFFF",
    foregroundSoft: "#c0c0ff",
    accent: "#FF2D6F",
    accentForeground: "#ffffff",
    success: "#1FE0E0",
    danger: "#FF2D6F",
  },
  fonts: {
    display: "Zen Kaku Gothic New, sans-serif",
    body: "Noto Sans JP, sans-serif",
    weights: { display: 900, body: 400 },
    scale: { hero: 3, question: 1.5, body: 1, helper: 0.875 },
  },
  shape: {
    radius: 4,
    radiusLg: 8,
    border: { width: 1, style: "solid", color: "#FF2D6F" },
    shadow: "0 0 24px #FF2D6F, 0 0 48px rgba(255,45,111,0.4)",
    shadowFocus: "0 0 16px #1FE0E0",
  },
  motion: {
    questionEnter: "fade",
    transitionMs: 300,
    easing: "cubic-bezier(0.4, 0, 0.2, 1)",
  },
  stickers: { hero: "🏮", successHero: "ありがとう" },
  chrome: {
    progressBar: "bar",
    questionLayout: "centered",
    submitButtonVariant: "neon",
  },
};

export default config;
