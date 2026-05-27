import type { ThemeConfig } from "../_types";

const config: ThemeConfig = {
  id: "marvel.spidyform",
  name: "Spidyform",
  category: "marvel",
  colorScheme: "dark",
  colors: {
    background: "#120000",
    surface: "#7C0000",
    surfaceMuted: "#5C0000",
    border: "#2A2A2A",
    foreground: "#FFFFFF",
    foregroundSoft: "#CCCCCC",
    accent: "#B30000",
    accentForeground: "#FFFFFF",
    success: "#10b981",
    danger: "#ef4444",
  },
  fonts: {
    display: "'Bebas Neue', sans-serif",
    body: "'Inter', sans-serif",
    weights: { display: 400, body: 400 },
    scale: { hero: 2.5, question: 1.25, body: 1, helper: 0.875 },
    letterSpacing: {
      question: "1px",
    },
    textTransform: "uppercase",
  },
  shape: {
    radius: 4,
    radiusLg: 8,
    border: { width: 2, style: "solid", color: "#2A2A2A" },
    shadow: "0 10px 25px rgba(0,0,0,0.8)",
    shadowFocus: "0 0 0 2px #ff0000",
  },
  motion: {
    questionEnter: "slide-up",
    transitionMs: 250,
    easing: "cubic-bezier(0.4, 0, 0.2, 1)",
  },
  stickers: { hero: "", submitIcon: "" },
  chrome: {
    progressBar: "bar",
    questionLayout: "centered",
    submitButtonVariant: "marker",
  },
};

export default config;
