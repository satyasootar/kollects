import type { ThemeConfig } from "../_types";

const config: ThemeConfig = {
  id: "city.mumbai",
  name: "Local Train",
  category: "city",
  colorScheme: "light",
  colors: {
    background: "#FFF5E1",
    surface: "#FFEFC7",
    surfaceMuted: "#ffe8b0",
    border: "#E63946",
    foreground: "#1A1A1A",
    foregroundSoft: "#555555",
    accent: "#E63946",
    accentForeground: "#ffffff",
    success: "#10b981",
    danger: "#E63946",
  },
  fonts: {
    display: "Yatra One, cursive",
    body: "Mukta, sans-serif",
    weights: { display: 400, body: 500 },
    scale: { hero: 2.5, question: 1.5, body: 1, helper: 0.875 },
  },
  shape: {
    radius: 6,
    radiusLg: 10,
    border: { width: 2, style: "solid", color: "#E63946" },
    shadow: "3px 3px 0 #1D4E89",
    shadowFocus: "0 0 0 3px #F4A261",
  },
  motion: {
    questionEnter: "slide-side",
    transitionMs: 300,
    easing: "cubic-bezier(0.4, 0, 0.2, 1)",
  },
  stickers: { hero: "🚂", successHero: "धन्यवाद / Thanks!" },
  chrome: {
    progressBar: "bar",
    questionLayout: "centered",
    submitButtonVariant: "marker",
  },
};

export default config;
