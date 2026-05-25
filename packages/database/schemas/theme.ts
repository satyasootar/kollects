import { z } from "zod";

/**
 * Create theme input schema.
 */
export const createThemeSchema = z.object({
  name: z.string().min(1, "Name is required").max(100).trim(),
  description: z.string().max(500).trim().optional(),
  category: z.enum(["movies", "anime", "os", "startups", "communities", "games", "minimal"]),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color"),
  backgroundColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color"),
  surfaceColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color"),
  textColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color"),
  accentColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color")
    .optional(),
  errorColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color")
    .optional(),
  fontFamily: z.string().max(100).optional(),
  headingFontFamily: z.string().max(100).optional(),
  backgroundImageUrl: z.string().url().optional().nullable(),
  backgroundGradient: z.string().max(500).optional(),
  borderRadius: z.string().max(20).optional(),
  customCss: z.string().max(5000).optional(),
  isPublic: z.boolean().default(true),
});

/**
 * Update theme input schema.
 */
export const updateThemeSchema = createThemeSchema.partial().extend({
  themeId: z.string().uuid(),
});
