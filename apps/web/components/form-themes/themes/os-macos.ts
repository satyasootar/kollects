import type { ThemeConfig } from "../_types";

const config: ThemeConfig = {
  id: "os.macos",
  name: "Sequoia",
  category: "os",
  colorScheme: "light",
  colors: {
    background: "#f5f0ff",
    surface: "rgba(255,255,255,0.6)",
    surfaceMuted: "rgba(255,255,255,0.4)",
    border: "rgba(255,255,255,0.3)",
    foreground: "#1D1D1F",
    foregroundSoft: "#6e6e73",
    accent: "#007AFF",
    accentForeground: "#ffffff",
    success: "#34C759",
    danger: "#FF3B30",
  },
  fonts: {
    display: "SF Pro Display, system-ui, sans-serif",
    body: "SF Pro Text, system-ui, sans-serif",
    mono: "SF Mono, monospace",
    weights: { display: 700, body: 400 },
    scale: { hero: 2.5, question: 1.5, body: 1, helper: 0.875 },
  },
  shape: {
    radius: 14,
    radiusLg: 20,
    border: { width: 1, style: "solid", color: "rgba(255,255,255,0.3)" },
    shadow: "0 30px 60px -20px rgba(0,0,0,0.18)",
    shadowFocus: "0 0 0 4px rgba(0,122,255,0.3)",
  },
  motion: {
    questionEnter: "fade",
    transitionMs: 250,
    easing: "cubic-bezier(0.25, 0.1, 0.25, 1)",
  },
  stickers: { hero: "🍎" },
  chrome: {
    progressBar: "dots",
    questionLayout: "card-stack",
    submitButtonVariant: "metallic",
  },
};

export default config;
