import type { ThemeConfig } from "./_types";

type DeepPartial<T> = T extends object ? {
    [P in keyof T]?: DeepPartial<T[P]>;
} : T;

export interface CustomPreset {
  id: string;
  name: string;
  config: DeepPartial<ThemeConfig>;
}

export const CUSTOM_PRESETS: CustomPreset[] = [
  {
    id: "default-light-preset",
    name: "Default Light",
    config: {
      colors: {
        background: "#ffffff",
        surface: "#ffffff",
        surfaceMuted: "#f5f5f5",
        border: "#e5e5e5",
        foreground: "#0a0a0a",
        foregroundSoft: "#737373",
        accent: "#171717",
        accentForeground: "#fafafa",
        success: "#10b981",
        danger: "#e7000b",
      },
      fonts: {
        display: "system-ui, sans-serif",
        body: "system-ui, sans-serif",
      },
      shape: {
        radius: 10,
        radiusLg: 16,
      },
    },
  },
  {
    id: "default-dark-preset",
    name: "Default Dark",
    config: {
      colors: {
        background: "#0a0a0a",
        surface: "#171717",
        surfaceMuted: "#262626",
        border: "#282828",
        foreground: "#fafafa",
        foregroundSoft: "#a1a1a1",
        accent: "#e5e5e5",
        accentForeground: "#171717",
        success: "#10b981",
        danger: "#ff6467",
      },
      fonts: {
        display: "system-ui, sans-serif",
        body: "system-ui, sans-serif",
      },
      shape: {
        radius: 10,
        radiusLg: 16,
      },
    },
  },
  {
    id: "amber-light-preset",
    name: "Amber Light",
    config: {
      colors: {
        background: "#ffffff",
        surface: "#ffffff",
        surfaceMuted: "#f9fafb",
        border: "#e5e7eb",
        foreground: "#262626",
        foregroundSoft: "#6b7280",
        accent: "#f59e0b",
        accentForeground: "#000000",
        success: "#10b981",
        danger: "#ef4444",
      },
      fonts: {
        display: "'Inter', sans-serif",
        body: "'Inter', sans-serif",
      },
      shape: {
        radius: 6,
        radiusLg: 10,
      },
    },
  },
  {
    id: "amber-dark-preset",
    name: "Amber Dark",
    config: {
      colors: {
        background: "#171717",
        surface: "#262626",
        surfaceMuted: "#1f1f1f",
        border: "#404040",
        foreground: "#e5e5e5",
        foregroundSoft: "#a3a3a3",
        accent: "#f59e0b",
        accentForeground: "#000000",
        success: "#10b981",
        danger: "#ef4444",
      },
      fonts: {
        display: "'Inter', sans-serif",
        body: "'Inter', sans-serif",
      },
      shape: {
        radius: 6,
        radiusLg: 10,
      },
    },
  },
  {
    id: "amethyst-light-preset",
    name: "Amethyst Light",
    config: {
      colors: {
        background: "#f8f7fa",
        surface: "#ffffff",
        surfaceMuted: "#dfd9ec",
        border: "#cec9d9",
        foreground: "#3d3c4f",
        foregroundSoft: "#6b6880",
        accent: "#8a79ab",
        accentForeground: "#f8f7fa",
        success: "#77b8a1",
        danger: "#d95c5c",
      },
      fonts: {
        display: "'Geist', sans-serif",
        body: "'Geist', sans-serif",
      },
      shape: {
        radius: 8,
        radiusLg: 12,
      },
    },
  },
  {
    id: "amethyst-dark-preset",
    name: "Amethyst Dark",
    config: {
      colors: {
        background: "#1a1823",
        surface: "#232030",
        surfaceMuted: "#5a5370",
        border: "#302c40",
        foreground: "#e0ddef",
        foregroundSoft: "#a09aad",
        accent: "#a995c9",
        accentForeground: "#1a1823",
        success: "#77b8a1",
        danger: "#e57373",
      },
      fonts: {
        display: "'Geist', sans-serif",
        body: "'Geist', sans-serif",
      },
      shape: {
        radius: 8,
        radiusLg: 12,
      },
    },
  },
  {
    id: "violet-light-preset",
    name: "Violet Light",
    config: {
      colors: {
        background: "#ffffff",
        surface: "#ffffff",
        surfaceMuted: "#f3f0ff",
        border: "#e0e7ff",
        foreground: "#312e81",
        foregroundSoft: "#7c3aed",
        accent: "#8b5cf6",
        accentForeground: "#ffffff",
        success: "#10b981",
        danger: "#ef4444",
      },
      fonts: {
        display: "'Roboto', sans-serif",
        body: "'Roboto', sans-serif",
      },
      shape: {
        radius: 10,
        radiusLg: 16,
      },
    },
  },
  {
    id: "violet-dark-preset",
    name: "Violet Dark",
    config: {
      colors: {
        background: "#0f172a",
        surface: "#1e1b4b",
        surfaceMuted: "#1e1b4b",
        border: "#2e1065",
        foreground: "#e0e7ff",
        foregroundSoft: "#c4b5fd",
        accent: "#8b5cf6",
        accentForeground: "#ffffff",
        success: "#10b981",
        danger: "#ef4444",
      },
      fonts: {
        display: "'Roboto', sans-serif",
        body: "'Roboto', sans-serif",
      },
      shape: {
        radius: 10,
        radiusLg: 16,
      },
    },
  },
  {
    id: "bubble-gum-light-preset",
    name: "Bubble Gum Light",
    config: {
      colors: {
        background: "#f6e6ee",
        surface: "#fdedc9",
        surfaceMuted: "#8acfd1",
        border: "#d04f99",
        foreground: "#5b5b5b",
        foregroundSoft: "#7a7a7a",
        accent: "#d04f99",
        accentForeground: "#ffffff",
        success: "#8acfd1",
        danger: "#f96f70",
      },
      fonts: {
        display: "'Poppins', sans-serif",
        body: "'Poppins', sans-serif",
      },
      shape: {
        radius: 6,
        radiusLg: 10,
      },
    },
  },
  {
    id: "bubble-gum-dark-preset",
    name: "Bubble Gum Dark",
    config: {
      colors: {
        background: "#12242e",
        surface: "#1c2e38",
        surfaceMuted: "#e4a2b1",
        border: "#324859",
        foreground: "#f3e3ea",
        foregroundSoft: "#e4a2b1",
        accent: "#fbe2a7",
        accentForeground: "#12242e",
        success: "#e4a2b1",
        danger: "#e35ea4",
      },
      fonts: {
        display: "'Poppins', sans-serif",
        body: "'Poppins', sans-serif",
      },
      shape: {
        radius: 6,
        radiusLg: 10,
      },
    },
  },
  {
    id: "coffee-light-preset",
    name: "Coffee Light",
    config: {
      colors: {
        background: "#f9f9f9",
        surface: "#fcfcfc",
        surfaceMuted: "#ffdfb5",
        border: "#d8d8d8",
        foreground: "#202020",
        foregroundSoft: "#646464",
        accent: "#644a40",
        accentForeground: "#ffffff",
        success: "#10b981",
        danger: "#e54d2e",
      },
      fonts: {
        display: "system-ui, sans-serif",
        body: "system-ui, sans-serif",
      },
      shape: {
        radius: 8,
        radiusLg: 12,
      },
    },
  },
  {
    id: "coffee-dark-preset",
    name: "Coffee Dark",
    config: {
      colors: {
        background: "#111111",
        surface: "#191919",
        surfaceMuted: "#393028",
        border: "#201e18",
        foreground: "#eeeeee",
        foregroundSoft: "#b4b4b4",
        accent: "#ffe0c2",
        accentForeground: "#081a1b",
        success: "#10b981",
        danger: "#e54d2e",
      },
      fonts: {
        display: "system-ui, sans-serif",
        body: "system-ui, sans-serif",
      },
      shape: {
        radius: 8,
        radiusLg: 12,
      },
    },
  },
  {
    id: "candy-land-light-preset",
    name: "Candy Land Light",
    config: {
      colors: {
        background: "#f7f9fa",
        surface: "#ffffff",
        surfaceMuted: "#87ceeb",
        border: "#d4d4d4",
        foreground: "#333333",
        foregroundSoft: "#6e6e6e",
        accent: "#ffc0cb",
        accentForeground: "#000000",
        success: "#33cc33",
        danger: "#ef4444",
      },
      fonts: {
        display: "'Poppins', sans-serif",
        body: "'Poppins', sans-serif",
      },
      shape: {
        radius: 8,
        radiusLg: 12,
      },
    },
  },
  {
    id: "candy-land-dark-preset",
    name: "Candy Land Dark",
    config: {
      colors: {
        background: "#1a1d23",
        surface: "#2f3436",
        surfaceMuted: "#33cc33",
        border: "#444444",
        foreground: "#e5e5e5",
        foregroundSoft: "#a3a3a3",
        accent: "#ff99cc",
        accentForeground: "#000000",
        success: "#33cc33",
        danger: "#ef4444",
      },
      fonts: {
        display: "'Poppins', sans-serif",
        body: "'Poppins', sans-serif",
      },
      shape: {
        radius: 8,
        radiusLg: 12,
      },
    },
  },
  {
    id: "catppuccin-light-preset",
    name: "Catppuccin Light",
    config: {
      colors: {
        background: "#eff1f5",
        surface: "#ffffff",
        surfaceMuted: "#ccd0da",
        border: "#bcc0cc",
        foreground: "#4c4f69",
        foregroundSoft: "#6c6f85",
        accent: "#8839ef",
        accentForeground: "#ffffff",
        success: "#40a02b",
        danger: "#d20f39",
      },
      fonts: {
        display: "'Montserrat', sans-serif",
        body: "'Montserrat', sans-serif",
      },
      shape: {
        radius: 6,
        radiusLg: 10,
      },
    },
  },
  {
    id: "catppuccin-dark-preset",
    name: "Catppuccin Dark",
    config: {
      colors: {
        background: "#181825",
        surface: "#1e1e2e",
        surfaceMuted: "#585b70",
        border: "#313244",
        foreground: "#cdd6f4",
        foregroundSoft: "#a6adc8",
        accent: "#cba6f7",
        accentForeground: "#1e1e2e",
        success: "#a6e3a1",
        danger: "#f38ba8",
      },
      fonts: {
        display: "'Montserrat', sans-serif",
        body: "'Montserrat', sans-serif",
      },
      shape: {
        radius: 6,
        radiusLg: 10,
      },
    },
  },
  {
    id: "claude-light-preset",
    name: "Claude Light",
    config: {
      colors: {
        background: "#faf9f5",
        surface: "#faf9f5",
        surfaceMuted: "#e9e6dc",
        border: "#dad9d4",
        foreground: "#3d3929",
        foregroundSoft: "#83827d",
        accent: "#c96442",
        accentForeground: "#ffffff",
        success: "#10b981",
        danger: "#141413",
      },
      fonts: {
        display: "system-ui, sans-serif",
        body: "system-ui, sans-serif",
      },
      shape: {
        radius: 8,
        radiusLg: 12,
      },
    },
  },
  {
    id: "claude-dark-preset",
    name: "Claude Dark",
    config: {
      colors: {
        background: "#262624",
        surface: "#262624",
        surfaceMuted: "#1b1b19",
        border: "#3e3e38",
        foreground: "#c3c0b6",
        foregroundSoft: "#b7b5a9",
        accent: "#d97757",
        accentForeground: "#ffffff",
        success: "#10b981",
        danger: "#ef4444",
      },
      fonts: {
        display: "system-ui, sans-serif",
        body: "system-ui, sans-serif",
      },
      shape: {
        radius: 8,
        radiusLg: 12,
      },
    },
  },
  {
    id: "claymorphism-light-preset",
    name: "Claymorphism Light",
    config: {
      colors: {
        background: "#e7e5e4",
        surface: "#f5f5f4",
        surfaceMuted: "#d6d3d1",
        border: "#d6d3d1",
        foreground: "#1e293b",
        foregroundSoft: "#6b7280",
        accent: "#6366f1",
        accentForeground: "#ffffff",
        success: "#10b981",
        danger: "#ef4444",
      },
      fonts: {
        display: "'Plus Jakarta Sans', sans-serif",
        body: "'Plus Jakarta Sans', sans-serif",
      },
      shape: {
        radius: 20,
        radiusLg: 24,
      },
    },
  },
  {
    id: "claymorphism-dark-preset",
    name: "Claymorphism Dark",
    config: {
      colors: {
        background: "#1e1b18",
        surface: "#2c2825",
        surfaceMuted: "#3a3633",
        border: "#3a3633",
        foreground: "#e2e8f0",
        foregroundSoft: "#9ca3af",
        accent: "#818cf8",
        accentForeground: "#1e1b18",
        success: "#10b981",
        danger: "#ef4444",
      },
      fonts: {
        display: "'Plus Jakarta Sans', sans-serif",
        body: "'Plus Jakarta Sans', sans-serif",
      },
      shape: {
        radius: 20,
        radiusLg: 24,
      },
    },
  },
  {
    id: "clean-slate-light-preset",
    name: "Clean Slate Light",
    config: {
      colors: {
        background: "#f8fafc",
        surface: "#ffffff",
        surfaceMuted: "#e5e7eb",
        border: "#d1d5db",
        foreground: "#1e293b",
        foregroundSoft: "#6b7280",
        accent: "#6366f1",
        accentForeground: "#ffffff",
        success: "#10b981",
        danger: "#ef4444",
      },
      fonts: {
        display: "'Inter', sans-serif",
        body: "'Inter', sans-serif",
      },
      shape: {
        radius: 8,
        radiusLg: 12,
      },
    },
  },
  {
    id: "clean-slate-dark-preset",
    name: "Clean Slate Dark",
    config: {
      colors: {
        background: "#0f172a",
        surface: "#1e293b",
        surfaceMuted: "#2d3748",
        border: "#4b5563",
        foreground: "#e2e8f0",
        foregroundSoft: "#9ca3af",
        accent: "#818cf8",
        accentForeground: "#0f172a",
        success: "#10b981",
        danger: "#ef4444",
      },
      fonts: {
        display: "'Inter', sans-serif",
        body: "'Inter', sans-serif",
      },
      shape: {
        radius: 8,
        radiusLg: 12,
      },
    },
  },
  {
    id: "cosmic-night-light-preset",
    name: "Cosmic Night Light",
    config: {
      colors: {
        background: "#f5f5ff",
        surface: "#ffffff",
        surfaceMuted: "#e4dfff",
        border: "#e0e0f0",
        foreground: "#2a2a4a",
        foregroundSoft: "#6c6c8a",
        accent: "#6e56cf",
        accentForeground: "#ffffff",
        success: "#5d5fef",
        danger: "#ff5470",
      },
      fonts: {
        display: "'Inter', sans-serif",
        body: "'Inter', sans-serif",
      },
      shape: {
        radius: 8,
        radiusLg: 12,
      },
    },
  },
  {
    id: "cosmic-night-dark-preset",
    name: "Cosmic Night Dark",
    config: {
      colors: {
        background: "#0f0f1a",
        surface: "#1a1a2e",
        surfaceMuted: "#2d2b55",
        border: "#303052",
        foreground: "#e2e2f5",
        foregroundSoft: "#a0a0c0",
        accent: "#a48fff",
        accentForeground: "#0f0f1a",
        success: "#64b5f6",
        danger: "#ff5470",
      },
      fonts: {
        display: "'Inter', sans-serif",
        body: "'Inter', sans-serif",
      },
      shape: {
        radius: 8,
        radiusLg: 12,
      },
    },
  },
  {
    id: "cyberpunk-light-preset",
    name: "Cyberpunk Light",
    config: {
      colors: {
        background: "#f8f9fa",
        surface: "#ffffff",
        surfaceMuted: "#f0f0ff",
        border: "#dfe6e9",
        foreground: "#0c0c1d",
        foregroundSoft: "#0c0c1d",
        accent: "#ff00c8",
        accentForeground: "#ffffff",
        success: "#00e5ff",
        danger: "#ff3d00",
      },
      fonts: {
        display: "'Outfit', sans-serif",
        body: "'Outfit', sans-serif",
      },
      shape: {
        radius: 8,
        radiusLg: 12,
      },
    },
  },
  {
    id: "cyberpunk-dark-preset",
    name: "Cyberpunk Dark",
    config: {
      colors: {
        background: "#0c0c1d",
        surface: "#1e1e3f",
        surfaceMuted: "#1e1e3f",
        border: "#2e2e5e",
        foreground: "#eceff4",
        foregroundSoft: "#8085a6",
        accent: "#ff00c8",
        accentForeground: "#ffffff",
        success: "#00e5ff",
        danger: "#ff3d00",
      },
      fonts: {
        display: "'Outfit', sans-serif",
        body: "'Outfit', sans-serif",
      },
      shape: {
        radius: 8,
        radiusLg: 12,
      },
    },
  },
  {
    id: "darkmater-light-preset",
    name: "Darkmater Light",
    config: {
      colors: {
        background: "#ffffff",
        surface: "#ffffff",
        surfaceMuted: "#527575",
        border: "#e5e7eb",
        foreground: "#111827",
        foregroundSoft: "#6b7280",
        accent: "#d87943",
        accentForeground: "#ffffff",
        success: "#5f8787",
        danger: "#ef4444",
      },
      fonts: {
        display: "'Geist Mono', monospace",
        body: "'Geist Mono', monospace",
      },
      shape: {
        radius: 12,
        radiusLg: 16,
      },
    },
  },
  {
    id: "darkmater-dark-preset",
    name: "Darkmater Dark",
    config: {
      colors: {
        background: "#121113",
        surface: "#121212",
        surfaceMuted: "#5f8787",
        border: "#222222",
        foreground: "#c1c1c1",
        foregroundSoft: "#888888",
        accent: "#e78a53",
        accentForeground: "#121113",
        success: "#5f8787",
        danger: "#5f8787",
      },
      fonts: {
        display: "'Geist Mono', monospace",
        body: "'Geist Mono', monospace",
      },
      shape: {
        radius: 12,
        radiusLg: 16,
      },
    },
  },
  {
    id: "doon-64-light-preset",
    name: "Doon 64 Light",
    config: {
      colors: {
        background: "#cccccc",
        surface: "#b0b0b0",
        surfaceMuted: "#556b2f",
        border: "#505050",
        foreground: "#1f1f1f",
        foregroundSoft: "#4a4a4a",
        accent: "#b71c1c",
        accentForeground: "#ffffff",
        success: "#4682b4",
        danger: "#ff6f00",
      },
      fonts: {
        display: "'Oxanium', sans-serif",
        body: "'Oxanium', sans-serif",
      },
      shape: {
        radius: 0,
        radiusLg: 0,
      },
    },
  },
  {
    id: "doon-64-dark-preset",
    name: "Doon 64 Dark",
    config: {
      colors: {
        background: "#1a1a1a",
        surface: "#2a2a2a",
        surfaceMuted: "#689f38",
        border: "#4a4a4a",
        foreground: "#e0e0e0",
        foregroundSoft: "#a0a0a0",
        accent: "#e53935",
        accentForeground: "#ffffff",
        success: "#64b5f6",
        danger: "#ffa000",
      },
      fonts: {
        display: "'Oxanium', sans-serif",
        body: "'Oxanium', sans-serif",
      },
      shape: {
        radius: 0,
        radiusLg: 0,
      },
    },
  },
  {
    id: "elegant-luxury-light-preset",
    name: "Elegant Luxury Light",
    config: {
      colors: {
        background: "#faf7f5",
        surface: "#faf7f5",
        surfaceMuted: "#fdf2d6",
        border: "#f5e8d2",
        foreground: "#1a1a1a",
        foregroundSoft: "#57534e",
        accent: "#9b2c2c",
        accentForeground: "#ffffff",
        success: "#b45309",
        danger: "#991b1b",
      },
      fonts: {
        display: "'Poppins', sans-serif",
        body: "'Poppins', sans-serif",
      },
      shape: {
        radius: 6,
        radiusLg: 10,
      },
    },
  },
  {
    id: "elegant-luxury-dark-preset",
    name: "Elegant Luxury Dark",
    config: {
      colors: {
        background: "#1c1917",
        surface: "#292524",
        surfaceMuted: "#92400e",
        border: "#44403c",
        foreground: "#f5f5f4",
        foregroundSoft: "#d6d3d1",
        accent: "#b91c1c",
        accentForeground: "#faf7f5",
        success: "#f59e0b",
        danger: "#ef4444",
      },
      fonts: {
        display: "'Poppins', sans-serif",
        body: "'Poppins', sans-serif",
      },
      shape: {
        radius: 6,
        radiusLg: 10,
      },
    },
  },
  {
    id: "kodama-grove-light-preset",
    name: "Kodama Grove Light",
    config: {
      colors: {
        background: "#e4d7b0",
        surface: "#e7dbbf",
        surfaceMuted: "#decea0",
        border: "#b19681",
        foreground: "#5c4b3e",
        foregroundSoft: "#85766a",
        accent: "#8d9d4f",
        accentForeground: "#fdfbf6",
        success: "#9db18c",
        danger: "#d98b7e",
      },
      fonts: {
        display: "'Merriweather', serif",
        body: "'Merriweather', serif",
      },
      shape: {
        radius: 6,
        radiusLg: 10,
      },
    },
  },
  {
    id: "kodama-grove-dark-preset",
    name: "Kodama Grove Dark",
    config: {
      colors: {
        background: "#3a3529",
        surface: "#413c33",
        surfaceMuted: "#5a5345",
        border: "#5a5345",
        foreground: "#ede4d4",
        foregroundSoft: "#a8a096",
        accent: "#8a9f7b",
        accentForeground: "#2a2521",
        success: "#8a9f7b",
        danger: "#b5766a",
      },
      fonts: {
        display: "'Merriweather', serif",
        body: "'Merriweather', serif",
      },
      shape: {
        radius: 6,
        radiusLg: 10,
      },
    },
  },
  {
    id: "midnight-bloom-light-preset",
    name: "Midnight Bloom Light",
    config: {
      colors: {
        background: "#f9f9f9",
        surface: "#ffffff",
        surfaceMuted: "#a1c9f2",
        border: "#d4d4d4",
        foreground: "#333333",
        foregroundSoft: "#6e6e6e",
        accent: "#6c5ce7",
        accentForeground: "#ffffff",
        success: "#8b9467",
        danger: "#ef4444",
      },
      fonts: {
        display: "'Montserrat', sans-serif",
        body: "'Montserrat', sans-serif",
      },
      shape: {
        radius: 8,
        radiusLg: 12,
      },
    },
  },
  {
    id: "midnight-bloom-dark-preset",
    name: "Midnight Bloom Dark",
    config: {
      colors: {
        background: "#1a1d23",
        surface: "#2f3436",
        surfaceMuted: "#4b0082",
        border: "#444444",
        foreground: "#e5e5e5",
        foregroundSoft: "#a3a3a3",
        accent: "#6c5ce7",
        accentForeground: "#ffffff",
        success: "#6495ed",
        danger: "#ef4444",
      },
      fonts: {
        display: "'Montserrat', sans-serif",
        body: "'Montserrat', sans-serif",
      },
      shape: {
        radius: 8,
        radiusLg: 12,
      },
    },
  },
  {
    id: "mochaa-mouse-light-preset",
    name: "Mochaa Mouse Light",
    config: {
      colors: {
        background: "#f1f0e5",
        surface: "#f1f0e5",
        surfaceMuted: "#baab92",
        border: "#baab92",
        foreground: "#56453f",
        foregroundSoft: "#8a655a",
        accent: "#a37764",
        accentForeground: "#ffffff",
        success: "#8a655a",
        danger: "#1f1a17",
      },
      fonts: {
        display: "'DM Sans', sans-serif",
        body: "'DM Sans', sans-serif",
      },
      shape: {
        radius: 8,
        radiusLg: 12,
      },
    },
  },
  {
    id: "mochaa-mouse-dark-preset",
    name: "Mochaa Mouse Dark",
    config: {
      colors: {
        background: "#2d2521",
        surface: "#3c332e",
        surfaceMuted: "#8a655a",
        border: "#56453f",
        foreground: "#f1f0e5",
        foregroundSoft: "#c5aa9b",
        accent: "#c39e88",
        accentForeground: "#2d2521",
        success: "#baab92",
        danger: "#e57373",
      },
      fonts: {
        display: "'DM Sans', sans-serif",
        body: "'DM Sans', sans-serif",
      },
      shape: {
        radius: 8,
        radiusLg: 12,
      },
    },
  },
  {
    id: "nature-light-preset",
    name: "Nature Light",
    config: {
      colors: {
        background: "#f8f5f0",
        surface: "#f8f5f0",
        surfaceMuted: "#e8f5e9",
        border: "#e0d6c9",
        foreground: "#3e2723",
        foregroundSoft: "#6d4c41",
        accent: "#2e7d32",
        accentForeground: "#ffffff",
        success: "#4caf50",
        danger: "#c62828",
      },
      fonts: {
        display: "'Montserrat', sans-serif",
        body: "'Montserrat', sans-serif",
      },
      shape: {
        radius: 8,
        radiusLg: 12,
      },
    },
  },
  {
    id: "nature-dark-preset",
    name: "Nature Dark",
    config: {
      colors: {
        background: "#1c2a1f",
        surface: "#2d3a2e",
        surfaceMuted: "#3e4a3d",
        border: "#3e4a3d",
        foreground: "#f0ebe5",
        foregroundSoft: "#d7cfc4",
        accent: "#4caf50",
        accentForeground: "#0a1f0c",
        success: "#81c784",
        danger: "#c62828",
      },
      fonts: {
        display: "'Montserrat', sans-serif",
        body: "'Montserrat', sans-serif",
      },
      shape: {
        radius: 8,
        radiusLg: 12,
      },
    },
  },
  {
    id: "neo-brutalism-light-preset",
    name: "Neo Brutalism Light",
    config: {
      colors: {
        background: "#ffffff",
        surface: "#ffffff",
        surfaceMuted: "#ffff00",
        border: "#000000",
        foreground: "#000000",
        foregroundSoft: "#333333",
        accent: "#ff3333",
        accentForeground: "#ffffff",
        success: "#0066ff",
        danger: "#000000",
      },
      fonts: {
        display: "'DM Sans', sans-serif",
        body: "'DM Sans', sans-serif",
      },
      shape: {
        radius: 0,
        radiusLg: 0,
      },
    },
  },
  {
    id: "neo-brutalism-dark-preset",
    name: "Neo Brutalism Dark",
    config: {
      colors: {
        background: "#000000",
        surface: "#333333",
        surfaceMuted: "#ffff33",
        border: "#ffffff",
        foreground: "#ffffff",
        foregroundSoft: "#cccccc",
        accent: "#ff6666",
        accentForeground: "#000000",
        success: "#3399ff",
        danger: "#ffffff",
      },
      fonts: {
        display: "'DM Sans', sans-serif",
        body: "'DM Sans', sans-serif",
      },
      shape: {
        radius: 0,
        radiusLg: 0,
      },
    },
  },
  {
    id: "northern-light-light-preset",
    name: "Northern Light",
    config: {
      colors: {
        background: "#f9f9fa",
        surface: "#ffffff",
        surfaceMuted: "#6495ed",
        border: "#d4d4d4",
        foreground: "#333333",
        foregroundSoft: "#6e6e6e",
        accent: "#34a85a",
        accentForeground: "#ffffff",
        success: "#66d9ef",
        danger: "#ef4444",
      },
      fonts: {
        display: "'Plus Jakarta Sans', sans-serif",
        body: "'Plus Jakarta Sans', sans-serif",
      },
      shape: {
        radius: 8,
        radiusLg: 12,
      },
    },
  },
  {
    id: "northern-light-dark-preset",
    name: "Northern Light Dark",
    config: {
      colors: {
        background: "#1a1d23",
        surface: "#2f3436",
        surfaceMuted: "#4682b4",
        border: "#444444",
        foreground: "#e5e5e5",
        foregroundSoft: "#a3a3a3",
        accent: "#34a85a",
        accentForeground: "#ffffff",
        success: "#6495ed",
        danger: "#ef4444",
      },
      fonts: {
        display: "'Plus Jakarta Sans', sans-serif",
        body: "'Plus Jakarta Sans', sans-serif",
      },
      shape: {
        radius: 8,
        radiusLg: 12,
      },
    },
  },
  {
    id: "notebook-light-preset",
    name: "Notebook Light",
    config: {
      colors: {
        background: "#f9f9f9",
        surface: "#ffffff",
        surfaceMuted: "#dedede",
        border: "#747272",
        foreground: "#3a3a3a",
        foregroundSoft: "#505050",
        accent: "#606060",
        accentForeground: "#f0f0f0",
        success: "#f3eac8",
        danger: "#c87a7a",
      },
      fonts: {
        display: "'Architects Daughter', sans-serif",
        body: "'Architects Daughter', sans-serif",
      },
      shape: {
        radius: 10,
        radiusLg: 14,
      },
    },
  },
  {
    id: "notebook-dark-preset",
    name: "Notebook Dark",
    config: {
      colors: {
        background: "#2b2b2b",
        surface: "#333333",
        surfaceMuted: "#5a5a5a",
        border: "#4f4f4f",
        foreground: "#dcdcdc",
        foregroundSoft: "#a0a0a0",
        accent: "#b0b0b0",
        accentForeground: "#2b2b2b",
        success: "#e0e0e0",
        danger: "#d9afaf",
      },
      fonts: {
        display: "'Architects Daughter', sans-serif",
        body: "'Architects Daughter', sans-serif",
      },
      shape: {
        radius: 10,
        radiusLg: 14,
      },
    },
  },
  {
    id: "solar-dusk-light-preset",
    name: "Solar Dusk Light",
    config: {
      colors: {
        background: "#fdfbf7",
        surface: "#f8f4ee",
        surfaceMuted: "#e4c090",
        border: "#e4d9bc",
        foreground: "#4a3b33",
        foregroundSoft: "#78716c",
        accent: "#b45309",
        accentForeground: "#ffffff",
        success: "#a16207",
        danger: "#991b1b",
      },
      fonts: {
        display: "'Oxanium', sans-serif",
        body: "'Oxanium', sans-serif",
      },
      shape: {
        radius: 4,
        radiusLg: 8,
      },
    },
  },
  {
    id: "solar-dusk-dark-preset",
    name: "Solar Dusk Dark",
    config: {
      colors: {
        background: "#1c1917",
        surface: "#292524",
        surfaceMuted: "#57534e",
        border: "#44403c",
        foreground: "#f5f5f4",
        foregroundSoft: "#a8a29e",
        accent: "#f97316",
        accentForeground: "#ffffff",
        success: "#0ea5e9",
        danger: "#dc2626",
      },
      fonts: {
        display: "'Oxanium', sans-serif",
        body: "'Oxanium', sans-serif",
      },
      shape: {
        radius: 4,
        radiusLg: 8,
      },
    },
  },
];
