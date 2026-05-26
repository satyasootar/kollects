import type { ThemeConfig } from "../_types";

const config: ThemeConfig = {
  id: "marvel.spiderman",
  name: "Spider-Verse",
  category: "marvel",
  colorScheme: "light",
  colors: {
    background: "#FFF8E7",
    surface: "#ffffff",
    surfaceMuted: "#f5f0e0",
    border: "#000000",
    foreground: "#1a1a1a",
    foregroundSoft: "#555555",
    accent: "#D72638",
    accentForeground: "#ffffff",
    success: "#10b981",
    danger: "#D72638",
  },
  fonts: {
    display: "Bangers, cursive",
    body: "Comic Neue, cursive",
    weights: { display: 400, body: 700 },
    scale: { hero: 3, question: 1.75, body: 1, helper: 0.875 },
  },
  shape: {
    radius: 8,
    radiusLg: 12,
    border: { width: 3, style: "solid", color: "#000000" },
    shadow: "4px 4px 0 #000, 8px 8px 0 #D72638",
    shadowFocus: "0 0 0 3px #D72638",
  },
  motion: {
    questionEnter: "comic-pop",
    transitionMs: 300,
    easing: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
  },
  stickers: { hero: "🕷️", submitIcon: "🕸️", successHero: "THWIP!" },
  chrome: {
    progressBar: "comic-panels",
    questionLayout: "centered",
    submitButtonVariant: "comic-burst",
  },
};

export default config;
