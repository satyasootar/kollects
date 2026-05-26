import type { ThemeConfig } from "../_types";

const config: ThemeConfig = {
  id: "os.linux-terminal",
  name: "$ kollects",
  category: "os",
  colorScheme: "dark",
  colors: {
    background: "#0C0C0C",
    surface: "#0C0C0C",
    surfaceMuted: "#1a1a1a",
    border: "#33FF33",
    foreground: "#F0F0F0",
    foregroundSoft: "#888888",
    accent: "#33FF33",
    accentForeground: "#0C0C0C",
    success: "#33FF33",
    danger: "#FF7733",
  },
  fonts: {
    display: "JetBrains Mono, monospace",
    body: "JetBrains Mono, monospace",
    mono: "JetBrains Mono, monospace",
    weights: { display: 500, body: 500 },
    scale: { hero: 1.5, question: 1.25, body: 1, helper: 0.875 },
  },
  shape: {
    radius: 0,
    radiusLg: 0,
    border: { width: 1, style: "solid", color: "#33FF33" },
    shadow: "none",
    shadowFocus: "0 0 8px #33FF33",
  },
  motion: {
    questionEnter: "type-on",
    transitionMs: 50,
    easing: "linear",
    backgroundMotion: "scanlines",
  },
  stickers: { hero: ">_", successHero: "Process exited with code 0. ✔" },
  chrome: {
    progressBar: "terminal-cursor",
    questionLayout: "left-aligned",
    submitButtonVariant: "terminal",
  },
};

export default config;
