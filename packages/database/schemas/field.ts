import { z } from "zod";
import { FIELD_TYPES } from "../constants/field-types";
import { uuidSchema } from "./common";

/**
 * Field option schema (for single_select, multi_select).
 */
const fieldOptionSchema = z.object({
  label: z.string().min(1).max(255).trim(),
  value: z.string().min(1).max(255).trim(),
  imageUrl: z.string().url().optional().nullable(),
});

/**
 * Field validation rules schema.
 */
const fieldValidationsSchema = z
  .object({
    minLength: z.number().int().min(0).optional(),
    maxLength: z.number().int().min(0).optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    pattern: z.string().optional(),
    patternMessage: z.string().optional(),
  })
  .optional();

/**
 * Field settings schema.
 */
const fieldSettingsSchema = z
  .object({
    ratingMax: z.number().int().min(1).max(10).optional(),
    placeholder: z.string().max(255).optional(),
  })
  .optional();

/**
 * Create field input schema.
 */
export const createFieldSchema = z.object({
  formId: uuidSchema,
  pageId: uuidSchema.optional(),
  type: z.enum(FIELD_TYPES),
  label: z.string().min(1, "Label is required").max(500).trim(),
  placeholder: z.string().max(255).trim().optional(),
  helpText: z.string().max(500).trim().optional(),
  required: z.boolean().default(false),
  options: z.array(fieldOptionSchema).optional(),
  validations: fieldValidationsSchema,
  settings: fieldSettingsSchema,
});

/**
 * Update field input schema.
 */
export const updateFieldSchema = z.object({
  fieldId: uuidSchema,
  type: z.enum(FIELD_TYPES).optional(),
  label: z.string().min(1).max(500).trim().optional(),
  placeholder: z.string().max(255).trim().optional(),
  helpText: z.string().max(500).trim().optional(),
  required: z.boolean().optional(),
  options: z.array(fieldOptionSchema).optional(),
  validations: fieldValidationsSchema,
  settings: fieldSettingsSchema,
});

/**
 * Reorder fields input schema.
 */
export const reorderFieldsSchema = z.object({
  formId: uuidSchema,
  fieldIds: z.array(uuidSchema).min(1, "At least one field ID is required"),
});
