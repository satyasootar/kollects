import type { ThemeConfig } from "../_types";

const config: ThemeConfig = {
  id: "marvel.hulk",
  name: "Smash",
  category: "marvel",
  colorScheme: "dark",
  colors: {
    background: "#0B1A0E",
    surface: "#143A1C",
    surfaceMuted: "#1a4a24",
    border: "#7CFF59",
    foreground: "#E8FFD7",
    foregroundSoft: "#a0d090",
    accent: "#7CFF59",
    accentForeground: "#0B1A0E",
    success: "#7CFF59",
    danger: "#7C2A2A",
  },
  fonts: {
    display: "Bungee Inline, cursive",
    body: "IBM Plex Sans, sans-serif",
    weights: { display: 400, body: 600 },
    scale: { hero: 3, question: 1.75, body: 1, helper: 0.875 },
  },
  shape: {
    radius: 20,
    radiusLg: 24,
    border: { width: 2, style: "solid", color: "#7CFF59" },
    shadow: "0 12px 0 -6px #7CFF59",
    shadowFocus: "0 0 16px #7CFF59",
  },
  motion: {
    questionEnter: "comic-pop",
    transitionMs: 250,
    easing: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
  },
  stickers: { hero: "💪", submitIcon: "✊", successHero: "SMASHED IT" },
  chrome: {
    progressBar: "comic-panels",
    questionLayout: "centered",
    submitButtonVariant: "comic-burst",
  },
};

export default config;
