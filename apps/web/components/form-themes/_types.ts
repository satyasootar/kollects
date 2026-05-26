import { z } from "zod";

export const themeConfigSchema = z.object({
  id: z.string().regex(/^[a-z0-9.-]+$/),
  name: z.string(),
  category: z.enum([
    "marvel", "dc", "os", "nature", "city", "custom",
    "startup", "tech", "anime", "game", "event", "community",
  ]),
  colorScheme: z.enum(["light", "dark"]),
  thumbnailUrl: z.string().url().optional(),
  colors: z.object({
    background: z.string(),
    backgroundOverlay: z.string().optional(),
    surface: z.string(),
    surfaceMuted: z.string(),
    border: z.string(),
    foreground: z.string(),
    foregroundSoft: z.string(),
    accent: z.string(),
    accentForeground: z.string(),
    success: z.string(),
    danger: z.string(),
  }),
  fonts: z.object({
    display: z.string(),
    body: z.string(),
    mono: z.string().optional(),
    weights: z.object({ display: z.number(), body: z.number() }),
    scale: z.object({
      hero: z.number(),
      question: z.number(),
      body: z.number(),
      helper: z.number(),
    }),
    letterSpacing: z.object({
      hero: z.string().optional(),
      question: z.string().optional(),
    }).optional(),
    textTransform: z.enum(["uppercase", "none"]).optional(),
  }),
  shape: z.object({
    radius: z.number(),
    radiusLg: z.number(),
    border: z.object({
      width: z.number(),
      style: z.enum(["solid", "dashed", "double"]),
      color: z.string(),
    }),
    shadow: z.string(),
    shadowFocus: z.string(),
  }),
  motion: z.object({
    questionEnter: z.enum([
      "slide-up", "slide-side", "fade", "type-on",
      "comic-pop", "boot-up", "leaf-fall", "rain-in", "snow-in",
    ]),
    transitionMs: z.number(),
    easing: z.string(),
    cursor: z.string().optional(),
    backgroundMotion: z.enum([
      "drift", "rain", "snow", "leaves", "rivets",
      "matrix", "scanlines", "none",
    ]).optional(),
  }),
  stickers: z.object({
    hero: z.string().optional(),
    fieldMarker: z.string().optional(),
    submitIcon: z.string().optional(),
    successHero: z.string().optional(),
    confetti: z.any().optional(),
  }),
  chrome: z.object({
    progressBar: z.enum([
      "bar", "dots", "stepper", "comic-panels",
      "loading-bar-xp", "terminal-cursor",
    ]),
    questionLayout: z.enum([
      "centered", "left-aligned", "split", "card-stack",
    ]),
    submitButtonVariant: z.enum([
      "marker", "comic-burst", "metallic", "leaf", "neon", "terminal",
    ]),
  }),
  audio: z.object({
    keystroke: z.string().optional(),
    pageAdvance: z.string().optional(),
    submit: z.string().optional(),
  }).optional(),
});

export type ThemeConfig = z.infer<typeof themeConfigSchema>;
export type ThemeCategory = ThemeConfig["category"];
export type QuestionLayout = ThemeConfig["chrome"]["questionLayout"];
export type ProgressBarStyle = ThemeConfig["chrome"]["progressBar"];
export type QuestionEnterAnimation = ThemeConfig["motion"]["questionEnter"];
