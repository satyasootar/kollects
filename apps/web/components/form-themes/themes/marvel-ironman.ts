import type { ThemeConfig } from "../_types";
import "./marvel-ironman.css";

const config: ThemeConfig = {
  id: "marvel.ironman",
  name: "Iron Man",
  category: "marvel",
  colorScheme: "dark",
  colors: {
    background: "#050000",
    surface: "#110202",
    surfaceMuted: "#220505",
    border: "#F59E0B",
    foreground: "#FCA5A5",
    foregroundSoft: "#B91C1C",
    accent: "#F59E0B",
    accentForeground: "#000000",
    success: "#F59E0B",
    danger: "#EF4444",
  },
  fonts: {
    display: "Orbitron, sans-serif",
    body: "Rajdhani, sans-serif",
    mono: "Share Tech Mono, monospace",
    weights: { display: 800, body: 600 },
    scale: { hero: 2.5, question: 1.5, body: 1, helper: 0.875 },
    letterSpacing: { hero: "0.08em" },
    textTransform: "uppercase",
  },
  shape: {
    radius: 4,
    radiusLg: 8,
    border: { width: 1, style: "solid", color: "#F59E0B" },
    shadow: "0 0 15px -3px rgba(245, 158, 11, 0.4)",
    shadowFocus: "0 0 20px rgba(245, 158, 11, 0.8)",
  },
  motion: {
    questionEnter: "boot-up",
    transitionMs: 400,
    easing: "cubic-bezier(0.22, 1, 0.36, 1)",
    backgroundMotion: "drift",
  },
  stickers: { hero: "⚡", submitIcon: "🚀", successHero: "SYSTEM ONLINE" },
  chrome: {
    progressBar: "stepper",
    questionLayout: "left-aligned",
    submitButtonVariant: "metallic",
  },
};

export default config;
