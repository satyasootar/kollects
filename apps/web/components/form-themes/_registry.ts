import type { ThemeConfig } from "./_types";
import { themeConfigSchema } from "./_types";

type ThemeLoader = () => Promise<{ default: ThemeConfig }>;

const registry = new Map<string, ThemeLoader>();

export function registerTheme(id: string, loader: ThemeLoader) {
  registry.set(id, loader);
}

export function getRegisteredThemeIds(): string[] {
  return Array.from(registry.keys());
}

// Default light theme (fallback)
const DEFAULT_LIGHT_THEME: ThemeConfig = {
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

export async function loadTheme(id: string): Promise<ThemeConfig> {
  const loader = registry.get(id);
  if (!loader) {
    console.warn(
      `[theme-registry] Theme "${id}" not found, using default-light`,
    );
    return DEFAULT_LIGHT_THEME;
  }

  try {
    const module = await loader();
    const config = themeConfigSchema.parse(module.default);
    return config;
  } catch (err) {
    console.error(`[theme-registry] Failed to load theme "${id}":`, err);
    return DEFAULT_LIGHT_THEME;
  }
}

export { DEFAULT_LIGHT_THEME };
