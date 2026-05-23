import { z } from "zod";
import { uuidSchema } from "./common";

/**
 * Create template from existing form input schema.
 */
export const createTemplateSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be at most 100 characters")
    .trim(),
  description: z.string().max(500).trim().optional(),
  category: z.string().min(1).max(50).trim(),
  formId: uuidSchema,
});

/**
 * Use template to create a new form input schema.
 */
export const useTemplateSchema = z.object({
  templateId: uuidSchema,
});
