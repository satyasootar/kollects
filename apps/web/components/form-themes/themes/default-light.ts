import type { ThemeConfig } from "../_types";

const config: ThemeConfig = {
  id: "default-light",
  name: "Default Light",
  category: "custom",
  colorScheme: "light",
  colors: {
    background: "#ffffff",
    surface: "#f9fafb",
    surfaceMuted: "#f3f4f6",
    border: "#e5e7eb",
    foreground: "#111827",
    foregroundSoft: "#6b7280",
    accent: "#0d2e2a",
    accentForeground: "#ffffff",
    success: "#10b981",
    danger: "#ef4444",
  },
  fonts: {
    display: "system-ui, sans-serif",
    body: "system-ui, sans-serif",
    weights: { display: 700, body: 400 },
    scale: { hero: 2.5, question: 1.5, body: 1, helper: 0.875 },
  },
  shape: {
    radius: 10,
    radiusLg: 16,
    border: { width: 1, style: "solid", color: "#e5e7eb" },
    shadow: "0 1px 3px rgba(0,0,0,0.1)",
    shadowFocus: "0 0 0 3px rgba(13,46,42,0.2)",
  },
  motion: {
    questionEnter: "fade",
    transitionMs: 200,
    easing: "cubic-bezier(0.4, 0, 0.2, 1)",
  },
  stickers: {},
  chrome: {
    progressBar: "bar",
    questionLayout: "card-stack",
    submitButtonVariant: "marker",
  },
};

export default config;
