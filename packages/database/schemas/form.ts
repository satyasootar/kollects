import { z } from "zod";
import { FORM_VISIBILITIES } from "../constants/form-visibility";
import { uuidSchema } from "./common";

/**
 * Create form input schema.
 */
export const createFormSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(255, "Title must be at most 255 characters")
    .trim(),
  description: z.string().max(2000).trim().optional(),
  visibility: z.enum(FORM_VISIBILITIES).default("public"),
});

/**
 * Update form input schema.
 */
export const updateFormSchema = z.object({
  formId: uuidSchema,
  title: z.string().min(1).max(255).trim().optional(),
  description: z.string().max(2000).trim().optional(),
  slug: z.string().max(255).trim().optional(),
  themeId: z.string().max(255).optional(),
  visibility: z.enum(FORM_VISIBILITIES).optional(),
  coverImageUrl: z.string().url().optional().nullable(),
  metaTitle: z.string().max(60).trim().optional(),
  metaDescription: z.string().max(160).trim().optional(),
  settings: z
    .object({
      successMessage: z.string().max(500).optional(),
      redirectUrl: z.string().url().optional().nullable(),
      showProgressBar: z.boolean().optional(),
      allowMultipleSubmissions: z.boolean().optional(),
      customTheme: z.any().optional(),
    })
    .optional(),
});

/**
 * Publish form input schema.
 */
export const publishFormSchema = z.object({
  formId: uuidSchema,
});
