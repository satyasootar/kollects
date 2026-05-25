import { z } from "zod";
import { uuidSchema, paginationSchema } from "./common";

/**
 * Submit response input schema.
 * The answers map uses field IDs as keys and accepts any valid answer value.
 */
export const submitResponseSchema = z.object({
  slug: z.string().min(1, "Form slug is required"),
  answers: z.record(
    z.string(), // fieldId
    z.union([
      z.string(),
      z.number(),
      z.boolean(),
      z.array(z.string()), // multi_select
      z.null(),
    ]),
  ),
  metadata: z
    .object({
      respondentEmail: z.string().email().optional(),
      respondentName: z.string().max(255).optional(),
      referrer: z.string().url().optional().nullable(),
    })
    .optional(),
});

/**
 * List responses input schema.
 */
export const listResponsesSchema = z.object({
  formId: uuidSchema,
  isComplete: z.boolean().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  ...paginationSchema.shape,
});
