import type { ThemeConfig } from "../_types";

const config: ThemeConfig = {
  id: "marvel.captainamerica",
  name: "Sentinel of Liberty",
  category: "marvel",
  colorScheme: "light",
  colors: {
    background: "#F5EFE0",
    surface: "#FFFCF2",
    surfaceMuted: "#f0e8d8",
    border: "#1B3A6B",
    foreground: "#1A1A1A",
    foregroundSoft: "#555555",
    accent: "#1B3A6B",
    accentForeground: "#ffffff",
    success: "#10b981",
    danger: "#C8102E",
  },
  fonts: {
    display: "Big Shoulders Display, sans-serif",
    body: "Lora, serif",
    weights: { display: 800, body: 500 },
    scale: { hero: 2.5, question: 1.5, body: 1, helper: 0.875 },
  },
  shape: {
    radius: 0,
    radiusLg: 0,
    border: { width: 2, style: "double", color: "#1B3A6B" },
    shadow: "4px 4px 0 #1B3A6B",
    shadowFocus: "0 0 0 3px #1B3A6B",
  },
  motion: {
    questionEnter: "slide-side",
    transitionMs: 300,
    easing: "cubic-bezier(0.4, 0, 0.2, 1)",
  },
  stickers: { hero: "★", submitIcon: "👊", successHero: "MISSION COMPLETE" },
  chrome: {
    progressBar: "stepper",
    questionLayout: "split",
    submitButtonVariant: "comic-burst",
  },
};

export default config;
