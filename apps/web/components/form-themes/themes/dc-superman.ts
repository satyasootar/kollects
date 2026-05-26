import type { ThemeConfig } from "../_types";

const config: ThemeConfig = {
  id: "dc.superman",
  name: "Man of Tomorrow",
  category: "dc",
  colorScheme: "dark",
  colors: {
    background: "#0B2A6B",
    surface: "#0A2356",
    surfaceMuted: "#0d2d70",
    border: "#FFC72C",
    foreground: "#FFFFFF",
    foregroundSoft: "#c0c0ff",
    accent: "#E5161A",
    accentForeground: "#ffffff",
    success: "#10b981",
    danger: "#E5161A",
  },
  fonts: {
    display: "Anton, sans-serif",
    body: "Source Sans 3, sans-serif",
    weights: { display: 400, body: 600 },
    scale: { hero: 3, question: 1.5, body: 1, helper: 0.875 },
  },
  shape: {
    radius: 4,
    radiusLg: 8,
    border: { width: 2, style: "solid", color: "#FFC72C" },
    shadow: "0 4px 12px rgba(229,22,26,0.3)",
    shadowFocus: "0 0 0 3px #FFC72C",
  },
  motion: {
    questionEnter: "slide-side",
    transitionMs: 200,
    easing: "cubic-bezier(0.22, 1, 0.36, 1)",
  },
  stickers: { hero: "🦸", successHero: "UP, UP, AND DONE." },
  chrome: {
    progressBar: "bar",
    questionLayout: "centered",
    submitButtonVariant: "metallic",
  },
};

export default config;
